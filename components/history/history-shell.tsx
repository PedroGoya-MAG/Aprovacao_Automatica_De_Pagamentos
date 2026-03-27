"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Eye,
  FileBadge2,
  Layers3,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  X
} from "lucide-react";

import { BenefitBadge } from "@/components/payments/benefit-badge";
import { StatusBadge } from "@/components/payments/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatDocument } from "@/lib/formatters";
import { normalizeText } from "@/lib/utils";
import {
  type HistoricalBatch,
  type HistoricalPayment,
  type HistoryBatchOutcome,
  type HistorySummary,
  type SuspicionReasonCode
} from "@/types/insights";
import { type BenefitType, type PaymentStatus } from "@/types/payments";

type HistoryShellProps = {
  initialBatches: HistoricalBatch[];
  initialSummary: HistorySummary;
  competences: string[];
};

type BenefitFilter = "ALL" | BenefitType;
type StatusFilter = "ALL" | PaymentStatus;
type OutcomeFilter = "ALL" | HistoryBatchOutcome;

type ActivePaymentState = {
  batchId: string;
  paymentId: string;
} | null;

type VisibleHistoricalBatch = HistoricalBatch & {
  visiblePayments: HistoricalPayment[];
  shouldShowBatch: boolean;
};

const paymentStatusOrder: Record<PaymentStatus, number> = {
  REJECTED: 0,
  APPROVED: 1,
  PENDING: 2
};

