"use client";

import { useDeferredValue, useEffect, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleCheckBig,
  CircleDollarSign,
  Eye,
  FileBadge2,
  Gift,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Wallet,
  X,
  XCircle
} from "lucide-react";

import { BenefitBadge } from "@/components/payments/benefit-badge";
import { FiltersBar } from "@/components/payments/filters-bar";
import { StatusBadge } from "@/components/payments/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ToastStack, type ToastItem } from "@/components/ui/toast-stack";
import { getResumoDashboard } from "@/services/dashboard-service";
import { getPagamentosByLote } from "@/services/lote-payments-service";
import { getPagamentoById } from "@/services/payment-details-service";
import { approvePaymentById } from "@/services/payment-approval-service";
import { rejectPaymentById } from "@/services/payment-rejection-service";
import { approveSelectedPayments } from "@/services/batch-selected-approval-service";
import { approveBatch } from "@/services/batch-approval-service";
import {
  formatBenefitType,
  formatCurrency,
  formatDate,
  formatDocument
} from "@/lib/formatters";
import { cn, normalizeText } from "@/lib/utils";
import { type BenefitType, type Payment, type PaymentBatch, type PaymentStatus, type ResumoDashboard } from "@/types/payments";

type DashboardShellProps = {
  initialBatches: PaymentBatch[];
  initialSummary: ResumoDashboard | null;
};

type BenefitFilterOption = "ALL" | BenefitType;
type StatusFilterOption = "ALL" | PaymentStatus;
type ActivePaymentState = {
  batchId: string;
  paymentId: string;
} | null;
type VisibleBatch = PaymentBatch & {
  visiblePayments: Payment[];
  hasPaymentDetails: boolean;
};

type SummaryTone = "blue" | "teal" | "slate";

let toastCounter = 0;

