"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, CircleCheckBig, Clock3, TrendingUp, Wallet } from "lucide-react";

import { BenefitBadge } from "@/components/payments/benefit-badge";
import { formatCurrency } from "@/lib/formatters";
import { type HistoricalBatch, type HistoricalPayment, type MonthlySeriesPoint, type SuspicionReasonCode } from "@/types/insights";
import { type BenefitType } from "@/types/payments";

type MonthlyShellProps = {
  batches: HistoricalBatch[];
  monthOptions: Array<{ value: string; label: string }>;
};

type BenefitFilter = "ALL" | BenefitType;

export function MonthlyShell({ batches, monthOptions }: MonthlyShellProps) {
  const [selectedMonth, setSelectedMonth] = useState(monthOptions.at(-1)?.value ?? "");
  const [selectedType, setSelectedType] = useState<BenefitFilter>("ALL");

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => batch.scheduledAt.slice(0, 7) === selectedMonth).filter((batch) => selectedType === "ALL" || batch.benefitType === selectedType);
  }, [batches, selectedMonth, selectedType]);

  const payments = filteredBatches.flatMap((batch) => batch.payments);
  const reasons = buildReasonBreakdown(payments);
  const dailySeries = buildDailySeries(payments);
  const weeklySeries = buildWeeklySeries(payments);
  const topSuspiciousPayments = payments.filter((payment) => payment.isSuspicious).sort((left, right) => right.grossAmount - left.grossAmount).slice(0, 4);

  const totals = {
    receivedAmount: payments.reduce((total, payment) => total + payment.grossAmount, 0),
    receivedCount: payments.length,
    approvedAmount: payments.filter((payment) => payment.status === "APPROVED").reduce((total, payment) => total + payment.grossAmount, 0),
    approvedCount: payments.filter((payment) => payment.status === "APPROVED").length,
    rejectedAmount: payments.filter((payment) => payment.status === "REJECTED").reduce((total, payment) => total + payment.grossAmount, 0),
    rejectedCount: payments.filter((payment) => payment.status === "REJECTED").length,
    suspiciousAmount: payments.filter((payment) => payment.isSuspicious).reduce((total, payment) => total + payment.grossAmount, 0),
    suspiciousCount: payments.filter((payment) => payment.isSuspicious).length
  };

  return (
    <div className="space-y-6">
      <section className="panel px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">Visao mensal</p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">Leitura gerencial e analitica do periodo</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Analise rapidamente o comportamento do mes, os volumes recebidos e os principais sinais de atencao que passaram pela aprovacao operacional.
          </p>
        </div>
      </section>

      <section className="panel px-5 py-5 sm:px-6">
        <div className="grid gap-4 md:grid-cols-[260px_220px] xl:grid-cols-[260px_220px_minmax(0,1fr)]">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-semibold">Mes de analise</span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="h-11 w-full rounded-lg border border-[color:var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--brand)]"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-semibold">Tipo de beneficio</span>
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value as BenefitFilter)}
              className="h-11 w-full rounded-lg border border-[color:var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[color:var(--brand)]"
            >
              <option value="ALL">Todos</option>
              <option value="SORTEIO">Sorteio</option>
              <option value="RESGATE">Resgate</option>
            </select>
          </label>

          <div className="sub-panel flex items-center gap-4 px-4 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--brand-soft)]">
              <CalendarRange className="h-5 w-5 text-[color:var(--brand-deep)]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recorte ativo</p>
              <p className="text-sm font-semibold text-slate-900">{monthOptions.find((option) => option.value === selectedMonth)?.label ?? selectedMonth}</p>
              <p className="text-xs text-slate-500">{selectedType === "ALL" ? "Todos os beneficios" : `Somente ${selectedType === "SORTEIO" ? "Sorteio" : "Resgate"}`}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Total recebido" value={formatCurrency(totals.receivedAmount)} meta={`${totals.receivedCount} pagamento(s)`} icon={Wallet} />
        <MetricCard label="Total aprovado" value={formatCurrency(totals.approvedAmount)} meta={`${totals.approvedCount} pagamento(s)`} icon={CircleCheckBig} tone="success" />
        <MetricCard label="Total rejeitado" value={formatCurrency(totals.rejectedAmount)} meta={`${totals.rejectedCount} pagamento(s)`} icon={AlertTriangle} tone="danger" />
        <MetricCard label="Total suspeito" value={formatCurrency(totals.suspiciousAmount)} meta={`${totals.suspiciousCount} pagamento(s)`} icon={Clock3} tone="warning" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="panel px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">Motivos de suspeita</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">Principais razoes do mes</h3>
            </div>
            {selectedType !== "ALL" ? <BenefitBadge benefitType={selectedType} /> : null}
          </div>

          <div className="mt-5 space-y-3">
            {reasons.length === 0 ? (
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-5 text-sm text-slate-600">
                Nenhum alerta suspeito encontrado neste recorte.
              </div>
            ) : (
              reasons.map((reason) => {
                const percent = totals.suspiciousCount > 0 ? Math.max((reason.count / totals.suspiciousCount) * 100, 8) : 0;

                return (
                  <div key={reason.reason} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatReasonLabel(reason.reason)}</p>
                        <p className="text-xs text-slate-500">{reason.count} pagamento(s) • {formatCurrency(reason.amount)}</p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-[color:var(--brand)]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="panel px-5 py-5 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">Pagamentos em foco</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Maiores valores suspeitos do periodo</h3>
          <div className="mt-5 space-y-3">
            {topSuspiciousPayments.length === 0 ? (
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-5 text-sm text-slate-600">
                Nao houve pagamentos suspeitos neste recorte.
              </div>
            ) : (
              topSuspiciousPayments.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{payment.beneficiaryName}</p>
                      <p className="text-xs text-slate-500">Lote {payment.batchNumber} • {formatReasonLabel(payment.suspicionReasons[0])}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-950">{formatCurrency(payment.grossAmount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SeriesPanel
          title="Evolucao por dia"
          subtitle="Quantidade de pagamentos recebidos por dia no mes"
          points={dailySeries}
          emptyMessage="Sem movimentos diarios para o recorte selecionado."
        />
        <SeriesPanel
          title="Evolucao por semana"
          subtitle="Quantidade de pagamentos recebidos por semana no mes"
          points={weeklySeries}
          emptyMessage="Sem movimentos semanais para o recorte selecionado."
        />
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  meta,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof Wallet;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "bg-[color:var(--brand-soft)] text-[color:var(--brand-deep)]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700"
  };

  return (
    <div className="sub-panel px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{value}</p>
          <p className="text-sm text-slate-600">{meta}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SeriesPanel({
  title,
  subtitle,
  points,
  emptyMessage
}: {
  title: string;
  subtitle: string;
  points: MonthlySeriesPoint[];
  emptyMessage: string;
}) {
  const maxCount = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="panel px-5 py-5 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">{title}</p>
      <h3 className="mt-1 text-xl font-semibold text-slate-950">{subtitle}</h3>

      <div className="mt-5 space-y-4">
        {points.length === 0 ? (
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-5 text-sm text-slate-600">
            {emptyMessage}
          </div>
        ) : (
          points.map((point) => {
            const width = Math.max((point.count / maxCount) * 100, 10);

            return (
              <div key={point.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{point.label}</span>
                  <span className="font-semibold text-slate-900">{point.count} pagamento(s)</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200">
                  <div className="flex h-3 items-center rounded-full bg-[color:var(--brand)]" style={{ width: `${width}%` }} />
                </div>
                <p className="text-xs text-slate-500">Volume financeiro: {formatCurrency(point.amount)}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function buildReasonBreakdown(payments: HistoricalPayment[]) {
  const reasonMap = new Map<SuspicionReasonCode, { reason: SuspicionReasonCode; count: number; amount: number }>();

  payments.forEach((payment) => {
    payment.suspicionReasons.forEach((reason) => {
      const current = reasonMap.get(reason) ?? { reason, count: 0, amount: 0 };
      current.count += 1;
      current.amount += payment.grossAmount;
      reasonMap.set(reason, current);
    });
  });

  return Array.from(reasonMap.values()).sort((left, right) => right.count - left.count);
}

function buildDailySeries(payments: HistoricalPayment[]) {
  return aggregateSeries(payments, (payment) => payment.paymentDate, (value) => {
    const [, month, day] = value.split("-");
    return `${day}/${month}`;
  });
}

function buildWeeklySeries(payments: HistoricalPayment[]) {
  return aggregateSeries(
    payments,
    (payment) => {
      const date = new Date(`${payment.paymentDate}T12:00:00`);
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const weekIndex = Math.floor((date.getDate() + firstDay.getDay() - 1) / 7) + 1;
      return `${date.getFullYear()}-${date.getMonth() + 1}-S${weekIndex}`;
    },
    (value) => `Semana ${value.split("S")[1]}`
  );
}

function aggregateSeries(
  payments: HistoricalPayment[],
  getKey: (payment: HistoricalPayment) => string,
  getLabel: (key: string) => string
) {
  const aggregated = new Map<string, MonthlySeriesPoint>();

  payments.forEach((payment) => {
    const key = getKey(payment);
    const current = aggregated.get(key) ?? { label: getLabel(key), count: 0, amount: 0 };
    current.count += 1;
    current.amount += payment.grossAmount;
    aggregated.set(key, current);
  });

  return Array.from(aggregated.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([, point]) => point);
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