export function HistoryShell({ initialBatches, initialSummary, competences }: HistoryShellProps) {
  const [selectedCompetence, setSelectedCompetence] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<BenefitFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeFilter>("ALL");
  const [search, setSearch] = useState("");
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(false);
  const [showOnlyRejected, setShowOnlyRejected] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({});
  const [activePayment, setActivePayment] = useState<ActivePaymentState>(null);

  const normalizedSearch = normalizeText(search);

  const visibleBatches = useMemo<VisibleHistoricalBatch[]>(() => {
    return initialBatches
      .filter((batch) => selectedCompetence === "ALL" || batch.competence === selectedCompetence)
      .filter((batch) => selectedType === "ALL" || batch.benefitType === selectedType)
      .filter((batch) => selectedOutcome === "ALL" || batch.batchOutcome === selectedOutcome)
      .map((batch) => {
        const batchMatchesSearch =
          normalizedSearch.length === 0 ||
          normalizeText(batch.batchNumber).includes(normalizedSearch) ||
          normalizeText(batch.id).includes(normalizedSearch);

        const visiblePayments = [...batch.payments]
          .filter((payment) => {
            const matchesStatus = selectedStatus === "ALL" || payment.status === selectedStatus;
            const matchesSearch =
              normalizedSearch.length === 0 ||
              batchMatchesSearch ||
              normalizeText(payment.beneficiaryName).includes(normalizedSearch) ||
              normalizeText(payment.document).includes(normalizedSearch);
            const matchesSuspicious = !showOnlySuspicious || payment.isSuspicious;
            const matchesRejected = !showOnlyRejected || payment.status === "REJECTED";

            return matchesStatus && matchesSearch && matchesSuspicious && matchesRejected;
          })
          .sort((left, right) => {
            const statusDelta = paymentStatusOrder[left.status] - paymentStatusOrder[right.status];
            if (statusDelta !== 0) {
              return statusDelta;
            }
            return left.paymentDate.localeCompare(right.paymentDate);
          });

        return {
          ...batch,
          visiblePayments,
          shouldShowBatch: batchMatchesSearch || visiblePayments.length > 0
        };
      })
      .filter((batch) => batch.shouldShowBatch);
  }, [initialBatches, normalizedSearch, selectedCompetence, selectedOutcome, selectedStatus, selectedType, showOnlyRejected, showOnlySuspicious]);

  const dynamicSummary = useMemo<HistorySummary>(() => {
    const payments = visibleBatches.flatMap((batch) => batch.visiblePayments);

    return {
      processedBatchCount: visibleBatches.length,
      approvedBatchCount: visibleBatches.filter((batch) => batch.batchOutcome === "APPROVED").length,
      rejectedBatchCount: visibleBatches.filter((batch) => batch.batchOutcome === "REJECTED").length,
      mixedBatchCount: visibleBatches.filter((batch) => batch.batchOutcome === "MIXED").length,
      pendingBatchCount: visibleBatches.filter((batch) => batch.batchOutcome === "PENDING").length,
      processedPaymentCount: payments.length,
      approvedPaymentCount: payments.filter((payment) => payment.status === "APPROVED").length,
      rejectedPaymentCount: payments.filter((payment) => payment.status === "REJECTED").length,
      suspiciousPaymentCount: payments.filter((payment) => payment.isSuspicious).length,
      processedTotalAmount: payments.reduce((total, payment) => total + payment.grossAmount, 0),
      totalApprovedAmount: payments.filter((payment) => payment.status === "APPROVED").reduce((total, payment) => total + payment.grossAmount, 0),
      totalRejectedAmount: payments.filter((payment) => payment.status === "REJECTED").reduce((total, payment) => total + payment.grossAmount, 0)
    };
  }, [visibleBatches]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedCompetence !== "ALL" ||
    selectedType !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedOutcome !== "ALL" ||
    showOnlyRejected ||
    showOnlySuspicious;

  const summary = hasActiveFilters ? dynamicSummary : initialSummary;
  const activeBatch = activePayment ? visibleBatches.find((batch) => batch.id === activePayment.batchId) : undefined;
  const currentPayment = activePayment ? activeBatch?.payments.find((payment) => payment.id === activePayment.paymentId) : undefined;

  return (
    <div className="space-y-6">
      <section className="panel px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">Historico geral</p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">Consulta de lotes e pagamentos processados</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Acompanhe o que entrou, foi aprovado, rejeitado ou sinalizado para revisao ao longo do periodo, com leitura executiva por lote e detalhamento completo dos pagamentos processados.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-6">
        <SummaryCard label="Lotes aprovados" value={String(summary.approvedBatchCount)} hint="Processados sem rejeicao" icon={ShieldCheck} tone="success" />
        <SummaryCard label="Lotes mistos" value={String(summary.mixedBatchCount)} hint="Com aprovados e rejeitados" icon={Layers3} tone="warning" />
        <SummaryCard label="Lotes rejeitados" value={String(summary.rejectedBatchCount)} hint="Todos os pagamentos rejeitados" icon={ShieldAlert} tone="danger" />
        <SummaryCard label="Pagamentos suspeitos" value={String(summary.suspiciousPaymentCount)} hint="Itens com alerta no historico" icon={ShieldAlert} tone="warning" />
        <SummaryCard label="Valor aprovado" value={formatCurrency(summary.totalApprovedAmount)} hint="Montante liberado" icon={CircleDollarSign} tone="success" />
        <SummaryCard label="Valor rejeitado" value={formatCurrency(summary.totalRejectedAmount)} hint="Montante recusado" icon={Wallet} tone="danger" />
      </section>

      <section className="panel px-5 py-5 sm:px-6">
        <div className="grid gap-4 xl:grid-cols-[220px_220px_220px_220px_minmax(0,1fr)]">
          <SelectField label="Competencia" value={selectedCompetence} onChange={setSelectedCompetence}>
            <option value="ALL">Todas</option>
            {competences.map((competence) => (
              <option key={competence} value={competence}>
                {competence}
              </option>
            ))}
          </SelectField>

          <SelectField label="Tipo de beneficio" value={selectedType} onChange={(value) => setSelectedType(value as BenefitFilter)}>
            <option value="ALL">Todos</option>
            <option value="SORTEIO">Sorteio</option>
            <option value="RESGATE">Resgate</option>
          </SelectField>

          <SelectField label="Status do pagamento" value={selectedStatus} onChange={(value) => setSelectedStatus(value as StatusFilter)}>
            <option value="ALL">Todos</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Rejeitado</option>
            <option value="PENDING">Pendente</option>
          </SelectField>

          <SelectField label="Perfil do lote" value={selectedOutcome} onChange={(value) => setSelectedOutcome(value as OutcomeFilter)}>
            <option value="ALL">Todos</option>
            <option value="APPROVED">Lote aprovado</option>
            <option value="REJECTED">Lote rejeitado</option>
            <option value="MIXED">Misto</option>
            <option value="PENDING">Pendente</option>
          </SelectField>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-semibold">Busca</span>
            <div className="flex h-11 items-center gap-3 rounded-lg border border-[color:var(--border)] bg-white px-4 focus-within:border-[color:var(--brand)]">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Lote, beneficiario ou documento"
                className="h-full w-full border-0 bg-transparent text-sm outline-none"
              />
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowOnlySuspicious((current) => !current)}
            className={showOnlySuspicious ? "data-chip border-amber-200 bg-amber-50 text-amber-800" : "data-chip"}
          >
            Somente suspeitos
          </button>
          <button
            type="button"
            onClick={() => setShowOnlyRejected((current) => !current)}
            className={showOnlyRejected ? "data-chip border-rose-200 bg-rose-50 text-rose-700" : "data-chip"}
          >
            Rejeitados
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {visibleBatches.length === 0 ? (
          <EmptyState
            title="Nenhum lote encontrado no historico"
            description="Ajuste os filtros para consultar outros periodos, tipos de beneficio ou pagamentos processados."
          />
        ) : (
          visibleBatches.map((batch) => {
            const isExpanded = expandedBatches[batch.id] ?? false;
            const suspiciousCount = batch.payments.filter((payment) => payment.isSuspicious).length;

            return (
              <article key={batch.id} className="panel overflow-hidden border-slate-200 bg-white">
                <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">{batch.batchNumber}</p>
                      <BenefitBadge benefitType={batch.benefitType} />
                      <BatchOutcomeTag batch={batch} />
                      {suspiciousCount > 0 ? <SuspiciousInlineBadge label={`${suspiciousCount} suspeito(s)`} /> : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
                      <BatchInfo label="Competencia" value={batch.competence} />
                      <BatchInfo label="Data prevista" value={formatDate(batch.scheduledAt)} />
                      <BatchInfo label="Processado em" value={formatDate(batch.processedAt.slice(0, 10))} />
                      <BatchInfo label="Pagamentos" value={String(batch.paymentCount)} />
                      <BatchInfo label="Valor total" value={formatCurrency(batch.totalAmount)} />
                      <BatchInfo label="Valor aprovado" value={formatCurrency(batch.approvedAmount)} />
                      <BatchInfo label="Valor rejeitado" value={formatCurrency(batch.rejectedAmount)} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-slate-600">
                      <BatchOutcomeInline batch={batch} />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Button type="button" variant="secondary" onClick={() => setExpandedBatches((current) => ({ ...current, [batch.id]: !current[batch.id] }))}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isExpanded ? "Ocultar pagamentos" : "Ver pagamentos"}
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5 sm:px-6">
                    <div className="overflow-x-auto rounded-xl border border-[color:var(--border)] bg-white">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            <th className="px-4 py-3">Beneficiario</th>
                            <th className="px-4 py-3">Documento</th>
                            <th className="px-4 py-3">Valor</th>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Motivo da rejeicao</th>
                            <th className="px-4 py-3">Alertas</th>
                            <th className="px-4 py-3 text-right">Acao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batch.visiblePayments.map((payment) => (
                            <tr
                              key={payment.id}
                              className={payment.isSuspicious ? "border-t border-[color:var(--border)] bg-amber-50/60" : "border-t border-[color:var(--border)]"}
                            >
                              <td className="px-4 py-4">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-slate-950">{payment.beneficiaryName}</p>
                                  <p className="text-xs text-slate-500">Ref. {payment.reference}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-600">{formatDocument(payment.document)}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-950">{formatCurrency(payment.grossAmount)}</td>
                              <td className="px-4 py-4 text-sm text-slate-600">{formatDate(payment.paymentDate)}</td>
                              <td className="px-4 py-4"><StatusBadge status={payment.status} /></td>
                              <td className="px-4 py-4 text-sm text-slate-600">{getRejectionReason(payment)}</td>
                              <td className="px-4 py-4 text-sm text-slate-600">
                                {payment.isSuspicious ? payment.suspicionReasons.map(formatReasonLabel).join(" • ") : "Sem alerta"}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setActivePayment({ batchId: batch.id, paymentId: payment.id })}>
                                  <Eye className="h-4 w-4" />Detalhes
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </section>

      <HistoryPaymentDrawer batch={activeBatch} payment={currentPayment} onClose={() => setActivePayment(null)} />
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-[color:var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--brand)]"
      >
        {children}
      </select>
    </label>
  );
}

function SummaryCard({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint: string; icon: typeof ShieldAlert | typeof Wallet | typeof ShieldCheck | typeof Layers3 | typeof CircleDollarSign; tone: "default" | "success" | "warning" | "danger" }) {
  const iconTone = tone === "success" ? "bg-emerald-50 text-emerald-700" : tone === "warning" ? "bg-amber-50 text-amber-800" : tone === "danger" ? "bg-rose-50 text-rose-700" : "bg-[color:var(--brand-soft)] text-[color:var(--brand-deep)]";
  return (
    <div className="sub-panel px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{value}</p>
          <p className="text-sm text-slate-600">{hint}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconTone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function BatchInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function BatchOutcomeTag({ batch }: { batch: HistoricalBatch }) {
  if (batch.batchOutcome === "APPROVED") {
    return <OutcomeChip tone="success">Lote aprovado</OutcomeChip>;
  }

  if (batch.batchOutcome === "REJECTED") {
    return <OutcomeChip tone="danger">Lote rejeitado</OutcomeChip>;
  }

  if (batch.batchOutcome === "PENDING") {
    return <OutcomeChip tone="warning">Lote pendente</OutcomeChip>;
  }

  return <OutcomeChip tone="mixed">Processamento misto</OutcomeChip>;
}

function BatchOutcomeInline({ batch }: { batch: HistoricalBatch }) {
  const parts: string[] = [];

  if (batch.batchOutcome === "APPROVED") {
    parts.push("Lote aprovado");
  } else if (batch.batchOutcome === "REJECTED") {
    parts.push("Lote rejeitado");
  } else {
    if (batch.rejectedCount > 0) {
      parts.push(`${batch.rejectedCount} pagamento(s) rejeitado(s)`);
    }
    if (batch.approvedCount > 0) {
      parts.push(`${batch.approvedCount} pagamento(s) aprovado(s)`);
    }
    if (batch.pendingCount > 0) {
      parts.push(`${batch.pendingCount} pendente(s)`);
    }
  }

  return (
    <>
      {parts.map((part) => (
        <span key={part} className="data-chip">
          {part}
        </span>
      ))}
    </>
  );
}

function OutcomeChip({ children, tone }: { children: React.ReactNode; tone: "success" | "danger" | "warning" | "mixed" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-sky-200 bg-sky-50 text-sky-800";

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${toneClass}`}>{children}</span>;
}

function SuspiciousInlineBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
      {label}
    </span>
  );
}

function HistoryPaymentDrawer({ batch, payment, onClose }: { batch?: VisibleHistoricalBatch; payment?: HistoricalPayment; onClose: () => void }) {
  if (!batch || !payment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fechar detalhes" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[640px] flex-col border-l border-[color:var(--border)] bg-white shadow-sm">
        <div className="border-b border-[color:var(--border)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--brand)]">Detalhes do historico</p>
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{payment.beneficiaryName}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={payment.status} />
                <BenefitBadge benefitType={payment.benefitType} />
                {payment.isSuspicious ? <SuspiciousInlineBadge label="Suspeito" /> : null}
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <DetailGridItem icon={FileBadge2} label="Documento" value={formatDocument(payment.document)} />
          <DetailGridItem icon={Wallet} label="Valor bruto" value={formatCurrency(payment.grossAmount)} />
          <DetailGridItem icon={ShieldAlert} label="Lote" value={batch.batchNumber} />
          <DetailGridItem icon={ShieldAlert} label="Competencia" value={batch.competence} />
          <DetailGridItem icon={CalendarClock} label="Data do pagamento" value={formatDate(payment.paymentDate)} />
          <DetailGridItem icon={CalendarClock} label="Processado em" value={formatDate(payment.processedAt.slice(0, 10))} />

          <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Motivo da rejeicao</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{getRejectionReason(payment)}</p>
          </section>

          <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Observacoes</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{payment.observations ?? "Sem observacoes adicionais registradas para este pagamento no historico."}</p>
          </section>

          <section className="rounded-xl border border-[color:var(--border)] bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sinais identificados</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {payment.isSuspicious ? payment.suspicionReasons.map(formatReasonLabel).join(" • ") : "Pagamento sem sinais de alerta no periodo consultado."}
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}

function DetailGridItem({ icon: Icon, label, value }: { icon: typeof ShieldAlert | typeof Wallet | typeof FileBadge2 | typeof CalendarClock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--brand-soft)]">
          <Icon className="h-5 w-5 text-[color:var(--brand-deep)]" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getRejectionReason(payment: HistoricalPayment) {
  if (payment.status !== "REJECTED") {
    return "-";
  }

  return payment.observations?.trim() || "Motivo nao informado no historico.";
}

function formatReasonLabel(reason: SuspicionReasonCode) {
  if (reason === "HIGH_VALUE") {
    return "Valor acima de 2x a media";
  }

  if (reason === "DUPLICATE_BENEFICIARY") {
    return "Beneficiario repetido no mesmo lote";
  }

  if (reason === "SINGLE_CONCENTRATION") {
    return "Mais de 40% do lote em um beneficiario";
  }

  return "Dois beneficiarios concentram a maior parte do lote";
}