export function DashboardShell({ initialBatches, initialSummary }: DashboardShellProps) {
  const [batches, setBatches] = useState(initialBatches);
  const [filterType, setFilterType] = useState<BenefitFilterOption>("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusFilterOption>("ALL");
  const [search, setSearch] = useState("");
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialBatches.map((batch) => [batch.id, false]))
  );
  const [selectedByBatch, setSelectedByBatch] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      initialBatches.map((batch) => [
        batch.id,
        (batch.payments ?? []).filter((payment) => payment.status === "PENDING").map((payment) => payment.id)
      ])
    )
  );
  const [activePayment, setActivePayment] = useState<ActivePaymentState>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [remoteSummary, setRemoteSummary] = useState<ResumoDashboard | null>(initialSummary);
  const [hasLocalMutations, setHasLocalMutations] = useState(false);
  const [loadingBatchPayments, setLoadingBatchPayments] = useState<Record<string, boolean>>({});
  const [loadedBatchPayments, setLoadedBatchPayments] = useState<Record<string, boolean>>({});
  const [paymentDetailsById, setPaymentDetailsById] = useState<Record<string, Payment>>({});
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [processingBatchId, setProcessingBatchId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = normalizeText(deferredSearch);

  function notify(title: string, description: string, tone: ToastItem["tone"]) {
    const id = toastCounter++;

    setToasts((current) => [...current, { id, title, description, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3400);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const data = await getResumoDashboard();

        if (isMounted) {
          setRemoteSummary(data);
        }
      } catch {
        if (isMounted && !initialSummary) {
          setRemoteSummary(null);
        }
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, [initialSummary]);

  useEffect(() => {
    initialBatches.forEach((batch) => {
      void loadBatchPayments(batch.id);
    });
  }, [initialBatches]);

  const visibleBatches = batches
    .filter((batch) => filterType === "ALL" || batch.benefitType === filterType)
    .map((batch) => {
      const batchPayments = batch.payments ?? [];
      const batchMatchesSearch = matchesBatchSearch(batch, normalizedSearch);
      const hasPaymentDetails = batchPayments.length > 0;
      const matchesStatus = filterStatus === "ALL" || matchesLoteStatus(batch, filterStatus);
      const visiblePayments = batchPayments.filter((payment) => {
        const matchesPaymentStatus = filterStatus === "ALL" || payment.status === filterStatus;
        const matchesPaymentText =
          normalizedSearch.length === 0 || batchMatchesSearch || matchesPaymentSearch(payment, normalizedSearch);

        return matchesPaymentStatus && matchesPaymentText;
      });

      const isVisible = hasPaymentDetails
        ? normalizedSearch.length === 0
          ? filterStatus === "ALL" || visiblePayments.length > 0
          : batchMatchesSearch || visiblePayments.length > 0
        : matchesStatus && (normalizedSearch.length === 0 || batchMatchesSearch);

      return {
        ...batch,
        payments: batchPayments,
        visiblePayments,
        hasPaymentDetails,
        isVisible
      };
    })
    .filter((batch) => batch.isVisible)
    .map(({ isVisible, ...batch }) => batch);
  const activeBatch = activePayment ? batches.find((batch) => batch.id === activePayment.batchId) : undefined;
  const currentPayment = activePayment
    ? paymentDetailsById[activePayment.paymentId] ??
      activeBatch?.payments?.find((payment) => payment.id === activePayment.paymentId)
    : undefined;
  const localSummary = buildDashboardSummary(batches);
  const summary = hasLocalMutations ? localSummary : remoteSummary ?? localSummary;

  function toggleExpanded(batchId: string) {
    const isOpening = !(expandedBatches[batchId] ?? false);

    if (isOpening) {
      void loadBatchPayments(batchId);
    }

    setExpandedBatches((current) => ({
      ...current,
      [batchId]: !current[batchId]
    }));
  }

  async function handleApprovePayment(batchId: string, paymentId: string) {
    if (processingPaymentId === paymentId) {
      return;
    }

    setProcessingPaymentId(paymentId);

    try {
      const result = await approvePaymentById(paymentId);
      updatePaymentStatus(batchId, String(result.id), result.status);
    } catch {
      notify(
        "Falha ao aprovar pagamento",
        "Nao foi possivel concluir a aprovacao deste pagamento agora.",
        "warning"
      );
    } finally {
      setProcessingPaymentId(null);
    }
  }

  async function handleRejectPayment(batchId: string, paymentId: string) {
    if (processingPaymentId === paymentId) {
      return;
    }

    setProcessingPaymentId(paymentId);

    try {
      const result = await rejectPaymentById(paymentId);
      updatePaymentStatus(batchId, String(result.id), result.status);
    } catch {
      notify(
        "Falha ao rejeitar pagamento",
        "Nao foi possivel concluir a rejeicao deste pagamento agora.",
        "warning"
      );
    } finally {
      setProcessingPaymentId(null);
    }
  }

  async function handleApproveBatch(batchId: string) {
    if (processingBatchId === batchId) {
      return;
    }

    setProcessingBatchId(batchId);

    try {
      const result = await approveBatch(batchId);
      applyApprovedPayments(batchId, result.approvedPaymentIds, "batch");
    } catch {
      notify(
        "Falha ao aprovar lote",
        "Nao foi possivel concluir a aprovacao completa deste lote agora.",
        "warning"
      );
    } finally {
      setProcessingBatchId(null);
    }
  }

  async function handleApproveSelected(batchId: string) {
    const paymentIds = Array.from(new Set(selectedByBatch[batchId] ?? []));

    if (paymentIds.length === 0 || processingBatchId === batchId) {
      return;
    }

    setProcessingBatchId(batchId);

    try {
      const result = await approveSelectedPayments(batchId, paymentIds);
      applyApprovedPayments(batchId, result.approvedPaymentIds, "selected");
    } catch {
      notify(
        "Falha ao aprovar selecionados",
        "Nao foi possivel concluir a aprovacao dos pagamentos selecionados agora.",
        "warning"
      );
    } finally {
      setProcessingBatchId(null);
    }
  }

  function applyApprovedPayments(batchId: string, approvedPaymentIds: string[], mode: "selected" | "batch") {
    const approvedSet = new Set(approvedPaymentIds);
    const batch = batches.find((item) => item.id === batchId);

    setHasLocalMutations(true);

    setBatches((current) =>
      current.map((currentBatch) => {
        if (currentBatch.id !== batchId) {
          return currentBatch;
        }

        const nextPayments = (currentBatch.payments ?? []).map((payment) =>
          approvedSet.has(payment.id) && payment.status === "PENDING"
            ? { ...payment, status: "APPROVED" as const }
            : payment
        );
        const pendingCount = nextPayments.filter((payment) => payment.status === "PENDING").length;
        const approvedCount = nextPayments.filter((payment) => payment.status === "APPROVED").length;
        const rejectedCount = nextPayments.filter((payment) => payment.status === "REJECTED").length;

        return {
          ...currentBatch,
          payments: nextPayments,
          paymentCount: nextPayments.length,
          pendingCount,
          approvedCount,
          rejectedCount
        };
      })
    );

    setPaymentDetailsById((current) => {
      const nextEntries = Object.entries(current).map(([paymentId, detail]) => [
        paymentId,
        approvedSet.has(paymentId) ? { ...detail, status: "APPROVED" as const } : detail
      ]);

      return Object.fromEntries(nextEntries);
    });

    setSelectedByBatch((current) => ({
      ...current,
      [batchId]: (current[batchId] ?? []).filter((paymentId) => !approvedSet.has(paymentId))
    }));

    if (batch) {
      notify(
        mode === "batch" ? "Lote aprovado" : "Selecionados aprovados",
        mode === "batch"
          ? `Todos os pagamentos elegiveis do lote ${batch.batchNumber} foram aprovados com sucesso.`
          : `${approvedPaymentIds.length} pagamento(s) do lote ${batch.batchNumber} foram aprovados com sucesso.`,
        "success"
      );
    }
  }

  async function loadBatchPayments(batchId: string) {
    if (loadingBatchPayments[batchId] || loadedBatchPayments[batchId]) {
      return;
    }

    setLoadingBatchPayments((current) => ({
      ...current,
      [batchId]: true
    }));

    try {
      const payments = await getPagamentosByLote(batchId);

      setBatches((current) =>
        current.map((batch) =>
          batch.id !== batchId
            ? batch
            : {
                ...batch,
                payments
              }
        )
      );

      setSelectedByBatch((current) => ({
        ...current,
        [batchId]: payments.filter((payment) => payment.status === "PENDING").map((payment) => payment.id)
      }));

      setLoadedBatchPayments((current) => ({
        ...current,
        [batchId]: true
      }));
    } catch {
      notify(
        "Falha ao carregar pagamentos",
        "Nao foi possivel buscar os pagamentos deste lote agora. Tente expandir novamente em instantes.",
        "warning"
      );
    } finally {
      setLoadingBatchPayments((current) => ({
        ...current,
        [batchId]: false
      }));
    }
  }

  async function handleShowDetails(batchId: string, paymentId: string) {
    setActivePayment({ batchId, paymentId });

    if (paymentDetailsById[paymentId]) {
      return;
    }

    setLoadingPaymentDetails(true);

    try {
      const payment = await getPagamentoById(paymentId);

      if (!payment) {
        notify(
          "Detalhes indisponiveis",
          "Esse pagamento nao retornou detalhes adicionais no backend. Exibindo apenas os dados ja carregados na lista.",
          "warning"
        );
        return;
      }

      setPaymentDetailsById((current) => ({
        ...current,
        [paymentId]: payment
      }));

      setBatches((current) =>
        current.map((batch) =>
          batch.id !== batchId
            ? batch
            : {
                ...batch,
                payments: (batch.payments ?? []).map((currentPayment) =>
                  currentPayment.id === paymentId ? { ...currentPayment, ...payment } : currentPayment
                )
              }
        )
      );
    } catch {
      notify(
        "Falha ao carregar detalhes",
        "Nao foi possivel buscar os detalhes completos deste pagamento agora.",
        "warning"
      );
    } finally {
      setLoadingPaymentDetails(false);
    }
  }

  function updatePaymentStatus(batchId: string, paymentId: string, status: PaymentStatus) {
    const batch = batches.find((item) => item.id === batchId);
    const payment = batch?.payments?.find((item) => item.id === paymentId);

    setHasLocalMutations(true);

    setBatches((current) =>
      current.map((currentBatch) =>
        currentBatch.id !== batchId
          ? currentBatch
          : {
              ...currentBatch,
              payments: (currentBatch.payments ?? []).map((currentPayment) =>
                currentPayment.id === paymentId ? { ...currentPayment, status } : currentPayment
              )
            }
      )
    );

    setPaymentDetailsById((current) => {
      const detail = current[paymentId];

      if (!detail) {
        return current;
      }

      return {
        ...current,
        [paymentId]: {
          ...detail,
          status
        }
      };
    });

    setSelectedByBatch((current) => {
      const currentSelection = current[batchId] ?? [];
      const nextSelection =
        status === "PENDING"
          ? Array.from(new Set([...currentSelection, paymentId]))
          : currentSelection.filter((id) => id !== paymentId);

      return {
        ...current,
        [batchId]: nextSelection
      };
    });

    if (!batch || !payment) {
      return;
    }

    if (status === "APPROVED") {
      notify(
        "Pagamento aprovado",
        `${payment.beneficiaryName} foi aprovado no lote ${batch.batchNumber}.`,
        "success"
      );
      return;
    }

    if (status === "REJECTED") {
      notify(
        "Pagamento rejeitado",
        `${payment.beneficiaryName} foi retirado do lote ${batch.batchNumber} para revisao.`,
        "warning"
      );
      return;
    }

    notify(
      "Pagamento reativado",
      `${payment.beneficiaryName} voltou para pendente e pode entrar novamente na aprovacao do lote.`,
      "info"
    );
  }

  function approveSelected(batchId: string) {
    const selected = new Set(selectedByBatch[batchId] ?? []);
    const batch = batches.find((item) => item.id === batchId);

    if (selected.size === 0) {
      return;
    }

    setHasLocalMutations(true);

    setBatches((current) =>
      current.map((currentBatch) =>
        currentBatch.id !== batchId
          ? currentBatch
          : {
              ...currentBatch,
              payments: (currentBatch.payments ?? []).map((payment) =>
                selected.has(payment.id) && payment.status === "PENDING"
                  ? { ...payment, status: "APPROVED" }
                  : payment
              )
            }
      )
    );

    setSelectedByBatch((current) => ({
      ...current,
      [batchId]: []
    }));

    if (batch) {
      notify(
        "Lote aprovado",
        `${selected.size} pagamento(s) do lote ${batch.batchNumber} foram aprovados com sucesso.`,
        "success"
      );
    }
  }

  function toggleSelection(batchId: string, paymentId: string, checked: boolean) {
    setSelectedByBatch((current) => {
      const existing = current[batchId] ?? [];
      const nextSelection = checked
        ? Array.from(new Set([...existing, paymentId]))
        : existing.filter((id) => id !== paymentId);

      return {
        ...current,
        [batchId]: nextSelection
      };
    });
  }

  function toggleAllSelections(batchId: string, paymentIds: string[], checked: boolean) {
    setSelectedByBatch((current) => {
      const existing = new Set(current[batchId] ?? []);

      if (checked) {
        paymentIds.forEach((paymentId) => existing.add(paymentId));
      } else {
        paymentIds.forEach((paymentId) => existing.delete(paymentId));
      }

      return {
        ...current,
        [batchId]: Array.from(existing)
      };
    });
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={Layers3}
          label="Total de lotes pendentes"
          value={summary.pendingBatchCount.toString()}
          helper="Lotes com ao menos um pagamento pendente"
          tone="blue"
        />
        <SummaryCard
          icon={CalendarClock}
          label="Total de pagamentos pendentes"
          value={summary.pendingPaymentCount.toString()}
          helper="Itens aguardando aprovacao"
          tone="blue"
        />
        <SummaryCard
          icon={CircleDollarSign}
          label="Valor total pendente"
          value={formatCurrency(summary.pendingTotalAmount)}
          helper="Montante ainda nao liberado"
          tone="teal"
        />
        <SummaryCard
          icon={Wallet}
          label="Quantidade de lotes de Resgate"
          value={summary.resgateBatchCount.toString()}
          helper="Carteira ativa de resgates"
          tone="slate"
        />
        <SummaryCard
          icon={Gift}
          label="Quantidade de lotes de Sorteio"
          value={summary.sorteioBatchCount.toString()}
          helper="Carteira ativa de sorteios"
          tone="slate"
        />
      </div>


      <FiltersBar
        filterType={filterType}
        filterStatus={filterStatus}
        search={search}
        onFilterChange={setFilterType}
        onStatusChange={setFilterStatus}
        onSearchChange={setSearch}
        onReset={() => {
          setFilterType("ALL");
          setFilterStatus("ALL");
          setSearch("");
        }}
        totalResults={visibleBatches.length}
      />
      {visibleBatches.length === 0 ? (
        <EmptyState
          title="Nenhum lote encontrado"
          description="Tente combinar tipo de beneficio, status e busca por nome, documento ou ID do lote para reencontrar os pagamentos desejados."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-1">
          {visibleBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              selectedIds={selectedByBatch[batch.id] ?? []}
              isExpanded={expandedBatches[batch.id] ?? false}
              isLoadingPayments={loadingBatchPayments[batch.id] ?? false}
              hasLoadedPayments={loadedBatchPayments[batch.id] ?? false}
              onApproveBatch={() => void handleApproveBatch(batch.id)}
              onApproveSelected={() => void handleApproveSelected(batch.id)}
              onExpandToggle={() => toggleExpanded(batch.id)}
              onToggleAllSelections={toggleAllSelections}
              onPaymentSelectionChange={toggleSelection}
              onPaymentApprove={(paymentId) => void handleApprovePayment(batch.id, paymentId)}
              onPaymentReject={(paymentId) => void handleRejectPayment(batch.id, paymentId)}
              onPaymentRestore={(paymentId) => updatePaymentStatus(batch.id, paymentId, "PENDING")}
              onShowDetails={(paymentId) => void handleShowDetails(batch.id, paymentId)}
              processingPaymentId={processingPaymentId}
              processingBatchId={processingBatchId}
            />
          ))}
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <PaymentDetailsDrawer
        batch={activeBatch}
        payment={currentPayment}
        isLoading={loadingPaymentDetails}
        processingPaymentId={processingPaymentId}
        onClose={() => setActivePayment(null)}
        onApprove={() => {
          if (!activePayment) {
            return;
          }

          void handleApprovePayment(activePayment.batchId, activePayment.paymentId);
        }}
        onReject={() => {
          if (!activePayment) {
            return;
          }

          void handleRejectPayment(activePayment.batchId, activePayment.paymentId);
        }}
        onRestore={() => {
          if (!activePayment) {
            return;
          }

          updatePaymentStatus(activePayment.batchId, activePayment.paymentId, "PENDING");
        }}
      />
    </section>
  );
}

type SummaryCardProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
  tone: SummaryTone;
};

function SummaryCard({ icon: Icon, label, value, helper, tone }: SummaryCardProps) {
  const toneMap: Record<SummaryTone, string> = {
    blue: "bg-[linear-gradient(180deg,rgba(22,99,214,0.09)_0%,rgba(255,255,255,0.98)_100%)]",
    teal: "bg-[linear-gradient(180deg,rgba(15,118,110,0.1)_0%,rgba(255,255,255,0.98)_100%)]",
    slate: "bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(255,255,255,0.98)_100%)]"
  };

  return (
    <div className={cn("sub-panel relative overflow-hidden px-5 py-5", toneMap[tone])}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--brand)_0%,var(--brand-strong)_100%)]" />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-strong)_100%)] shadow-[0_18px_35px_-24px_rgba(22,99,214,0.8)]">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
          <p className="text-sm text-slate-600">{helper}</p>
        </div>
      </div>
    </div>
  );
}

