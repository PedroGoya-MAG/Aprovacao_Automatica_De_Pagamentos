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
import { approvePaymentById } from "@/services/payment-approval-service";
import {
  formatBenefitType,
  formatCurrency,
  formatDate,
  formatDocument
} from "@/lib/formatters";
import { cn, normalizeText } from "@/lib/utils";
import { type BenefitType, type Payment, type PaymentBatch, type PaymentStatus } from "@/types/payments";

type DashboardShellProps = {
  initialBatches: PaymentBatch[];
};

type BenefitFilterOption = "ALL" | BenefitType;
type StatusFilterOption = "ALL" | PaymentStatus;
type ActivePaymentState = {
  batchId: string;
  paymentId: string;
} | null;
type VisibleBatch = PaymentBatch & {
  visiblePayments: Payment[];
};

type SummaryTone = "blue" | "teal" | "slate";

let toastCounter = 0;

export function DashboardShell({ initialBatches }: DashboardShellProps) {
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
        batch.payments.filter((payment) => payment.status === "PENDING").map((payment) => payment.id)
      ])
    )
  );
  const [activePayment, setActivePayment] = useState<ActivePaymentState>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = normalizeText(deferredSearch);

  function notify(title: string, description: string, tone: ToastItem["tone"]) {
    const id = toastCounter++;

    setToasts((current) => [...current, { id, title, description, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3400);
  }

  const visibleBatches = batches
    .filter((batch) => filterType === "ALL" || batch.benefitType === filterType)
    .map((batch) => {
      const batchMatchesSearch = matchesBatchSearch(batch, normalizedSearch);

      return {
        ...batch,
        visiblePayments: batch.payments.filter((payment) => {
          const matchesStatus = filterStatus === "ALL" || payment.status === filterStatus;
          const matchesSearch =
            normalizedSearch.length === 0 || batchMatchesSearch || matchesPaymentSearch(payment, normalizedSearch);

          return matchesStatus && matchesSearch;
        })
      };
    })
    .filter((batch) => batch.visiblePayments.length > 0);
  const activeBatch = activePayment ? batches.find((batch) => batch.id === activePayment.batchId) : undefined;
  const currentPayment = activePayment
    ? activeBatch?.payments.find((payment) => payment.id === activePayment.paymentId)
    : undefined;

  const pendingBatches = batches.filter((batch) => batch.payments.some((payment) => payment.status === "PENDING")).length;
  const pendingPayments = batches.flatMap((batch) => batch.payments).filter((payment) => payment.status === "PENDING");
  const pendingValue = pendingPayments.reduce((total, payment) => total + payment.grossAmount, 0);
  const resgateBatches = batches.filter((batch) => batch.benefitType === "RESGATE").length;
  const sorteioBatches = batches.filter((batch) => batch.benefitType === "SORTEIO").length;

  function toggleExpanded(batchId: string) {
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

  function updatePaymentStatus(batchId: string, paymentId: string, status: PaymentStatus) {
    const batch = batches.find((item) => item.id === batchId);
    const payment = batch?.payments.find((item) => item.id === paymentId);

    setBatches((current) =>
      current.map((currentBatch) =>
        currentBatch.id !== batchId
          ? currentBatch
          : {
              ...currentBatch,
              payments: currentBatch.payments.map((currentPayment) =>
                currentPayment.id === paymentId ? { ...currentPayment, status } : currentPayment
              )
            }
      )
    );

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

    setBatches((current) =>
      current.map((currentBatch) =>
        currentBatch.id !== batchId
          ? currentBatch
          : {
              ...currentBatch,
              payments: currentBatch.payments.map((payment) =>
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
          value={pendingBatches.toString()}
          helper="Lotes com ao menos um pagamento pendente"
          tone="blue"
        />
        <SummaryCard
          icon={CalendarClock}
          label="Total de pagamentos pendentes"
          value={pendingPayments.length.toString()}
          helper="Itens aguardando aprovacao"
          tone="blue"
        />
        <SummaryCard
          icon={CircleDollarSign}
          label="Valor total pendente"
          value={formatCurrency(pendingValue)}
          helper="Montante ainda nao liberado"
          tone="teal"
        />
        <SummaryCard
          icon={Wallet}
          label="Quantidade de lotes de Resgate"
          value={resgateBatches.toString()}
          helper="Carteira ativa de resgates"
          tone="slate"
        />
        <SummaryCard
          icon={Gift}
          label="Quantidade de lotes de Sorteio"
          value={sorteioBatches.toString()}
          helper="Carteira ativa de sorteios"
          tone="slate"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Carteira de aprovacao</p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Lotes em acompanhamento</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Visualize cada lote em cards executivos, expanda detalhes quando necessario e aprove com contexto.
              </p>
            </div>
            <span className="data-chip">{visibleBatches.length} lote(s) em exibicao</span>
          </div>
        </div>

        <div className="sub-panel bg-[linear-gradient(135deg,rgba(22,99,214,0.08)_0%,rgba(15,118,110,0.1)_100%)] px-5 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Leitura rapida</p>
          <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 xl:grid-cols-1">
            <QuickLine label="Priorizacao" value="Comece pelos lotes com maior valor ou mais pagamentos." />
            <QuickLine label="Controle" value="Desmarque ou rejeite itens especificos antes da aprovacao em lote." />
            <QuickLine label="Apresentacao" value="A home esta pronta para demonstracoes em ambiente corporativo." />
          </div>
        </div>
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
              onApproveBatch={() => approveSelected(batch.id)}
              onApproveSelected={() => approveSelected(batch.id)}
              onExpandToggle={() => toggleExpanded(batch.id)}
              onToggleAllSelections={toggleAllSelections}
              onPaymentSelectionChange={toggleSelection}
              onPaymentApprove={(paymentId) => void handleApprovePayment(batch.id, paymentId)}
              onPaymentReject={(paymentId) => updatePaymentStatus(batch.id, paymentId, "REJECTED")}
              onPaymentRestore={(paymentId) => updatePaymentStatus(batch.id, paymentId, "PENDING")}
              onShowDetails={(paymentId) => setActivePayment({ batchId: batch.id, paymentId })}
              processingPaymentId={processingPaymentId}
            />
          ))}
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <PaymentDetailsDrawer
        batch={activeBatch}
        payment={currentPayment}
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

          updatePaymentStatus(activePayment.batchId, activePayment.paymentId, "REJECTED");
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

type QuickLineProps = {
  label: string;
  value: string;
};

function QuickLine({ label, value }: QuickLineProps) {
  return (
    <div className="rounded-2xl bg-white/85 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

type BatchCardProps = {
  batch: VisibleBatch;
  selectedIds: string[];
  isExpanded: boolean;
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
};

function BatchCard({
  batch,
  selectedIds,
  isExpanded,
  onApproveBatch,
  onApproveSelected,
  onExpandToggle,
  onToggleAllSelections,
  onPaymentSelectionChange,
  onPaymentApprove,
  onPaymentReject,
  onPaymentRestore,
  onShowDetails,
  processingPaymentId
}: BatchCardProps) {
  const totalValue = batch.payments.reduce((total, payment) => total + payment.grossAmount, 0);
  const selectedCount = batch.payments.filter(
    (payment) => selectedIds.includes(payment.id) && payment.status === "PENDING"
  ).length;
  const pendingCount = batch.payments.filter((payment) => payment.status === "PENDING").length;
  const approvedCount = batch.payments.filter((payment) => payment.status === "APPROVED").length;
  const rejectedCount = batch.payments.filter((payment) => payment.status === "REJECTED").length;
  const batchStatus = getBatchStatus(pendingCount, approvedCount, rejectedCount);
  const actionDisabled = selectedCount === 0;
  const typeAccent =
    batch.benefitType === "SORTEIO"
      ? "bg-[linear-gradient(90deg,#1663d6_0%,#4f9df7_100%)]"
      : "bg-[linear-gradient(90deg,#0f766e_0%,#1f9d8b_100%)]";
  const typeLabel = batch.benefitType === "SORTEIO" ? "Lote de Sorteio" : "Lote de Resgate";

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
                {formatBenefitType(batch.benefitType)} com {batch.payments.length} pagamento(s), programado para {formatDate(batch.scheduledAt)}.
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
          <MetricPill icon={Layers3} label="Quantidade de pagamentos" value={`${batch.payments.length}`} />
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
          <PaymentList
            batchId={batch.id}
            batchPayments={batch.payments}
            payments={batch.visiblePayments}
            totalPayments={batch.payments.length}
            selectedIds={selectedIds}
            onApproveSelected={onApproveSelected}
            onToggleAllSelections={onToggleAllSelections}
            onPaymentSelectionChange={onPaymentSelectionChange}
            onPaymentApprove={onPaymentApprove}
            onPaymentReject={onPaymentReject}
            onPaymentRestore={onPaymentRestore}
            onShowDetails={onShowDetails}
            processingPaymentId={processingPaymentId}
          />
        ) : null}
      </div>
    </article>
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
  processingPaymentId
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
          <Button type="button" variant="success" disabled={selectedPending === 0} onClick={onApproveSelected}>
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
                          <Button type="button" variant="danger" size="sm" onClick={() => onPaymentReject(payment.id)}>
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
  processingPaymentId: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRestore: () => void;
};

type PaymentHistoryItem = {
  title: string;
  description: string;
  timestamp: string;
  tone: "blue" | "teal" | "slate" | "rose";
};

function PaymentDetailsDrawer({
  batch,
  payment,
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

  const observation = getPaymentObservation(payment, batch);
  const history = getPaymentHistory(payment, batch);
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
                <BenefitBadge benefitType={batch.benefitType} />
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
                  Pagamento previsto para {formatDate(payment.paymentDate)} no lote {batch.batchNumber}.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <QuickInfo label="ID do lote" value={batch.id} />
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
            <DetailBlock icon={Gift} label="Tipo do beneficio" value={formatBenefitType(batch.benefitType)} />
            <DetailBlock icon={Layers3} label="Status atual" value={statusLabel(payment.status)} />
            <DetailBlock icon={Layers3} label="ID do pagamento" value={payment.id} />
            <DetailBlock icon={Layers3} label="ID do lote" value={batch.id} />
          </div>

          <DrawerSection
            icon={ShieldCheck}
            title="Observacoes"
            description="Contexto mockado para apoiar a revisao antes da decisao."
          >
            <div className="rounded-3xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
              {observation}
            </div>
          </DrawerSection>

          <DrawerSection
            icon={CalendarClock}
            title="Historico da acao"
            description="Linha do tempo mockada para demonstrar futura integracao com trilha de auditoria."
          >
            <div className="space-y-4">
              {history.map((item, index) => (
                <HistoryItem key={`${item.title}-${index}`} item={item} isLast={index === history.length - 1} />
              ))}
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
              <Button type="button" variant="danger" onClick={onReject} disabled={isRejected}>
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

type HistoryItemProps = {
  item: PaymentHistoryItem;
  isLast: boolean;
};

function HistoryItem({ item, isLast }: HistoryItemProps) {
  const toneMap: Record<PaymentHistoryItem["tone"], string> = {
    blue: "bg-sky-500",
    teal: "bg-teal-500",
    slate: "bg-slate-400",
    rose: "bg-rose-500"
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className={cn("mt-1 h-3.5 w-3.5 rounded-full", toneMap[item.tone])} />
        {!isLast ? <span className="mt-2 h-full w-px bg-slate-200" /> : null}
      </div>
      <div className="flex-1 rounded-2xl bg-slate-50 px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{item.timestamp}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
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
    return `Pagamento retirado do lote ${batch.batchNumber} para revisao manual. O mock considera necessidade de validar dados cadastrais antes de nova submissao.`;
  }

  return `Pagamento aguardando decisao da gestora Cris. O mock considera conferencias de documento, valor bruto e enquadramento do beneficio antes da aprovacao final.`;
}

function getPaymentHistory(payment: Payment, batch: PaymentBatch): PaymentHistoryItem[] {
  const baseHistory: PaymentHistoryItem[] = [
    {
      title: "Criado",
      description: `Pagamento ${payment.id} gerado para a competencia ${batch.competence} e vinculado ao lote ${batch.batchNumber}.`,
      timestamp: formatDate(batch.scheduledAt),
      tone: "slate"
    },
    {
      title: "Enviado para aprovacao",
      description: `Item disponibilizado na fila de aprovacao da gestora Cris com o valor bruto de ${formatCurrency(payment.grossAmount)}.`,
      timestamp: formatDate(batch.scheduledAt),
      tone: "blue"
    }
  ];

  if (payment.status === "APPROVED") {
    return [
      ...baseHistory,
      {
        title: "Aprovado",
        description: "Pagamento confirmado para processamento financeiro e mantido no lote atual.",
        timestamp: formatDate(payment.paymentDate),
        tone: "teal"
      }
    ];
  }

  if (payment.status === "REJECTED") {
    return [
      ...baseHistory,
      {
        title: "Rejeitado",
        description: "Pagamento sinalizado para revisao e removido da aprovacao em lote ate novo tratamento.",
        timestamp: formatDate(payment.paymentDate),
        tone: "rose"
      }
    ];
  }

  return [
    ...baseHistory,
    {
      title: "Aguardando decisao",
      description: "Pagamento permanece pendente de aprovacao individual ou aprovacao em lote.",
      timestamp: formatDate(payment.paymentDate),
      tone: "teal"
    }
  ];
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





















