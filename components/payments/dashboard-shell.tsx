"use client";

import { useDeferredValue, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
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
import { formatBenefitType, formatCurrency, formatDate, formatDocument } from "@/lib/formatters";
import { cn, normalizeText } from "@/lib/utils";
import { getResumoDashboard } from "@/services/dashboard-service";
import { getPagamentosByLote } from "@/services/lote-payments-service";
import { getPagamentoById } from "@/services/payment-details-service";
import { approvePaymentById } from "@/services/payment-approval-service";
import { rejectPaymentById } from "@/services/payment-rejection-service";
import { approveSelectedPayments } from "@/services/batch-selected-approval-service";
import { approveBatch } from "@/services/batch-approval-service";
import { canAccessFeature, DASHBOARD_FEATURES, type DashBeneficioRole } from "@/lib/auth/roles";
import { type BenefitType, type Payment, type PaymentBatch, type PaymentStatus, type ResumoDashboard } from "@/types/payments";

type DashboardShellProps = {
  initialBatches: PaymentBatch[];
  initialSummary: ResumoDashboard | null;
  initialLoadError?: string | null;
  role?: DashBeneficioRole;
};

type BenefitFilterOption = "ALL" | BenefitType;
type StatusFilterOption = "ALL" | PaymentStatus;
type ActivePaymentState = {
  batchId: string;
  paymentId: string;
} | null;
type SummaryTone = "blue" | "teal" | "slate";
type SuspicionReason = "HIGH_VALUE" | "DUPLICATE_BENEFICIARY" | "SINGLE_CONCENTRATION" | "DOUBLE_CONCENTRATION";
type AlertSeverity = "warning" | "critical";
type RejectionDraft = {
  batchId: string;
  paymentId: string;
  reason: string;
} | null;

type PaymentAlert = {
  paymentId: string;
  batchId: string;
  reasons: SuspicionReason[];
  isSuspicious: boolean;
  isResolved: boolean;
  severity: AlertSeverity | null;
};

type BatchAlert = {
  batchId: string;
  totalSuspiciousCount: number;
  unresolvedSuspiciousCount: number;
  severity: AlertSeverity | null;
  totalValueUnderAnalysis: number;
};

type SuspicionAnalysis = {
  paymentMap: Record<string, PaymentAlert>;
  batchMap: Record<string, BatchAlert>;
};

type VisibleBatch = PaymentBatch & {
  visiblePayments: Payment[];
  hasPaymentDetails: boolean;
  alert: BatchAlert;
};

type SuspicionOverview = {
  suspiciousBatchCount: number;
  suspiciousPaymentCount: number;
  unresolvedSuspiciousCount: number;
  totalValueUnderAnalysis: number;
  topReasons: Array<{ reason: SuspicionReason; count: number }>;
  topCases: Array<{
    paymentId: string;
    beneficiaryName: string;
    batchNumber: string;
    value: number;
    reasons: SuspicionReason[];
    severity: AlertSeverity;
    isResolved: boolean;
  }>;
};

const emptyBatchAlert: BatchAlert = {
  batchId: "",
  totalSuspiciousCount: 0,
  unresolvedSuspiciousCount: 0,
  severity: null,
  totalValueUnderAnalysis: 0
};

let toastCounter = 0;

export function DashboardShell({ initialBatches, initialSummary, initialLoadError, role }: DashboardShellProps) {
  const [batches, setBatches] = useState(initialBatches);
  const [filterType, setFilterType] = useState<BenefitFilterOption>("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusFilterOption>("ALL");
  const [search, setSearch] = useState("");
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialBatches.map((batch) => [batch.id, false]))
  );
  const [selectedByBatch, setSelectedByBatch] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(initialBatches.map((batch) => [batch.id, []]))
  );
  const [reviewedSuspiciousIds, setReviewedSuspiciousIds] = useState<Record<string, boolean>>({});
  const [rejectionReasonsById, setRejectionReasonsById] = useState<Record<string, string>>({});
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
  const [processingAllVisible, setProcessingAllVisible] = useState(false);
  const [approveAllDialogOpen, setApproveAllDialogOpen] = useState(false);
  const [rejectionDraft, setRejectionDraft] = useState<RejectionDraft>(null);
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = normalizeText(deferredSearch);
  const isReadOnly = role ? !canAccessFeature(role, DASHBOARD_FEATURES.APPROVALS_MANAGE) : false;
  const canManageApprovals = role ? canAccessFeature(role, DASHBOARD_FEATURES.APPROVALS_MANAGE) : true;

  function notify(title: string, description: string, tone: ToastItem["tone"]) {
    const id = toastCounter++;

    setToasts((current) => [...current, { id, title, description, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3400);
  }

  function notifyReadOnly() {
    notify("Perfil somente leitura", "Seu perfil permite consultar os dados, mas não executar aprovações ou rejeições.", "info");
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const data = await getResumoDashboard({ status: "PENDING" });
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

  const suspicionAnalysis = useMemo(
    () => analyzeSuspiciousPayments(batches, reviewedSuspiciousIds),
    [batches, reviewedSuspiciousIds]
  );

  const overviewBatches = useMemo(
    () =>
      batches.map((batch) => {
        const batchPayments = batch.payments ?? [];

        return {
          ...batch,
          payments: batchPayments,
          visiblePayments: batchPayments,
          hasPaymentDetails: batchPayments.length > 0,
          alert: suspicionAnalysis.batchMap[batch.id] ?? { ...emptyBatchAlert, batchId: batch.id }
        };
      }),
    [batches, suspicionAnalysis]
  );

  const suspiciousQueueBatches = useMemo(
    () =>
      overviewBatches
        .map((batch) => ({
          ...batch,
          visiblePayments: batch.visiblePayments.filter((payment) => {
            const alert = suspicionAnalysis.paymentMap[payment.id];
            return payment.status === "PENDING" && alert?.isSuspicious && !alert.isResolved;
          })
        }))
        .filter((batch) => batch.visiblePayments.length > 0),
    [overviewBatches, suspicionAnalysis]
  );

  const visibleBatches = useMemo(
    () =>
      overviewBatches
        .filter((batch) => batch.alert.unresolvedSuspiciousCount === 0)
        .filter((batch) => filterType === "ALL" || batch.benefitType === filterType)
        .map((batch) => {
          const batchMatchesSearch = matchesBatchSearch(batch, normalizedSearch);
          const hasPaymentDetails = batch.visiblePayments.length > 0;
          const matchesStatus = filterStatus === "ALL" || matchesLoteStatus(batch, filterStatus);
          const visiblePayments = batch.visiblePayments.filter((payment) => {
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
            visiblePayments,
            hasPaymentDetails,
            isVisible
          };
        })
        .filter((batch) => batch.isVisible)
        .map(({ isVisible, ...batch }) => batch),
    [filterStatus, filterType, normalizedSearch, overviewBatches]
  );

  const suspicionOverview = useMemo(
    () => buildSuspicionOverview(overviewBatches, suspicionAnalysis),
    [overviewBatches, suspicionAnalysis]
  );

  const activeBatch = activePayment ? batches.find((batch) => batch.id === activePayment.batchId) : undefined;
  const currentPayment = activePayment
    ? paymentDetailsById[activePayment.paymentId] ??
      activeBatch?.payments?.find((payment) => payment.id === activePayment.paymentId)
    : undefined;
  const currentPaymentAlert = currentPayment ? suspicionAnalysis.paymentMap[currentPayment.id] : undefined;
  const localSummary = buildDashboardSummary(batches);
  const summary = hasLocalMutations ? localSummary : remoteSummary ?? localSummary;
  const hasUnresolvedSuspicion = suspicionOverview.unresolvedSuspiciousCount > 0;
  const canApproveAllVisible = !hasUnresolvedSuspicion && visibleBatches.some((batch) => getBatchPendingCount(batch) > 0);

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

  function focusBatchPayments(batchId: string) {
    window.setTimeout(() => {
      document.getElementById(`batch-payments-${batchId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 240);
  }

  async function handleApprovePayment(batchId: string, paymentId: string) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    if (processingPaymentId === paymentId) {
      return;
    }

    setProcessingPaymentId(paymentId);

    try {
      const result = await approvePaymentById(paymentId);
      updatePaymentStatus(batchId, String(result.id), result.status);
    } catch {
      notify("Falha ao aprovar pagamento", "Não foi possível concluir a aprovação deste pagamento agora.", "warning");
    } finally {
      setProcessingPaymentId(null);
    }
  }

  async function handleRejectPayment(batchId: string, paymentId: string, reason?: string) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    if (processingPaymentId === paymentId) {
      return;
    }

    setProcessingPaymentId(paymentId);

    try {
      const result = await rejectPaymentById(paymentId, reason);
      updatePaymentStatus(batchId, String(result.id), result.status, reason);
      setRejectionDraft(null);
    } catch {
      notify("Falha ao rejeitar pagamento", "Não foi possível concluir a rejeição deste pagamento agora.", "warning");
    } finally {
      setProcessingPaymentId(null);
    }
  }

  async function handleApproveBatch(batchId: string) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    if (processingBatchId === batchId) {
      return;
    }

    if ((suspicionAnalysis.batchMap[batchId]?.unresolvedSuspiciousCount ?? 0) > 0) {
      notify("Lote com pendencias suspeitas", "Revise ou trate os pagamentos sinalizados antes de aprovar o lote inteiro.", "warning");
      return;
    }

    setProcessingBatchId(batchId);

    try {
      const result = await approveBatch(batchId);
      applyApprovedPayments(batchId, result.approvedPaymentIds, "batch");
    } catch {
      notify("Falha ao aprovar lote", "Não foi possível concluir a aprovação completa deste lote agora.", "warning");
    } finally {
      setProcessingBatchId(null);
    }
  }

  async function handleApproveSelected(batchId: string) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    const paymentIds = Array.from(new Set(selectedByBatch[batchId] ?? []));
    const hasSelectedSuspicious = paymentIds.some((paymentId) => {
      const alert = suspicionAnalysis.paymentMap[paymentId];
      return alert?.isSuspicious && !alert.isResolved;
    });

    if (paymentIds.length === 0 || processingBatchId === batchId) {
      return;
    }

    if (hasSelectedSuspicious) {
      notify("Selecionados exigem revisão", "Revise ou trate os pagamentos suspeitos antes de aprovar os itens selecionados em lote.", "warning");
      return;
    }

    setProcessingBatchId(batchId);

    try {
      const result = await approveSelectedPayments(batchId, paymentIds);
      applyApprovedPayments(batchId, result.approvedPaymentIds, "selected");
    } catch {
      notify("Falha ao aprovar selecionados", "Não foi possível concluir a aprovação dos pagamentos selecionados agora.", "warning");
    } finally {
      setProcessingBatchId(null);
    }
  }

  async function handleApproveAllVisible() {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    if (hasUnresolvedSuspicion) {
      notify("Aprovação total bloqueada", "Essa ação só é liberada quando todos os pagamentos suspeitos pendentes forem revisados ou tratados.", "warning");
      return;
    }

    const eligibleBatches = visibleBatches.filter((batch) => getBatchPendingCount(batch) > 0);

    if (eligibleBatches.length === 0) {
      notify("Nada para aprovar", "Não há lotes pendentes disponíveis na tela para aprovação total.", "info");
      return;
    }

    setProcessingAllVisible(true);
    setApproveAllDialogOpen(false);

    let approvedBatches = 0;

    try {
      for (const batch of eligibleBatches) {
        const result = await approveBatch(batch.id);
        applyApprovedPayments(batch.id, result.approvedPaymentIds, "batch", { silent: true });
        approvedBatches += 1;
      }

      notify("Aprovação total concluída", `${approvedBatches} lote(s) visível(is) foram aprovados com sucesso.`, "success");
    } catch {
      notify("Falha na aprovação total", "Não foi possível concluir a aprovação de todos os lotes visíveis agora.", "warning");
    } finally {
      setProcessingAllVisible(false);
    }
  }

  function applyApprovedPayments(
    batchId: string,
    approvedPaymentIds: string[],
    mode: "selected" | "batch",
    options?: { silent?: boolean }
  ) {
    const approvedSet = new Set(approvedPaymentIds.map(String));
    const batch = batches.find((item) => item.id === batchId);

    setHasLocalMutations(true);

    setBatches((current) =>
      current.map((currentBatch) => {
        if (currentBatch.id !== batchId) {
          return currentBatch;
        }

        const nextPayments = (currentBatch.payments ?? []).map((payment) =>
          approvedSet.has(payment.id) && payment.status === "PENDING" ? { ...payment, status: "APPROVED" as const } : payment
        );

        return {
          ...currentBatch,
          payments: nextPayments,
          paymentCount: nextPayments.length,
          pendingCount: nextPayments.filter((payment) => payment.status === "PENDING").length,
          approvedCount: nextPayments.filter((payment) => payment.status === "APPROVED").length,
          rejectedCount: nextPayments.filter((payment) => payment.status === "REJECTED").length
        };
      })
    );

    setPaymentDetailsById((current) => {
      const nextEntries = Object.entries(current).map(([paymentId, detail]) => [paymentId, approvedSet.has(paymentId) ? { ...detail, status: "APPROVED" as const } : detail]);
      return Object.fromEntries(nextEntries);
    });

    setReviewedSuspiciousIds((current) => {
      const next = { ...current };
      approvedPaymentIds.forEach((paymentId) => {
        next[String(paymentId)] = true;
      });
      return next;
    });

    setSelectedByBatch((current) => ({
      ...current,
      [batchId]: (current[batchId] ?? []).filter((paymentId) => !approvedSet.has(paymentId))
    }));

    if (!options?.silent && batch) {
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
                payments,
                paymentCount: payments.length,
                pendingCount: payments.filter((payment) => payment.status === "PENDING").length,
                approvedCount: payments.filter((payment) => payment.status === "APPROVED").length,
                rejectedCount: payments.filter((payment) => payment.status === "REJECTED").length
              }
        )
      );

      setSelectedByBatch((current) => ({
        ...current,
        [batchId]: []
      }));

      setLoadedBatchPayments((current) => ({
        ...current,
        [batchId]: true
      }));
    } catch {
      notify("Falha ao carregar pagamentos", "Não foi possível buscar os pagamentos deste lote agora. Tente expandir novamente em instantes.", "warning");
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
        notify("Detalhes indisponíveis", "Esse pagamento não retornou detalhes adicionais no backend. Exibindo apenas os dados já carregados na lista.", "warning");
        return;
      }

      const paymentWithLocalReason = rejectionReasonsById[paymentId]
        ? { ...payment, observations: buildRejectionObservation(rejectionReasonsById[paymentId], payment.observations) }
        : payment;

      setPaymentDetailsById((current) => ({
        ...current,
        [paymentId]: paymentWithLocalReason
      }));

      setBatches((current) =>
        current.map((batch) =>
          batch.id !== batchId
            ? batch
            : {
                ...batch,
                payments: (batch.payments ?? []).map((currentPayment) =>
                  currentPayment.id === paymentId ? { ...currentPayment, ...paymentWithLocalReason } : currentPayment
                )
              }
        )
      );
    } catch {
      notify("Falha ao carregar detalhes", "Não foi possível buscar os detalhes completos deste pagamento agora.", "warning");
    } finally {
      setLoadingPaymentDetails(false);
    }
  }

  function updatePaymentStatus(batchId: string, paymentId: string, status: PaymentStatus, reason?: string) {
    const batch = batches.find((item) => item.id === batchId);
    const payment = batch?.payments?.find((item) => item.id === paymentId);
    const nextObservation = reason ? buildRejectionObservation(reason, payment?.observations) : payment?.observations;

    setHasLocalMutations(true);

    if (reason) {
      setRejectionReasonsById((current) => ({ ...current, [paymentId]: reason }));
    }

    if (status !== "PENDING") {
      setReviewedSuspiciousIds((current) => ({ ...current, [paymentId]: true }));
    }

    setBatches((current) =>
      current.map((currentBatch) => {
        if (currentBatch.id !== batchId) {
          return currentBatch;
        }

        const nextPayments = (currentBatch.payments ?? []).map((currentPayment) =>
          currentPayment.id === paymentId ? { ...currentPayment, status, observations: nextObservation } : currentPayment
        );

        return {
          ...currentBatch,
          payments: nextPayments,
          paymentCount: nextPayments.length,
          pendingCount: nextPayments.filter((item) => item.status === "PENDING").length,
          approvedCount: nextPayments.filter((item) => item.status === "APPROVED").length,
          rejectedCount: nextPayments.filter((item) => item.status === "REJECTED").length
        };
      })
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
          status,
          observations: nextObservation
        }
      };
    });

    setSelectedByBatch((current) => {
      const currentSelection = current[batchId] ?? [];
      const nextSelection = status === "PENDING" ? Array.from(new Set([...currentSelection, paymentId])) : currentSelection.filter((id) => id !== paymentId);
      return { ...current, [batchId]: nextSelection };
    });

    if (!batch || !payment) {
      return;
    }

    if (status === "APPROVED") {
      notify("Pagamento aprovado", `${payment.beneficiaryName} foi aprovado no lote ${batch.batchNumber}.`, "success");
      return;
    }

    if (status === "REJECTED") {
      notify("Pagamento rejeitado", `${payment.beneficiaryName} foi retirado do lote ${batch.batchNumber} para revisão.`, "warning");
      return;
    }

    notify("Pagamento reativado", `${payment.beneficiaryName} voltou para pendente e pode entrar novamente na aprovação do lote.`, "info");
  }

  function toggleSelection(batchId: string, paymentId: string, checked: boolean) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    setSelectedByBatch((current) => {
      const existing = current[batchId] ?? [];
      const nextSelection = checked ? Array.from(new Set([...existing, paymentId])) : existing.filter((id) => id !== paymentId);
      return { ...current, [batchId]: nextSelection };
    });
  }

  function toggleAllSelections(batchId: string, paymentIds: string[], checked: boolean) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    setSelectedByBatch((current) => {
      const existing = new Set(current[batchId] ?? []);
      if (checked) {
        paymentIds.forEach((paymentId) => existing.add(paymentId));
      } else {
        paymentIds.forEach((paymentId) => existing.delete(paymentId));
      }
      return { ...current, [batchId]: Array.from(existing) };
    });
  }

  function toggleReviewed(paymentId: string) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    const paymentAlert = suspicionAnalysis.paymentMap[paymentId];
    if (!paymentAlert?.isSuspicious) {
      return;
    }
    setReviewedSuspiciousIds((current) => ({ ...current, [paymentId]: !current[paymentId] }));
  }

  function focusSuspiciousQueue() {
    const suspiciousBatchIds = suspiciousQueueBatches.map((batch) => batch.id);

    if (suspiciousBatchIds.length === 0) {
      return;
    }

    suspiciousBatchIds.forEach((batchId) => {
      void loadBatchPayments(batchId);
    });

    setExpandedBatches((current) => ({
      ...current,
      ...Object.fromEntries(suspiciousBatchIds.map((batchId) => [batchId, true]))
    }));

    document.getElementById("suspicious-queue")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function focusOperationalBatches() {
    document.getElementById("operational-batches")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openRejectModal(batchId: string, paymentId: string) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    setRejectionDraft({ batchId, paymentId, reason: rejectionReasonsById[paymentId] ?? "" });
  }

  function handleRestorePayment(batchId: string, paymentId: string) {
    if (!canManageApprovals) {
      notifyReadOnly();
      return;
    }

    updatePaymentStatus(batchId, paymentId, "PENDING");
  }

  return (
    <section className="grid gap-5 2xl:gap-6">
      <ExecutiveAlertsPanel
        overview={suspicionOverview}
        onReviewAlerts={focusSuspiciousQueue}
      />

      {suspiciousQueueBatches.length > 0 ? (
        <PendingSuspiciousQueue
          batches={suspiciousQueueBatches}
          selectedByBatch={selectedByBatch}
          expandedBatches={expandedBatches}
          loadingBatchPayments={loadingBatchPayments}
          loadedBatchPayments={loadedBatchPayments}
          alertMap={suspicionAnalysis.paymentMap}
          reviewedSuspiciousIds={reviewedSuspiciousIds}
          processingPaymentId={processingPaymentId}
          processingBatchId={processingBatchId}
          canManageApprovals={canManageApprovals}
          onApproveBatch={(batchId) => void handleApproveBatch(batchId)}
          onApproveSelected={(batchId) => void handleApproveSelected(batchId)}
          onExpandToggle={(batchId) => toggleExpanded(batchId)}
          onToggleAllSelections={toggleAllSelections}
          onPaymentSelectionChange={toggleSelection}
          onPaymentApprove={(batchId, paymentId) => void handleApprovePayment(batchId, paymentId)}
          onPaymentReject={(batchId, paymentId) => openRejectModal(batchId, paymentId)}
          onPaymentRestore={(batchId, paymentId) => handleRestorePayment(batchId, paymentId)}
          onShowDetails={(batchId, paymentId) => void handleShowDetails(batchId, paymentId)}
          onToggleReviewed={toggleReviewed}
        />
      ) : null}

      <FiltersBar
        filterType={filterType}
        filterStatus={filterStatus}
        search={search}
        readOnly={isReadOnly}
        canApproveAll={canApproveAllVisible}
        processingAllVisible={processingAllVisible}
        onApproveAll={() => {
          if (!canManageApprovals) {
            notifyReadOnly();
            return;
          }
          if (hasUnresolvedSuspicion) {
            notify("Aprovação total bloqueada", "Essa ação só é liberada quando os pagamentos suspeitos forem revisados ou tratados.", "warning");
            return;
          }
          setApproveAllDialogOpen(true);
        }}
        onViewBatches={focusOperationalBatches}
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
      <div className="grid gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Resumo operacional</p>
          <p className="text-sm leading-6 text-slate-600">Panorama consolidado dos lotes que seguem no fluxo de aprovação e das carteiras ativas no período.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:gap-4">
          <SummaryCard icon={Layers3} label="Total de lotes pendentes" value={summary.pendingBatchCount.toString()} helper="Lotes com ao menos um pagamento pendente" tone="blue" />
          <SummaryCard icon={CalendarClock} label="Total de pagamentos pendentes" value={summary.pendingPaymentCount.toString()} helper="Itens aguardando aprovação" tone="blue" />
          <SummaryCard icon={CircleDollarSign} label="Valor total pendente" value={formatCurrency(summary.pendingTotalAmount)} helper="Montante ainda não liberado" tone="teal" />
          <SummaryCard icon={Wallet} label="Quantidade de lotes de Resgate" value={summary.resgateBatchCount.toString()} helper="Carteira ativa de resgates" tone="slate" />
          <SummaryCard icon={Gift} label="Quantidade de lotes de Sorteio" value={summary.sorteioBatchCount.toString()} helper="Carteira ativa de sorteios" tone="slate" />
        </div>
      </div>

      <div id="operational-batches" className="grid gap-4 scroll-mt-24 2xl:gap-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Lotes liberados para decisao</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Área operacional com itens já triados e prontos para aprovação, rejeição ou consulta detalhada.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Fluxo operacional</span>
        </div>

        {initialLoadError ? (
          <EmptyState
            title="Não foi possível carregar os lotes"
            description={initialLoadError}
          />
        ) : visibleBatches.length === 0 ? (
          <EmptyState
            title="Nenhum lote encontrado para os filtros selecionados."
            description="Ajuste os filtros ou tente novamente quando houver lotes pendentes retornados pela API."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-1 2xl:gap-5">
            {visibleBatches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                selectedIds={selectedByBatch[batch.id] ?? []}
                isExpanded={expandedBatches[batch.id] ?? false}
                isLoadingPayments={loadingBatchPayments[batch.id] ?? false}
                hasLoadedPayments={loadedBatchPayments[batch.id] ?? false}
                alertMap={suspicionAnalysis.paymentMap}
                reviewedSuspiciousIds={reviewedSuspiciousIds}
                canManageApprovals={canManageApprovals}
                onApproveBatch={() => void handleApproveBatch(batch.id)}
                onApproveSelected={() => void handleApproveSelected(batch.id)}
                onExpandToggle={() => {
                  const isOpening = !(expandedBatches[batch.id] ?? false);
                  toggleExpanded(batch.id);
                  if (isOpening) {
                    focusBatchPayments(batch.id);
                  }
                }}
                onToggleAllSelections={toggleAllSelections}
                onPaymentSelectionChange={toggleSelection}
                onPaymentApprove={(paymentId) => void handleApprovePayment(batch.id, paymentId)}
                onPaymentReject={(paymentId) => openRejectModal(batch.id, paymentId)}
                onPaymentRestore={(paymentId) => handleRestorePayment(batch.id, paymentId)}
                onShowDetails={(paymentId) => void handleShowDetails(batch.id, paymentId)}
                onToggleReviewed={toggleReviewed}
                processingPaymentId={processingPaymentId}
                processingBatchId={processingBatchId}
              />
            ))}
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <PaymentDetailsDrawer
        batch={activeBatch}
        payment={currentPayment}
        paymentAlert={currentPaymentAlert}
        isReviewed={activePayment ? Boolean(reviewedSuspiciousIds[activePayment.paymentId]) : false}
        isLoading={loadingPaymentDetails}
        processingPaymentId={processingPaymentId}
        canManageApprovals={canManageApprovals}
        onClose={() => setActivePayment(null)}
        onApprove={() => {
          if (!activePayment) return;
          void handleApprovePayment(activePayment.batchId, activePayment.paymentId);
        }}
        onReject={() => {
          if (!activePayment) return;
          openRejectModal(activePayment.batchId, activePayment.paymentId);
        }}
        onRestore={() => {
          if (!activePayment) return;
          handleRestorePayment(activePayment.batchId, activePayment.paymentId);
        }}
        onToggleReviewed={() => {
          if (!activePayment) return;
          toggleReviewed(activePayment.paymentId);
        }}
      />

      <RejectionReasonModal
        draft={rejectionDraft}
        payment={rejectionDraft ? findPaymentById(batches, rejectionDraft.batchId, rejectionDraft.paymentId) : undefined}
        isSubmitting={processingPaymentId === rejectionDraft?.paymentId}
        onChangeReason={(reason) => setRejectionDraft((current) => (current ? { ...current, reason } : current))}
        onClose={() => setRejectionDraft(null)}
        onConfirm={() => {
          if (!rejectionDraft) return;
          void handleRejectPayment(rejectionDraft.batchId, rejectionDraft.paymentId, rejectionDraft.reason.trim());
        }}
      />

      <ApproveAllConfirmDialog
        isOpen={approveAllDialogOpen}
        batchCount={visibleBatches.filter((batch) => getBatchPendingCount(batch) > 0).length}
        isSubmitting={processingAllVisible}
        onClose={() => setApproveAllDialogOpen(false)}
        onConfirm={() => void handleApproveAllVisible()}
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
  const borderTone = tone === "teal" ? "border-l-emerald-500" : tone === "slate" ? "border-l-slate-400" : "border-l-[color:var(--brand)]";
  const iconTone = tone === "teal" ? "bg-emerald-50 text-emerald-700" : tone === "slate" ? "bg-slate-100 text-slate-700" : "bg-[color:var(--brand-soft)] text-[color:var(--brand-deep)]";

  return (
    <div className={cn("h-full rounded-xl border-l-4 bg-white px-4 py-4 shadow-[var(--shadow-soft)] 2xl:px-5 2xl:py-5", borderTone)}>
      <div className="flex h-full items-start gap-3 2xl:gap-4">
        <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full 2xl:h-11 2xl:w-11", iconTone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{value}</p>
          <p className="text-sm leading-5 text-slate-600">{helper}</p>
        </div>
      </div>
    </div>
  );
}

type ExecutiveAlertsPanelProps = {
  overview: SuspicionOverview;
  onReviewAlerts: () => void;
};

function ExecutiveAlertsPanel({ overview, onReviewAlerts }: ExecutiveAlertsPanelProps) {
  const hasUnresolved = overview.unresolvedSuspiciousCount > 0;
  const isHealthy = !hasUnresolved;
  const recommendation = hasUnresolved
    ? "Existem pagamentos suspeitos pendentes de revisão. Priorize a triagem antes de liberar o fluxo operacional."
    : "Nenhum pagamento suspeito permanece pendente de analise. O fluxo esta estabilizado e pronto para continuidade operacional.";

  return (
    <div className={cn("panel overflow-hidden px-4 py-4 sm:px-5 2xl:px-6 2xl:py-5", isHealthy ? "border-emerald-300 bg-emerald-50/70" : "border-amber-200 bg-white")}>
      <div className={cn("flex flex-col gap-4 pb-4 xl:flex-row xl:items-start xl:justify-between 2xl:gap-5 2xl:pb-5", isHealthy ? "border-b border-emerald-200" : "border-b border-[color:var(--border)]")}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full border", isHealthy ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-amber-200 bg-amber-100 text-amber-700")}>
              {isHealthy ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <p className={cn("text-sm font-semibold uppercase tracking-[0.14em]", isHealthy ? "text-emerald-700" : "text-amber-800")}>Resumo gerencial</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{isHealthy ? "Não há pagamentos suspeitos para serem analisados" : "Pagamentos suspeitos exigem avaliação"}</h2>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{recommendation}</p>
        </div>

        {hasUnresolved ? (
          <div className="flex flex-col items-stretch gap-3 sm:max-w-[280px]">
          <Button
            type="button"
            variant="danger"
            className="min-h-11 border-rose-700 bg-rose-600 px-5 font-semibold text-white shadow-md shadow-rose-900/15 hover:border-rose-800 hover:bg-rose-700"
            onClick={onReviewAlerts}
          >
              <AlertTriangle className="h-4 w-4" />
              Ver pagamentos suspeitos
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <AnalyticsAlertModel overview={overview} recommendation={recommendation} />
      </div>
    </div>
  );
}

function AnalyticsAlertModel({ overview, recommendation }: { overview: SuspicionOverview; recommendation: string }) {
  const statusTone = overview.unresolvedSuspiciousCount > 0 ? "critical" : "success";
  const statusLabel = statusTone === "critical" ? "Critico" : "Sem alerta";

  if (overview.unresolvedSuspiciousCount === 0) {
    return (
      <div className="grid gap-3 xl:max-w-[300px] 2xl:gap-4 2xl:max-w-[320px]">
        <PanelMetric label="Semaforo executivo" value={statusLabel} tone={statusTone} />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[240px_minmax(0,1fr)]">
        <PanelMetric label="Semaforo executivo" value={statusLabel} tone={statusTone} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PanelMetric label="Lotes com suspeita" value={String(overview.suspiciousBatchCount)} tone={overview.suspiciousBatchCount > 0 ? "warning" : "success"} />
          <PanelMetric label="Pagamentos suspeitos" value={String(overview.suspiciousPaymentCount)} tone={overview.suspiciousPaymentCount > 0 ? "warning" : "success"} />
          <PanelMetric label="Pendências sem revisão" value={String(overview.unresolvedSuspiciousCount)} tone={overview.unresolvedSuspiciousCount > 0 ? "critical" : "success"} />
          <PanelMetric label="Valor sob analise" value={formatCurrency(overview.totalValueUnderAnalysis)} tone={overview.totalValueUnderAnalysis > 0 ? "info" : "success"} />
        </div>
      </div>
      <div className="sub-panel bg-[color:var(--surface-muted)] px-4 py-4 2xl:px-5 2xl:py-5">
        <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr] 2xl:gap-5">
          <div>
            <p className="text-sm font-semibold text-slate-950">Leitura consolidada</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation}</p>
            <div className="mt-4">
              <ReasonList reasons={overview.topReasons} compact />
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Excecoes mais relevantes</p>
              <div className="mt-3">
                <CaseList cases={overview.topCases} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelMetric({ label, value, tone }: { label: string; value: string; tone: "warning" | "critical" | "success" | "info" }) {
  return <div className={cn("flex min-h-[78px] flex-col justify-between rounded-xl border-l-4 px-3 py-3 2xl:min-h-[88px] 2xl:px-4", tone === "critical" && "border-rose-500 bg-rose-100", tone === "warning" && "border-amber-500 bg-amber-100", tone === "success" && "border-emerald-400 bg-emerald-50", tone === "info" && "border-sky-400 bg-sky-50")}><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold text-slate-950 2xl:text-xl">{value}</p></div>;
}

function CompactInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[color:var(--border)] bg-white px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-950">{value}</p></div>;
}

function ReasonList({ reasons, compact = false }: { reasons: Array<{ reason: SuspicionReason; count: number }>; compact?: boolean }) {
  return <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Principais motivos</p><div className={cn("mt-3 space-y-2", compact && "space-y-1.5")}>{reasons.length === 0 ? <p className="text-sm text-slate-500">Nenhum motivo crítico encontrado na tela atual.</p> : reasons.map((item) => <div key={item.reason} className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white px-3 py-2"><span className="text-sm text-slate-700">{formatSuspicionReason(item.reason)}</span><span className="data-chip">{item.count}</span></div>)}</div></div>;
}

function CaseList({ cases, compact = false }: { cases: SuspicionOverview["topCases"]; compact?: boolean }) {
  return <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Casos em destaque</p><div className={cn("mt-3 space-y-2.5", compact && "space-y-2")}>{cases.length === 0 ? <p className="text-sm leading-6 text-slate-500">Nenhum pagamento suspeito permanece pendente na leitura atual.</p> : cases.map((item) => <div key={item.paymentId} className={cn("rounded-xl border-l-4 px-4 py-3", item.severity === "critical" ? "border-rose-500 bg-rose-100" : "border-amber-500 bg-amber-100")}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-950">{item.beneficiaryName}</p><p className="text-xs text-slate-600">Lote {item.batchNumber} • {formatCurrency(item.value)}</p></div><span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{item.isResolved ? "Revisado" : "Pendente"}</span></div><p className="mt-2 text-xs leading-5 text-slate-700">{item.reasons.map(formatSuspicionReason).join(" • ")}</p></div>)}</div></div>;
}

function PendingSuspiciousQueue(props: {
  batches: VisibleBatch[];
  selectedByBatch: Record<string, string[]>;
  expandedBatches: Record<string, boolean>;
  loadingBatchPayments: Record<string, boolean>;
  loadedBatchPayments: Record<string, boolean>;
  alertMap: Record<string, PaymentAlert>;
  reviewedSuspiciousIds: Record<string, boolean>;
  processingPaymentId: string | null;
  processingBatchId: string | null;
  canManageApprovals: boolean;
  onApproveBatch: (batchId: string) => void;
  onApproveSelected: (batchId: string) => void;
  onExpandToggle: (batchId: string) => void;
  onToggleAllSelections: (batchId: string, paymentIds: string[], checked: boolean) => void;
  onPaymentSelectionChange: (batchId: string, paymentId: string, checked: boolean) => void;
  onPaymentApprove: (batchId: string, paymentId: string) => void;
  onPaymentReject: (batchId: string, paymentId: string) => void;
  onPaymentRestore: (batchId: string, paymentId: string) => void;
  onShowDetails: (batchId: string, paymentId: string) => void;
  onToggleReviewed: (paymentId: string) => void;
}) {
  const {
    batches,
    selectedByBatch,
    expandedBatches,
    loadingBatchPayments,
    loadedBatchPayments,
    alertMap,
    reviewedSuspiciousIds,
    processingPaymentId,
    processingBatchId,
    canManageApprovals,
    onApproveBatch,
    onApproveSelected,
    onExpandToggle,
    onToggleAllSelections,
    onPaymentSelectionChange,
    onPaymentApprove,
    onPaymentReject,
    onPaymentRestore,
    onShowDetails,
    onToggleReviewed
  } = props;

  return (
    <section id="suspicious-queue" className="grid gap-5 scroll-mt-24">
      <div className="panel border-amber-300 bg-amber-100 px-4 py-4 sm:px-5 2xl:px-6 2xl:py-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-800">Pagamentos suspeitos pendentes</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Triagem prioritária da gestão</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Os itens abaixo permanecem fora do fluxo operacional até serem revisados, aprovados individualmente ou rejeitados.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
            {batches.length} lote(s) com alerta ativo
          </span>
        </div>
      </div>

      <div className="grid gap-4 2xl:gap-5">
        {batches.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            selectedIds={selectedByBatch[batch.id] ?? []}
            isExpanded={expandedBatches[batch.id] ?? true}
            isLoadingPayments={loadingBatchPayments[batch.id] ?? false}
            hasLoadedPayments={loadedBatchPayments[batch.id] ?? false}
            alertMap={alertMap}
            reviewedSuspiciousIds={reviewedSuspiciousIds}
            canManageApprovals={canManageApprovals}
            onApproveBatch={() => onApproveBatch(batch.id)}
            onApproveSelected={() => onApproveSelected(batch.id)}
            onExpandToggle={() => onExpandToggle(batch.id)}
            onToggleAllSelections={onToggleAllSelections}
            onPaymentSelectionChange={onPaymentSelectionChange}
            onPaymentApprove={(paymentId) => onPaymentApprove(batch.id, paymentId)}
            onPaymentReject={(paymentId) => onPaymentReject(batch.id, paymentId)}
            onPaymentRestore={(paymentId) => onPaymentRestore(batch.id, paymentId)}
            onShowDetails={(paymentId) => onShowDetails(batch.id, paymentId)}
            onToggleReviewed={onToggleReviewed}
            processingPaymentId={processingPaymentId}
            processingBatchId={processingBatchId}
          />
        ))}
      </div>
    </section>
  );
}

type BatchCardProps = {
  batch: VisibleBatch;
  selectedIds: string[];
  isExpanded: boolean;
  isLoadingPayments: boolean;
  hasLoadedPayments: boolean;
  alertMap: Record<string, PaymentAlert>;
  reviewedSuspiciousIds: Record<string, boolean>;
  canManageApprovals: boolean;
  onApproveBatch: () => void;
  onApproveSelected: () => void;
  onExpandToggle: () => void;
  onToggleAllSelections: (batchId: string, paymentIds: string[], checked: boolean) => void;
  onPaymentSelectionChange: (batchId: string, paymentId: string, checked: boolean) => void;
  onPaymentApprove: (paymentId: string) => void;
  onPaymentReject: (paymentId: string) => void;
  onPaymentRestore: (paymentId: string) => void;
  onShowDetails: (paymentId: string) => void;
  onToggleReviewed: (paymentId: string) => void;
  processingPaymentId: string | null;
  processingBatchId: string | null;
};

function BatchCard(props: BatchCardProps) {
  const { batch, selectedIds, isExpanded, isLoadingPayments, hasLoadedPayments, alertMap, reviewedSuspiciousIds, canManageApprovals, onApproveBatch, onApproveSelected, onExpandToggle, onToggleAllSelections, onPaymentSelectionChange, onPaymentApprove, onPaymentReject, onPaymentRestore, onShowDetails, onToggleReviewed, processingPaymentId, processingBatchId } = props;
  const batchPayments = batch.payments ?? [];
  const paymentCount = batchPayments.length > 0 ? batchPayments.length : batch.paymentCount ?? 0;
  const pendingCount = batch.pendingCount ?? batchPayments.filter((payment) => payment.status === "PENDING").length;
  const approvedCount = batch.approvedCount ?? batchPayments.filter((payment) => payment.status === "APPROVED").length;
  const rejectedCount = batch.rejectedCount ?? batchPayments.filter((payment) => payment.status === "REJECTED").length;
  const selectedCount = batchPayments.filter((payment) => selectedIds.includes(payment.id) && payment.status === "PENDING").length;
  const totalValue = batch.totalAmount ?? batchPayments.reduce((total, payment) => total + payment.grossAmount, 0);
  const hasSuspiciousPending = batch.alert.unresolvedSuspiciousCount > 0;
  const actionDisabled = !canManageApprovals || pendingCount === 0 || processingBatchId === batch.id || hasSuspiciousPending;

  return <article className={cn("panel relative overflow-hidden rounded-xl border-2", hasSuspiciousPending ? (batch.alert.severity === "critical" ? "border-rose-500 bg-rose-50/60" : "border-amber-500 bg-amber-50/80") : "border-[color:var(--border)]")}><div className={cn("absolute inset-x-0 top-0 h-1.5", batch.benefitType === "SORTEIO" ? "bg-[color:var(--brand)]" : "bg-emerald-600")} /><div className="flex flex-col gap-4 px-4 py-4 sm:px-5 2xl:gap-5 2xl:px-6 2xl:py-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between 2xl:gap-5"><div className="min-w-0 space-y-3 2xl:space-y-4"><div className="flex flex-wrap items-center gap-2 2xl:gap-3"><BenefitBadge benefitType={batch.benefitType} /><BatchProcessingBadge pendingCount={pendingCount} approvedCount={approvedCount} rejectedCount={rejectedCount} />{batch.alert.totalSuspiciousCount > 0 ? <SuspiciousFlagBadge severity={batch.alert.severity ?? "warning"} label={`${batch.alert.totalSuspiciousCount} suspeito(s)`} /> : null}</div><div className="space-y-1.5 2xl:space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 2xl:text-sm 2xl:tracking-[0.18em]">Identificador do lote</p><h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950 2xl:text-2xl 2xl:tracking-[-0.04em]">{batch.batchNumber}</h3><p className="text-sm leading-6 text-slate-600">{formatBenefitType(batch.benefitType)} com {paymentCount} pagamento(s), programado para {formatDate(batch.scheduledAt)}.</p></div></div><div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col 2xl:gap-3">{canManageApprovals ? <Button type="button" variant="primary" disabled={actionDisabled} onClick={onApproveBatch}>Aprovar lote</Button> : null}<Button type="button" variant="secondary" onClick={onExpandToggle}>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{isExpanded ? "Ocultar detalhes" : "Expandir detalhes"}</Button></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricPill icon={Layers3} label="Quantidade de pagamentos" value={`${paymentCount}`} /><MetricPill icon={CircleDollarSign} label="Valor total do lote" value={formatCurrency(totalValue)} /><MetricPill icon={CalendarDays} label="Status do lote" value={describeBatchProcessing(pendingCount, approvedCount, rejectedCount)} /><MetricPill icon={CircleCheckBig} label="Selecionados para aprovação" value={`${selectedCount}`} /></div><div className="flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-3 text-sm text-slate-600 2xl:px-4"><BenefitBadge benefitType={batch.benefitType} /><span className="data-chip">Competência: {batch.competence}</span><span className="data-chip">Pendentes: {pendingCount}</span><span className="data-chip">Aprovados: {approvedCount}</span><span className="data-chip">Rejeitados: {rejectedCount}</span>{batch.alert.totalSuspiciousCount > 0 ? <span className="data-chip">Suspeitos: {batch.alert.totalSuspiciousCount}</span> : null}</div>{hasSuspiciousPending ? <div className="rounded-lg border border-amber-400 bg-amber-100 px-3 py-3 text-sm font-medium text-amber-950 2xl:px-4">Este lote possui pagamentos suspeitos pendentes de revisão. Trate os itens sinalizados antes de liberar aprovação ampla.</div> : null}{isExpanded ? (isLoadingPayments ? <LoadingBatchPayments /> : batch.hasPaymentDetails ? <PaymentList batchId={batch.id} batchPayments={batchPayments} payments={batch.visiblePayments} totalPayments={paymentCount} selectedIds={selectedIds} alertMap={alertMap} reviewedSuspiciousIds={reviewedSuspiciousIds} canManageApprovals={canManageApprovals} onApproveSelected={onApproveSelected} onToggleAllSelections={onToggleAllSelections} onPaymentSelectionChange={onPaymentSelectionChange} onPaymentApprove={onPaymentApprove} onPaymentReject={onPaymentReject} onPaymentRestore={onPaymentRestore} onShowDetails={onShowDetails} onToggleReviewed={onToggleReviewed} processingPaymentId={processingPaymentId} isProcessingBatch={processingBatchId === batch.id} /> : hasLoadedPayments ? <EmptyBatchPayments batchNumber={batch.batchNumber} /> : <UnavailablePaymentDetails />) : null}</div></article>;
}

function UnavailablePaymentDetails() { return <div className="sub-panel flex flex-col gap-3 px-4 py-4 text-sm text-slate-600 2xl:px-5 2xl:py-5"><p className="section-title">Detalhes do lote</p><p>Expanda o lote para carregar os pagamentos diretamente da API e preencher esta área em tempo real.</p></div>; }
function LoadingBatchPayments() { return <div className="sub-panel flex flex-col gap-3 px-4 py-4 text-sm text-slate-600 2xl:px-5 2xl:py-5"><p className="section-title">Carregando pagamentos</p><div className="grid gap-3 sm:grid-cols-2"><div className="h-20 animate-pulse rounded-xl bg-slate-100" /><div className="h-20 animate-pulse rounded-xl bg-slate-100" /></div></div>; }
function EmptyBatchPayments({ batchNumber }: { batchNumber: string }) { return <div className="sub-panel flex flex-col gap-3 px-4 py-4 text-sm text-slate-600 2xl:px-5 2xl:py-5"><p className="section-title">Nenhum pagamento retornado</p><p>O lote {batchNumber} foi encontrado, mas a API não retornou pagamentos para esta consulta.</p></div>; }
function MetricPill({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) { return <div className="flex min-w-0 items-center gap-3 rounded-lg border-l-4 border-slate-300 bg-[color:var(--surface-muted)] px-3 py-3 2xl:px-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white 2xl:h-10 2xl:w-10"><Icon className="h-4 w-4 text-[color:var(--brand-deep)]" /></div><div className="min-w-0 space-y-0.5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 2xl:text-xs 2xl:tracking-[0.16em]">{label}</p><p className="break-words text-sm font-semibold text-slate-950">{value}</p></div></div>; }

function BatchProcessingBadge({ pendingCount, approvedCount, rejectedCount }: { pendingCount: number; approvedCount: number; rejectedCount: number }) { if (pendingCount === 0 && rejectedCount === 0 && approvedCount > 0) return <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">Lote aprovado</span>; if (pendingCount === 0 && approvedCount === 0 && rejectedCount > 0) return <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700">Lote rejeitado</span>; return <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-800">{approvedCount} aprovado(s)</span><span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700">{rejectedCount} rejeitado(s)</span>{pendingCount > 0 ? <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">{pendingCount} pendente(s)</span> : null}</div>; }

function describeBatchProcessing(pendingCount: number, approvedCount: number, rejectedCount: number) { if (pendingCount === 0 && rejectedCount === 0 && approvedCount > 0) return "Lote aprovado"; if (pendingCount === 0 && approvedCount === 0 && rejectedCount > 0) return "Lote rejeitado"; const parts: string[] = []; if (rejectedCount > 0) parts.push(`${rejectedCount} rejeitado(s)`); if (approvedCount > 0) parts.push(`${approvedCount} aprovado(s)`); if (pendingCount > 0) parts.push(`${pendingCount} pendente(s)`); return parts.join(" • "); }

function PaymentList(props: {
  batchId: string;
  batchPayments: Payment[];
  payments: Payment[];
  totalPayments: number;
  selectedIds: string[];
  alertMap: Record<string, PaymentAlert>;
  reviewedSuspiciousIds: Record<string, boolean>;
  canManageApprovals: boolean;
  onApproveSelected: () => void;
  onToggleAllSelections: (batchId: string, paymentIds: string[], checked: boolean) => void;
  onPaymentSelectionChange: (batchId: string, paymentId: string, checked: boolean) => void;
  onPaymentApprove: (paymentId: string) => void;
  onPaymentReject: (paymentId: string) => void;
  onPaymentRestore: (paymentId: string) => void;
  onShowDetails: (paymentId: string) => void;
  onToggleReviewed: (paymentId: string) => void;
  processingPaymentId: string | null;
  isProcessingBatch: boolean;
}) {
  const {
    batchId,
    batchPayments,
    payments,
    totalPayments,
    selectedIds,
    alertMap,
    reviewedSuspiciousIds,
    canManageApprovals,
    onApproveSelected,
    onToggleAllSelections,
    onPaymentSelectionChange,
    onPaymentApprove,
    onPaymentReject,
    onPaymentRestore,
    onShowDetails,
    onToggleReviewed,
    processingPaymentId,
    isProcessingBatch
  } = props;

  const visiblePendingIds = payments.filter((payment) => payment.status === "PENDING").map((payment) => payment.id);
  const selectedPending = payments.filter(
    (payment) => payment.status === "PENDING" && selectedIds.includes(payment.id)
  ).length;
  const unresolvedSuspiciousSelected = batchPayments.filter((payment) => {
    const alert = alertMap[payment.id];
    return payment.status === "PENDING" && selectedIds.includes(payment.id) && alert?.isSuspicious && !alert.isResolved;
  }).length;
  const allVisiblePendingSelected =
    visiblePendingIds.length > 0 && visiblePendingIds.every((paymentId) => selectedIds.includes(paymentId));

  return (
    <div id={`batch-payments-${batchId}`} className="sub-panel scroll-mt-24 overflow-hidden rounded-xl">
      <div className="flex flex-col gap-3 border-b border-[color:var(--border)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between 2xl:gap-4 2xl:px-5 2xl:py-4">
        <div>
          <p className="section-title">Pagamentos do lote</p>
          <p className="mt-1 text-sm text-slate-600">
            Exibindo {payments.length} de {totalPayments} pagamento(s).
          </p>
        </div>

        {canManageApprovals ? (
          <Button
            type="button"
            variant="success"
            disabled={selectedPending === 0 || isProcessingBatch || unresolvedSuspiciousSelected > 0}
            onClick={onApproveSelected}
          >
            Aprovar selecionados
          </Button>
        ) : (
          <span className="data-chip">Somente leitura</span>
        )}
      </div>

      <div className="flex flex-col gap-3 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 2xl:gap-4 2xl:px-5 2xl:py-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={allVisiblePendingSelected}
            disabled={!canManageApprovals || visiblePendingIds.length === 0}
            onChange={(event) => onToggleAllSelections(batchId, visiblePendingIds, event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
          />
          Selecionar todos os pagamentos pendentes visíveis
        </label>

        {unresolvedSuspiciousSelected > 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Pagamentos suspeitos não revisados não entram na aprovação em lote.</p>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] border-separate border-spacing-0 xl:min-w-full">
          <thead className="bg-[color:var(--surface-muted)]">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-4 py-3 2xl:px-5 2xl:py-4">Selecionar</th>
              <th className="px-3 py-3 2xl:px-4 2xl:py-4">Beneficiario</th>
              <th className="px-3 py-3 2xl:px-4 2xl:py-4">Documento</th>
              <th className="px-3 py-3 2xl:px-4 2xl:py-4">Valor bruto</th>
              <th className="px-3 py-3 2xl:px-4 2xl:py-4">Data pagamento</th>
              <th className="px-3 py-3 2xl:px-4 2xl:py-4">Status</th>
              <th className="px-3 py-3 2xl:px-4 2xl:py-4">Risco</th>
              <th className="px-3 py-3 2xl:px-4 2xl:py-4">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const isPending = payment.status === "PENDING";
              const isSelected = selectedIds.includes(payment.id);
              const paymentAlert = alertMap[payment.id];
              const isSuspicious = Boolean(paymentAlert?.isSuspicious);
              const isReviewed = Boolean(reviewedSuspiciousIds[payment.id]) || Boolean(paymentAlert?.isResolved);

              return (
                <tr
                  key={payment.id}
                  className={cn(
                    "border-t border-[color:var(--border)] transition-colors hover:bg-slate-50",
                    isSuspicious && paymentAlert?.severity === "critical" && "bg-rose-100/90 hover:bg-rose-100",
                    isSuspicious && paymentAlert?.severity === "warning" && "bg-amber-100/90 hover:bg-amber-100",
                    !isSuspicious && isSelected && isPending && "bg-sky-50/70"
                  )}
                >
                  <td className="px-4 py-3 2xl:px-5 2xl:py-4">
                    <input
                      type="checkbox"
                      checked={isPending && isSelected}
                      disabled={!canManageApprovals || !isPending}
                      onChange={(event) => onPaymentSelectionChange(batchId, payment.id, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                    />
                  </td>
                  <td className="px-3 py-3 2xl:px-4 2xl:py-4">
                    <div className="min-w-[220px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{payment.beneficiaryName}</p>
                        {isSuspicious ? (
                          <SuspiciousFlagBadge severity={paymentAlert?.severity ?? "warning"} label="Suspeito" />
                        ) : null}
                        {isSuspicious && isReviewed ? <ReviewBadge /> : null}
                      </div>
                      <p className="text-sm text-slate-500">{payment.reference}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600 2xl:px-4 2xl:py-4">{formatDocument(payment.document)}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-900 2xl:px-4 2xl:py-4">
                    {formatCurrency(payment.grossAmount)}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600 2xl:px-4 2xl:py-4">{formatDate(payment.paymentDate)}</td>
                  <td className="px-3 py-3 2xl:px-4 2xl:py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-3 py-3 2xl:px-4 2xl:py-4">
                    {isSuspicious ? (
                      <div className="space-y-2">
                        <p className="text-xs leading-5 text-slate-700">
                          {paymentAlert?.reasons.map(formatSuspicionReason).join(" • ")}
                        </p>
                        {payment.status === "PENDING" && canManageApprovals ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className={cn(
                              "min-h-9 min-w-[132px] justify-center whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm 2xl:min-h-10 2xl:min-w-[148px] 2xl:px-4",
                              isReviewed
                                ? "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                                : "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                            )}
                            onClick={() => onToggleReviewed(payment.id)}
                          >
                            {isReviewed ? "Cancelar revisão" : "Aceitar"}
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Sem alerta</span>
                    )}
                  </td>
                  <td className="px-3 py-3 2xl:px-4 2xl:py-4">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onShowDetails(payment.id)}>
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </Button>

                      {canManageApprovals && payment.status === "PENDING" ? (
                        <>
                          <Button
                            type="button"
                            variant="success"
                            size="sm"
                            disabled={processingPaymentId === payment.id}
                            onClick={() => onPaymentApprove(payment.id)}
                          >
                            Aprovar
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={processingPaymentId === payment.id}
                            onClick={() => onPaymentReject(payment.id)}
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </Button>
                        </>
                      ) : null}

                      {canManageApprovals && payment.status === "REJECTED" ? (
                        <Button type="button" variant="secondary" size="sm" onClick={() => onPaymentRestore(payment.id)}>
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

function RejectionReasonModal({ draft, payment, isSubmitting, onChangeReason, onClose, onConfirm }: { draft: RejectionDraft; payment?: Payment; isSubmitting: boolean; onChangeReason: (reason: string) => void; onClose: () => void; onConfirm: () => void; }) { if (!draft || !payment) return null; return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/30 px-4" role="dialog" aria-modal="true"><button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Fechar modal de rejeição" /><div className="panel relative z-10 w-full max-w-xl px-4 py-4 sm:px-5 2xl:px-6 2xl:py-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">Rejeitar pagamento</p><h3 className="mt-2 text-xl font-semibold text-slate-950 2xl:text-2xl">{payment.beneficiaryName}</h3></div><Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></div><label className="mt-4 block 2xl:mt-5"><span className="mb-2 block text-sm font-semibold text-slate-800">Motivo da rejeição</span><textarea value={draft.reason} onChange={(event) => onChangeReason(event.target.value)} rows={5} placeholder="Descreva por que este pagamento está sendo rejeitado..." className="w-full rounded-lg border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-sky-100" /></label><div className="mt-4 flex flex-wrap justify-end gap-3 2xl:mt-5"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="button" variant="danger" onClick={onConfirm} disabled={isSubmitting}>Confirmar rejeição</Button></div></div></div>; }
function ApproveAllConfirmDialog({ isOpen, batchCount, isSubmitting, onClose, onConfirm }: { isOpen: boolean; batchCount: number; isSubmitting: boolean; onClose: () => void; onConfirm: () => void; }) { if (!isOpen) return null; return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/30 px-4" role="dialog" aria-modal="true"><button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Fechar confirmação" /><div className="panel relative z-10 w-full max-w-lg px-4 py-4 sm:px-5 2xl:px-6 2xl:py-6"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">Confirmar aprovação</p><h3 className="mt-2 text-xl font-semibold text-slate-950 2xl:text-2xl">Aprovar todos os lotes visíveis</h3><p className="mt-3 text-sm leading-6 text-slate-600">Essa ação realizará a aprovação de todos os lotes disponíveis em tela. Deseja prosseguir com {batchCount} lote(s)?</p><div className="mt-5 flex flex-wrap justify-end gap-3 2xl:mt-6"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="button" variant="primary" onClick={onConfirm} disabled={isSubmitting}>Confirmar aprovação</Button></div></div></div>; }

function PaymentDetailsDrawer({
  batch,
  payment,
  paymentAlert,
  isReviewed,
  isLoading,
  processingPaymentId,
  canManageApprovals,
  onClose,
  onApprove,
  onReject,
  onRestore,
  onToggleReviewed
}: {
  batch?: PaymentBatch;
  payment?: Payment;
  paymentAlert?: PaymentAlert;
  isReviewed: boolean;
  isLoading: boolean;
  processingPaymentId: string | null;
  canManageApprovals: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRestore: () => void;
  onToggleReviewed: () => void;
}) {
  useEffect(() => {
    if (!payment) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, payment]);

  if (!payment || !batch) return null;

  const observation = payment.observations ?? getPaymentObservation(payment, batch);
  const isApproved = payment.status === "APPROVED";
  const isRejected = payment.status === "REJECTED";
  const isSuspicious = Boolean(paymentAlert?.isSuspicious);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fechar detalhes" className="absolute inset-0 cursor-default" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-[640px] flex-col border-l border-[color:var(--border)] bg-white shadow-sm 2xl:max-w-[680px]">
        <div className="border-b border-[color:var(--border)] px-4 py-4 sm:px-5 2xl:px-6 2xl:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Detalhes do pagamento</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{payment.beneficiaryName}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={payment.status} />
                <BenefitBadge benefitType={payment.benefitType ?? batch.benefitType} />
                {isSuspicious ? (
                  <SuspiciousFlagBadge severity={paymentAlert?.severity ?? "warning"} label="Suspeito" />
                ) : null}
                {isSuspicious && isReviewed ? <ReviewBadge /> : null}
              </div>
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 2xl:space-y-6 2xl:px-6 2xl:py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBlock icon={ShieldCheck} label="Nome do beneficiário" value={payment.beneficiaryName} />
            <DetailBlock icon={FileBadge2} label="Documento do beneficiário" value={formatDocument(payment.document)} />
            <DetailBlock icon={CircleDollarSign} label="Valor bruto do pagamento" value={formatCurrency(payment.grossAmount)} />
            <DetailBlock icon={CalendarDays} label="Data para pagamento" value={formatDate(payment.paymentDate)} />
            <DetailBlock icon={Gift} label="Tipo do benefício" value={formatBenefitType(payment.benefitType ?? batch.benefitType)} />
            <DetailBlock icon={Layers3} label="Status atual" value={statusLabel(payment.status)} />
          </div>

          {isSuspicious ? (
            <DrawerSection
              icon={AlertTriangle}
              title="Sinais de alerta"
              description="Regras que colocaram este pagamento fora do ponto medio esperado."
            >
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900 2xl:px-4 2xl:py-4">
                  {paymentAlert?.reasons.map(formatSuspicionReason).join(" • ")}
                </div>

                {payment.status === "PENDING" && canManageApprovals ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className={cn(
                      "min-h-9 min-w-[132px] whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm 2xl:min-h-10 2xl:min-w-[148px] 2xl:px-4 2xl:py-2.5",
                      isReviewed
                        ? "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                        : "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                    )}
                    onClick={onToggleReviewed}
                  >
                    {isReviewed ? "Cancelar revisão" : "Aceitar"}
                  </Button>
                ) : null}
              </div>
            </DrawerSection>
          ) : null}

          <DrawerSection
            icon={ShieldCheck}
            title="Observacoes"
            description="Contexto de apoio para a revisão antes da decisão."
          >
            <div className="rounded-lg bg-[color:var(--surface-muted)] px-3 py-3 text-sm leading-6 text-slate-700 2xl:px-4 2xl:py-4">
              {isLoading ? "Atualizando detalhes do pagamento com os dados mais recentes do backend..." : observation}
            </div>
          </DrawerSection>
        </div>

        <div className="border-t border-[color:var(--border)] bg-white px-4 py-4 sm:px-5 2xl:px-6 2xl:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {canManageApprovals
                ? "Use as acoes abaixo para concluir a analise deste pagamento."
                : "Seu perfil esta configurado para consulta. As acoes operacionais ficam bloqueadas nesta tela."}
            </p>

            <div className="flex flex-wrap gap-3">
              {canManageApprovals ? (
                <>
                  <Button
                    type="button"
                    variant="success"
                    onClick={onApprove}
                    disabled={isApproved || processingPaymentId === payment.id}
                  >
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={onReject}
                    disabled={isRejected || processingPaymentId === payment.id}
                  >
                    Rejeitar
                  </Button>
                  {isRejected ? (
                    <Button type="button" variant="secondary" onClick={onRestore}>
                      Voltar para pendente
                    </Button>
                  ) : null}
                </>
              ) : (
                <span className="data-chip">Somente leitura</span>
              )}

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
function DrawerSection({ icon: Icon, title, description, children }: { icon: ComponentType<{ className?: string }>; title: string; description: string; children: ReactNode; }) { return <section className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-4 2xl:px-5 2xl:py-5"><div className="flex items-start gap-3 2xl:gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)] 2xl:h-11 2xl:w-11"><Icon className="h-5 w-5 text-[color:var(--brand-deep)]" /></div><div className="min-w-0 flex-1 space-y-3 2xl:space-y-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 2xl:text-sm 2xl:tracking-[0.18em]">{title}</p><p className="mt-1 text-sm text-slate-600">{description}</p></div>{children}</div></div></section>; }
function DetailBlock({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value?: string; }) { return <div className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 2xl:px-5 2xl:py-4"><div className="flex items-start gap-3 2xl:gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)] 2xl:h-11 2xl:w-11"><Icon className="h-5 w-5 text-[color:var(--brand-deep)]" /></div><div className="min-w-0 space-y-1"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 2xl:text-sm 2xl:tracking-[0.16em]">{label}</p><p className="break-words text-sm font-semibold text-slate-950 2xl:text-base">{value ?? "-"}</p></div></div></div>; }
function SuspiciousFlagBadge({ severity, label = "Suspeito" }: { severity: AlertSeverity; label?: string }) { return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", severity === "critical" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800")}><AlertTriangle className="h-3.5 w-3.5" />{label}</span>; }
function ReviewBadge() { return <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-800">Revisado</span>; }
function getPaymentObservation(payment: Payment, batch: PaymentBatch) { const benefitLabel = formatBenefitType(batch.benefitType).toLowerCase(); if (payment.status === "APPROVED") return `Pagamento de ${benefitLabel} validado para liberação, sem divergências documentais e mantido no lote ${batch.batchNumber}.`; if (payment.status === "REJECTED") return `Pagamento retirado do lote ${batch.batchNumber} para revisão manual. É recomendado validar os dados cadastrais antes de uma nova submissão.`; return "Pagamento aguardando decisão da gestora. A recomendação é conferir documento, valor bruto e enquadramento do benefício antes da aprovação final."; }
function buildRejectionObservation(reason: string, currentObservation?: string) { return reason.trim() ? `Motivo da rejeicao informado pela gestora: ${reason.trim()}` : currentObservation; }
function buildDashboardSummary(batches: PaymentBatch[]): ResumoDashboard { return { pendingBatchCount: batches.filter((batch) => getBatchPendingCount(batch) > 0).length, pendingPaymentCount: batches.reduce((total, batch) => total + getBatchPendingCount(batch), 0), pendingTotalAmount: batches.reduce((total, batch) => { if ((batch.payments ?? []).length > 0) return total + (batch.payments ?? []).filter((payment) => payment.status === "PENDING").reduce((subtotal, payment) => subtotal + payment.grossAmount, 0); return total + (getBatchPendingCount(batch) > 0 ? batch.totalAmount ?? 0 : 0); }, 0), resgateBatchCount: batches.filter((batch) => batch.benefitType === "RESGATE").length, sorteioBatchCount: batches.filter((batch) => batch.benefitType === "SORTEIO").length }; }
function getBatchPendingCount(batch: PaymentBatch) { return batch.pendingCount ?? (batch.payments ?? []).filter((payment) => payment.status === "PENDING").length; }
function matchesLoteStatus(batch: PaymentBatch, status: PaymentStatus) { if ((batch.payments ?? []).length > 0) return (batch.payments ?? []).some((payment) => payment.status === status); if (!batch.status) return status === "PENDING"; if (batch.status === "PARTIALLY_APPROVED") return status === "PENDING"; return batch.status === status; }
function matchesBatchSearch(batch: PaymentBatch, search: string) { if (!search.trim()) return false; const normalizedSearch = normalizeText(search); return normalizeText(batch.id).includes(normalizedSearch) || normalizeText(batch.batchNumber).includes(normalizedSearch); }
function matchesPaymentSearch(payment: Payment, search: string) { if (!search.trim()) return true; const normalizedSearch = normalizeText(search); return normalizeText(payment.beneficiaryName).includes(normalizedSearch) || normalizeText(payment.document).includes(normalizedSearch); }
function statusLabel(status: PaymentStatus) { if (status === "APPROVED") return "Aprovado"; if (status === "REJECTED") return "Rejeitado"; return "Pendente"; }
function analyzeSuspiciousPayments(batches: PaymentBatch[], reviewedSuspiciousIds: Record<string, boolean>): SuspicionAnalysis { const paymentMap: Record<string, PaymentAlert> = {}; const batchMap: Record<string, BatchAlert> = {}; batches.forEach((batch) => { const batchPayments = batch.payments ?? []; const pendingPayments = batchPayments.filter((payment) => payment.status === "PENDING"); const reasonsByPaymentId = new Map<string, Set<SuspicionReason>>(); const totalValue = pendingPayments.reduce((total, payment) => total + payment.grossAmount, 0); const averageValue = pendingPayments.length > 0 ? totalValue / pendingPayments.length : 0; const paymentsByBeneficiary = new Map<string, Payment[]>(); batchPayments.forEach((payment) => { reasonsByPaymentId.set(payment.id, new Set<SuspicionReason>()); }); pendingPayments.forEach((payment) => { const key = normalizeText(payment.beneficiaryName || `pagamento-${payment.id}`); const current = paymentsByBeneficiary.get(key) ?? []; current.push(payment); paymentsByBeneficiary.set(key, current); }); if (averageValue > 0) pendingPayments.forEach((payment) => { if (payment.grossAmount > averageValue * 2) reasonsByPaymentId.get(payment.id)?.add("HIGH_VALUE"); }); paymentsByBeneficiary.forEach((beneficiaryPayments) => { if (beneficiaryPayments.length > 1) beneficiaryPayments.forEach((payment) => reasonsByPaymentId.get(payment.id)?.add("DUPLICATE_BENEFICIARY")); }); const concentrationRanking = Array.from(paymentsByBeneficiary.values()).map((beneficiaryPayments) => ({ totalValue: beneficiaryPayments.reduce((total, payment) => total + payment.grossAmount, 0), payments: beneficiaryPayments })).sort((left, right) => right.totalValue - left.totalValue); if (totalValue > 0 && concentrationRanking[0] && concentrationRanking[0].totalValue / totalValue > 0.4) concentrationRanking[0].payments.forEach((payment) => reasonsByPaymentId.get(payment.id)?.add("SINGLE_CONCENTRATION")); if (totalValue > 0 && concentrationRanking.length >= 2 && (concentrationRanking[0].totalValue + concentrationRanking[1].totalValue) / totalValue >= 0.8) { concentrationRanking[0].payments.forEach((payment) => reasonsByPaymentId.get(payment.id)?.add("DOUBLE_CONCENTRATION")); concentrationRanking[1].payments.forEach((payment) => reasonsByPaymentId.get(payment.id)?.add("DOUBLE_CONCENTRATION")); } let totalSuspiciousCount = 0; let unresolvedSuspiciousCount = 0; let totalValueUnderAnalysis = 0; let batchSeverity: AlertSeverity | null = null; batchPayments.forEach((payment) => { const reasons = Array.from(reasonsByPaymentId.get(payment.id) ?? []); const isSuspicious = payment.status === "PENDING" && reasons.length > 0; const isResolved = isSuspicious && Boolean(reviewedSuspiciousIds[payment.id]); const severity: AlertSeverity | null = isSuspicious ? (reasons.includes("DOUBLE_CONCENTRATION") || reasons.includes("SINGLE_CONCENTRATION") || reasons.length > 1 ? "critical" : "warning") : null; paymentMap[payment.id] = { paymentId: payment.id, batchId: batch.id, reasons, isSuspicious, isResolved, severity }; if (isSuspicious) { totalSuspiciousCount += 1; if (!isResolved) { unresolvedSuspiciousCount += 1; totalValueUnderAnalysis += payment.grossAmount; if (!batchSeverity || severity === "critical") batchSeverity = severity; } } }); batchMap[batch.id] = { batchId: batch.id, totalSuspiciousCount, unresolvedSuspiciousCount, severity: unresolvedSuspiciousCount > 0 ? batchSeverity ?? "warning" : null, totalValueUnderAnalysis }; }); return { paymentMap, batchMap }; }
function buildSuspicionOverview(visibleBatches: VisibleBatch[], analysis: SuspicionAnalysis): SuspicionOverview { const visiblePayments = visibleBatches.flatMap((batch) => batch.payments ?? []); const uniqueBatchesWithSuspicion = new Set<string>(); const reasonCounter = new Map<SuspicionReason, number>(); const topCases: SuspicionOverview["topCases"] = []; let suspiciousPaymentCount = 0; let unresolvedSuspiciousCount = 0; let totalValueUnderAnalysis = 0; visiblePayments.forEach((payment) => { const alert = analysis.paymentMap[payment.id]; const batch = visibleBatches.find((item) => item.id === alert?.batchId); if (!alert?.isSuspicious || !batch || alert.isResolved) return; uniqueBatchesWithSuspicion.add(batch.id); suspiciousPaymentCount += 1; unresolvedSuspiciousCount += 1; totalValueUnderAnalysis += payment.grossAmount; alert.reasons.forEach((reason) => reasonCounter.set(reason, (reasonCounter.get(reason) ?? 0) + 1)); topCases.push({ paymentId: payment.id, beneficiaryName: payment.beneficiaryName, batchNumber: batch.batchNumber, value: payment.grossAmount, reasons: alert.reasons, severity: alert.severity ?? "warning", isResolved: alert.isResolved }); }); topCases.sort((left, right) => { if (left.severity !== right.severity) return left.severity === "critical" ? -1 : 1; return right.value - left.value; }); return { suspiciousBatchCount: uniqueBatchesWithSuspicion.size, suspiciousPaymentCount, unresolvedSuspiciousCount, totalValueUnderAnalysis, topReasons: Array.from(reasonCounter.entries()).sort((left, right) => right[1] - left[1]).slice(0, 3).map(([reason, count]) => ({ reason, count })), topCases: topCases.slice(0, 4) }; }
function formatSuspicionReason(reason: SuspicionReason) { if (reason === "HIGH_VALUE") return "Valor acima de 2x a média do lote"; if (reason === "DUPLICATE_BENEFICIARY") return "Beneficiário repetido no mesmo lote"; if (reason === "SINGLE_CONCENTRATION") return "Beneficiário concentra mais de 40% do lote"; return "Dois beneficiários concentram cerca de 80% do lote"; }
function findPaymentById(batches: PaymentBatch[], batchId: string, paymentId: string) { return batches.find((batch) => batch.id === batchId)?.payments?.find((payment) => payment.id === paymentId); }