type BatchCardProps = {
  batch: VisibleBatch;
  selectedIds: string[];
  isExpanded: boolean;
  isLoadingPayments: boolean;
  hasLoadedPayments: boolean;
  onApproveBatch: () => void;
  onApproveSelected: () => void;
  onExpandToggle: () => void;
  onToggleAllSelections: (batchId: string, paymentIds: string[], checked: boolean) => void;
  onPaymentSelectionChange: (batchId: string, paymentId: string, checked: boolean) => void;
  onPaymentApprove: (paymentId: string) => void;
  onPaymentReject: (paymentId: string) => void;
  onPaymentRestore: (paymentId: string) => void;
  onShowDetails: (paymentId: string) => void;
  processingPaymentId: string | null;
  processingBatchId: string | null;
};

function BatchCard({
  batch,
  selectedIds,
  isExpanded,
  isLoadingPayments,
  hasLoadedPayments,
  onApproveBatch,
  onApproveSelected,
  onExpandToggle,
  onToggleAllSelections,
  onPaymentSelectionChange,
  onPaymentApprove,
  onPaymentReject,
  onPaymentRestore,
  onShowDetails,
  processingPaymentId,
  processingBatchId
}: BatchCardProps) {
  const batchPayments = batch.payments ?? [];
  const totalValue = batch.totalAmount ?? batchPayments.reduce((total, payment) => total + payment.grossAmount, 0);
  const paymentCount = batch.paymentCount ?? batchPayments.length;
  const selectedCount = batchPayments.filter(
    (payment) => selectedIds.includes(payment.id) && payment.status === "PENDING"
  ).length;
  const pendingCount = batch.pendingCount ?? batchPayments.filter((payment) => payment.status === "PENDING").length;
  const approvedCount = batch.approvedCount ?? batchPayments.filter((payment) => payment.status === "APPROVED").length;
  const rejectedCount = batch.rejectedCount ?? batchPayments.filter((payment) => payment.status === "REJECTED").length;
  const batchStatus = getPresentationBatchStatus(batch, pendingCount, approvedCount, rejectedCount);
  const hasResolvedPayments = hasLoadedPayments || batch.hasPaymentDetails;
  const actionDisabled =
    pendingCount === 0 || processingBatchId === batch.id || (hasResolvedPayments && pendingCount !== selectedCount);
  const typeAccent =
    batch.benefitType === "SORTEIO"
      ? "bg-[linear-gradient(90deg,#1663d6_0%,#4f9df7_100%)]"
      : "bg-[linear-gradient(90deg,#0f766e_0%,#1f9d8b_100%)]";

  return (
    <article className="panel relative overflow-hidden">
      <div className={cn("absolute inset-x-0 top-0 h-1.5", typeAccent)} />
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <BenefitBadge benefitType={batch.benefitType} className="shadow-none" />
              <StatusBadge status={batchStatus} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Identificador do lote</p>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{batch.batchNumber}</h3>
              <p className="text-sm text-slate-600">
                {formatBenefitType(batch.benefitType)} com {paymentCount} pagamento(s), programado para {formatDate(batch.scheduledAt)}.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <Button type="button" variant="primary" disabled={actionDisabled} onClick={onApproveBatch}>
              Aprovar lote
            </Button>
            <Button type="button" variant="secondary" onClick={onExpandToggle}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isExpanded ? "Ocultar detalhes" : "Expandir detalhes"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricPill icon={Layers3} label="Quantidade de pagamentos" value={`${paymentCount}`} />
          <MetricPill icon={CircleDollarSign} label="Valor total do lote" value={formatCurrency(totalValue)} />
          <MetricPill icon={CalendarDays} label="Status do lote" value={statusLabel(batchStatus)} />
          <MetricPill icon={CircleCheckBig} label="Selecionados para aprovacao" value={`${selectedCount}`} />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-slate-50/90 px-4 py-4 text-sm text-slate-600">
          <BenefitBadge benefitType={batch.benefitType} />
          <span className="data-chip">Competencia: {batch.competence}</span>
          <span className="data-chip">Pendentes: {pendingCount}</span>
          <span className="data-chip">Aprovados: {approvedCount}</span>
          <span className="data-chip">Rejeitados: {rejectedCount}</span>
        </div>

        {isExpanded ? (
          isLoadingPayments ? (
            <LoadingBatchPayments />
          ) : batch.hasPaymentDetails ? (
            <PaymentList
              batchId={batch.id}
              batchPayments={batchPayments}
              payments={batch.visiblePayments}
              totalPayments={paymentCount}
              selectedIds={selectedIds}
              onApproveSelected={onApproveSelected}
              onToggleAllSelections={onToggleAllSelections}
              onPaymentSelectionChange={onPaymentSelectionChange}
              onPaymentApprove={onPaymentApprove}
              onPaymentReject={onPaymentReject}
              onPaymentRestore={onPaymentRestore}
              onShowDetails={onShowDetails}
              processingPaymentId={processingPaymentId}
              isProcessingBatch={processingBatchId === batch.id}
            />
          ) : hasLoadedPayments ? (
            <EmptyBatchPayments batchNumber={batch.batchNumber} />
          ) : (
            <UnavailablePaymentDetails />
          )
        ) : null}
      </div>
    </article>
  );
}

function UnavailablePaymentDetails() {
  return (
    <div className="sub-panel flex flex-col gap-3 px-5 py-5 text-sm text-slate-600">
      <p className="section-title">Detalhes do lote</p>
      <p>Expanda o lote para carregar os pagamentos diretamente da API e preencher esta area em tempo real.</p>
      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-500">
        Assim que a requisicao finalizar, a tabela interna exibira os itens prontos para aprovacao, rejeicao ou consulta.
      </p>
    </div>
  );
}

function LoadingBatchPayments() {
  return (
    <div className="sub-panel flex flex-col gap-3 px-5 py-5 text-sm text-slate-600">
      <p className="section-title">Carregando pagamentos</p>
      <p>Buscando os itens deste lote no backend para montar a tabela detalhada.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    </div>
  );
}

type EmptyBatchPaymentsProps = {
  batchNumber: string;
};

function EmptyBatchPayments({ batchNumber }: EmptyBatchPaymentsProps) {
  return (
    <div className="sub-panel flex flex-col gap-3 px-5 py-5 text-sm text-slate-600">
      <p className="section-title">Nenhum pagamento retornado</p>
      <p>O lote {batchNumber} foi encontrado, mas a API nao retornou pagamentos para esta consulta.</p>
      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-500">
        Se isso nao era esperado, vale revisar o fluxo no n8n ou validar se o lote realmente possui itens vinculados.
      </p>
    </div>
  );
}

type MetricPillProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function MetricPill({ icon: Icon, label, value }: MetricPillProps) {
  return (
    <div className="sub-panel flex items-center gap-3 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)]">
        <Icon className="h-4 w-4 text-[color:var(--brand-deep)]" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

type PaymentListProps = {
  batchId: string;
  batchPayments: Payment[];
  payments: Payment[];
  totalPayments: number;
  selectedIds: string[];
  onApproveSelected: () => void;
  onToggleAllSelections: (batchId: string, paymentIds: string[], checked: boolean) => void;
  onPaymentSelectionChange: (batchId: string, paymentId: string, checked: boolean) => void;
  onPaymentApprove: (paymentId: string) => void;
  onPaymentReject: (paymentId: string) => void;
  onPaymentRestore: (paymentId: string) => void;
  onShowDetails: (paymentId: string) => void;
  processingPaymentId: string | null;
  isProcessingBatch: boolean;
};

function PaymentList({
  batchId,
  batchPayments,
  payments,
  totalPayments,
  selectedIds,
  onApproveSelected,
  onToggleAllSelections,
  onPaymentSelectionChange,
  onPaymentApprove,
  onPaymentReject,
  onPaymentRestore,
  onShowDetails,
  processingPaymentId,
  isProcessingBatch
}: PaymentListProps) {
  const pendingPayments = batchPayments.filter((payment) => payment.status === "PENDING");
  const visiblePendingIds = payments.filter((payment) => payment.status === "PENDING").map((payment) => payment.id);
  const selectedPending = payments.filter(
    (payment) => payment.status === "PENDING" && selectedIds.includes(payment.id)
  ).length;
  const selectedInBatch = pendingPayments.filter((payment) => selectedIds.includes(payment.id)).length;
  const pendingOutsideBatch = pendingPayments.length - selectedInBatch;
  const rejectedCount = batchPayments.filter((payment) => payment.status === "REJECTED").length;
  const approvedCount = batchPayments.filter((payment) => payment.status === "APPROVED").length;
  const allVisiblePendingSelected =
    visiblePendingIds.length > 0 && visiblePendingIds.every((paymentId) => selectedIds.includes(paymentId));
  const excludedCount = pendingOutsideBatch + rejectedCount;

  return (
    <div className="sub-panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[color:var(--border)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-title">Pagamentos do lote</p>
          <p className="mt-1 text-sm text-slate-600">
            Exibindo {payments.length} de {totalPayments} pagamento(s). Selecione quem segue para aprovacao em lote ou trate itens especificos individualmente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="data-chip">{selectedInBatch} no lote</span>
          <span className="data-chip">{excludedCount} fora do lote</span>
          <Button type="button" variant="success" disabled={selectedPending === 0 || isProcessingBatch} onClick={onApproveSelected}>
            Aprovar selecionados
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-[color:var(--border)] bg-slate-50/80 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={allVisiblePendingSelected}
              disabled={visiblePendingIds.length === 0}
              onChange={(event) => onToggleAllSelections(batchId, visiblePendingIds, event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
            />
            Selecionar todos os pagamentos pendentes visiveis
          </label>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              {selectedInBatch} seguirao no lote
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
              {pendingOutsideBatch} pendente(s) fora desta aprovacao
            </span>
            <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">
              {rejectedCount} rejeitado(s)
            </span>
            <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700">
              {approvedCount} aprovado(s)
            </span>
          </div>
        </div>

        {excludedCount > 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Pagamentos rejeitados ou desmarcados nao entrarao na aprovacao em lote. Itens com destaque amarelo ou vermelho
              ficarao fora desta liberacao.
            </p>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-slate-50/85">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Selecionar</th>
              <th className="px-4 py-4">Beneficiario</th>
              <th className="px-4 py-4">Documento</th>
              <th className="px-4 py-4">Valor bruto</th>
              <th className="px-4 py-4">Data pagamento</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Participacao no lote</th>
              <th className="px-4 py-4 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const isPending = payment.status === "PENDING";
              const isSelected = selectedIds.includes(payment.id);
              const isExcludedPending = isPending && !isSelected;
              const participationLabel =
                payment.status === "APPROVED"
                  ? "Ja aprovado"
                  : payment.status === "REJECTED"
                    ? "Fora do lote"
                    : isSelected
                      ? "Incluido no lote"
                      : "Fora desta aprovacao";

              return (
                <tr
                  key={payment.id}
                  className={cn(
                    "border-t border-[color:var(--border)] transition-colors hover:bg-slate-50/90",
                    isSelected && isPending && "bg-sky-50/70",
                    isExcludedPending && "bg-amber-50/70",
                    payment.status === "APPROVED" && "bg-emerald-50/60",
                    payment.status === "REJECTED" && "bg-rose-50/70"
                  )}
                >
                  <td className="px-5 py-4">
                    <label className="flex items-center gap-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={isPending && isSelected}
                        disabled={!isPending}
                        onChange={(event) => onPaymentSelectionChange(batchId, payment.id, event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                      />
                      {isPending ? "Incluir" : "Bloqueado"}
                    </label>
                  </td>
                  <td className="px-4 py-4">
                    <div className="min-w-[220px]">
                      <p className="font-semibold text-slate-900">{payment.beneficiaryName}</p>
                      <p className="text-sm text-slate-500">{payment.reference}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{formatDocument(payment.document)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                    {formatCurrency(payment.grossAmount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{formatDate(payment.paymentDate)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        payment.status === "APPROVED" && "bg-emerald-100 text-emerald-800",
                        payment.status === "REJECTED" && "bg-rose-100 text-rose-800",
                        isSelected && isPending && "bg-sky-100 text-sky-800",
                        isExcludedPending && "bg-amber-100 text-amber-800"
                      )}
                    >
                      {participationLabel}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onShowDetails(payment.id)}>
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </Button>
                      {payment.status === "PENDING" ? (
                        <>
                          <Button type="button" variant="success" size="sm" disabled={processingPaymentId === payment.id} onClick={() => onPaymentApprove(payment.id)}>
                            Aprovar
                          </Button>
                          <Button type="button" variant="danger" size="sm" disabled={processingPaymentId === payment.id} onClick={() => onPaymentReject(payment.id)}>
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </Button>
                        </>
                      ) : null}
                      {payment.status === "REJECTED" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onPaymentRestore(payment.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reativar
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
type PaymentDetailsDrawerProps = {
  batch?: PaymentBatch;
  payment?: Payment;
  isLoading: boolean;
  processingPaymentId: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRestore: () => void;
};

function PaymentDetailsDrawer({
  batch,
  payment,
  isLoading,
  processingPaymentId,
  onClose,
  onApprove,
  onReject,
  onRestore
}: PaymentDetailsDrawerProps) {
  useEffect(() => {
    if (!payment) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, payment]);

  if (!payment || !batch) {
    return null;
  }

  const observation = payment.observations ?? getPaymentObservation(payment, batch);
  const isApproved = payment.status === "APPROVED";
  const isRejected = payment.status === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fechar detalhes" className="absolute inset-0 cursor-default" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-[680px] flex-col border-l border-white/20 bg-[color:var(--surface-strong)] shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)]">
        <div className="border-b border-[color:var(--border)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Detalhes do pagamento</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{payment.beneficiaryName}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={payment.status} />
                <BenefitBadge benefitType={payment.benefitType ?? batch.benefitType} />
                <span className="data-chip">Lote {batch.batchNumber}</span>
                <span className="data-chip">Pagamento {payment.id}</span>
              </div>
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-5 rounded-[28px] bg-[linear-gradient(135deg,rgba(22,99,214,0.09)_0%,rgba(15,118,110,0.11)_100%)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo executivo</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{formatCurrency(payment.grossAmount)}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Pagamento previsto para {formatDate(payment.paymentDate)} no lote {payment.loteId ?? batch.batchNumber}.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <QuickInfo label="ID do lote" value={payment.loteId ?? batch.id} />
                <QuickInfo label="ID do pagamento" value={payment.id} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBlock icon={ShieldCheck} label="Nome do beneficiario" value={payment.beneficiaryName} />
            <DetailBlock icon={FileBadge2} label="Documento do beneficiario" value={formatDocument(payment.document)} />
            <DetailBlock icon={CircleDollarSign} label="Valor bruto do pagamento" value={formatCurrency(payment.grossAmount)} />
            <DetailBlock icon={CalendarDays} label="Data para pagamento" value={formatDate(payment.paymentDate)} />
            <DetailBlock icon={Gift} label="Tipo do beneficio" value={formatBenefitType(payment.benefitType ?? batch.benefitType)} />
            <DetailBlock icon={Layers3} label="Status atual" value={statusLabel(payment.status)} />
            <DetailBlock icon={Layers3} label="ID do pagamento" value={payment.id} />
            <DetailBlock icon={Layers3} label="ID do lote" value={payment.loteId ?? batch.id} />
          </div>

          <DrawerSection
            icon={ShieldCheck}
            title="Observacoes"
            description="Contexto de apoio para a revisao antes da decisao."
          >
            <div className="rounded-3xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
              {isLoading ? "Atualizando detalhes do pagamento com os dados mais recentes do backend..." : observation}
            </div>
          </DrawerSection>
        </div>

        <div className="border-t border-[color:var(--border)] bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Use as acoes abaixo para concluir a analise deste pagamento.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="success" onClick={onApprove} disabled={isApproved || processingPaymentId === payment.id}>
                Aprovar
              </Button>
              <Button type="button" variant="danger" onClick={onReject} disabled={isRejected || processingPaymentId === payment.id}>
                Rejeitar
              </Button>
              {isRejected ? (
                <Button type="button" variant="secondary" onClick={onRestore}>
                  Voltar para pendente
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

type QuickInfoProps = {
  label: string;
  value: string;
};

function QuickInfo({ label, value }: QuickInfoProps) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

type DrawerSectionProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
};

function DrawerSection({ icon: Icon, title, description, children }: DrawerSectionProps) {
  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-white px-5 py-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)]">
          <Icon className="h-5 w-5 text-[color:var(--brand-deep)]" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

type DetailBlockProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: string;
};

function DetailBlock({ icon: Icon, label, value }: DetailBlockProps) {
  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-white px-5 py-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)]">
          <Icon className="h-5 w-5 text-[color:var(--brand-deep)]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="text-base font-semibold text-slate-950">{value ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}

function getPaymentObservation(payment: Payment, batch: PaymentBatch) {
  const benefitLabel = formatBenefitType(batch.benefitType).toLowerCase();

  if (payment.status === "APPROVED") {
    return `Pagamento de ${benefitLabel} validado para liberacao, sem divergencias documentais e mantido no lote ${batch.batchNumber}.`;
  }

  if (payment.status === "REJECTED") {
    return `Pagamento retirado do lote ${batch.batchNumber} para revisao manual. E recomendado validar os dados cadastrais antes de uma nova submissao.`;
  }

  return `Pagamento aguardando decisao da gestora Cris. A recomendacao e conferir documento, valor bruto e enquadramento do beneficio antes da aprovacao final.`;
}

function buildDashboardSummary(batches: PaymentBatch[]): ResumoDashboard {
  return {
    pendingBatchCount: batches.filter((batch) => getBatchPendingCount(batch) > 0).length,
    pendingPaymentCount: batches.reduce((total, batch) => total + getBatchPendingCount(batch), 0),
    pendingTotalAmount: batches.reduce((total, batch) => {
      if ((batch.payments ?? []).length > 0) {
        return total + (batch.payments ?? [])
          .filter((payment) => payment.status === "PENDING")
          .reduce((subtotal, payment) => subtotal + payment.grossAmount, 0);
      }

      return total + (getBatchPendingCount(batch) > 0 ? batch.totalAmount ?? 0 : 0);
    }, 0),
    resgateBatchCount: batches.filter((batch) => batch.benefitType === "RESGATE").length,
    sorteioBatchCount: batches.filter((batch) => batch.benefitType === "SORTEIO").length
  };
}

function getBatchPendingCount(batch: PaymentBatch) {
  return batch.pendingCount ?? (batch.payments ?? []).filter((payment) => payment.status === "PENDING").length;
}

function getBatchApprovedCount(batch: PaymentBatch) {
  return batch.approvedCount ?? (batch.payments ?? []).filter((payment) => payment.status === "APPROVED").length;
}

function getBatchRejectedCount(batch: PaymentBatch) {
  return batch.rejectedCount ?? (batch.payments ?? []).filter((payment) => payment.status === "REJECTED").length;
}

function matchesLoteStatus(batch: PaymentBatch, status: PaymentStatus) {
  if ((batch.payments ?? []).length > 0) {
    return (batch.payments ?? []).some((payment) => payment.status === status);
  }

  if (!batch.status) {
    return status === "PENDING";
  }

  if (batch.status === "PARTIALLY_APPROVED") {
    return status === "PENDING";
  }

  return batch.status === status;
}

function getPresentationBatchStatus(
  batch: PaymentBatch,
  pendingCount: number,
  approvedCount: number,
  rejectedCount: number
): PaymentStatus {
  if (batch.status === "APPROVED") {
    return "APPROVED";
  }

  if (batch.status === "REJECTED") {
    return "REJECTED";
  }

  return getBatchStatus(pendingCount, approvedCount, rejectedCount);
}

function matchesBatchSearch(batch: PaymentBatch, search: string) {
  if (!search.trim()) {
    return false;
  }

  const normalizedSearch = normalizeText(search);
  return (
    normalizeText(batch.id).includes(normalizedSearch) ||
    normalizeText(batch.batchNumber).includes(normalizedSearch)
  );
}

function matchesPaymentSearch(payment: Payment, search: string) {
  if (!search.trim()) {
    return true;
  }

  const normalizedSearch = normalizeText(search);
  return (
    normalizeText(payment.beneficiaryName).includes(normalizedSearch) ||
    normalizeText(payment.document).includes(normalizedSearch)
  );
}

function getBatchStatus(pendingCount: number, approvedCount: number, rejectedCount: number): PaymentStatus {
  if (pendingCount > 0) {
    return "PENDING";
  }

  if (approvedCount > 0 && rejectedCount === 0) {
    return "APPROVED";
  }

  return "REJECTED";
}
function statusLabel(status: PaymentStatus) {
  if (status === "APPROVED") {
    return "Aprovado";
  }

  if (status === "REJECTED") {
    return "Rejeitado";
  }

  return "Pendente";
}










