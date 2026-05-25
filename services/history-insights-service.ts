import { cache } from "react";

import {
  getAvailableHistoryCompetences,
  getAvailableMonthlyKeys,
  getHistoricalBatchesDemo,
  getHistorySummaryDemo,
  getMonthlyOverviewDemo
} from "@/lib/history-monthly-demo-data";
import { n8nGet } from "@/lib/n8n-api";
import { isDemoMode } from "@/lib/runtime-mode";
import {
  type MonthlySeries,
  type MonthlyTotals,
  type HistoricalBatch,
  type HistoryBatchOutcome,
  type HistoricalBatchStatus,
  type HistoryProcessingType,
  type HistorySummary
} from "@/types/insights";
import { type BenefitType } from "@/types/payments";

export async function getHistoricalBatches() {
  return getHistoricalBatchesDemo();
}

export async function getHistoricalSummary() {
  return getHistorySummaryDemo();
}

export async function getMonthlyOverview(month: string) {
  return getMonthlyOverviewDemo(month);
}

export async function getHistoryCompetences() {
  return getAvailableHistoryCompetences();
}

export async function getMonthlyOptions() {
  if (isDemoMode()) {
    return sortMonthlyOptions(getAvailableMonthlyKeys());
  }

  const rawData = await n8nGet<unknown>("monthly", "months");

  if (!Array.isArray(rawData)) {
    return [];
  }

  return sortMonthlyOptions(
    rawData.map((option, index) => normalizeMonthlyOption(option, index))
  );
}

export async function getMonthlySummaryForView(month: string, benefitType: "ALL" | BenefitType = "ALL"): Promise<MonthlyTotals> {
  if (isDemoMode()) {
    return buildMonthlySummaryFromBatches(
      getHistoricalBatchesDemo()
        .filter((batch) => batch.scheduledAt.slice(0, 7) === month)
        .filter((batch) => benefitType === "ALL" || batch.benefitType === benefitType),
      month
    );
  }

  const rawData = await n8nGet<unknown>("monthly", "summary", {
    month,
    ...(benefitType !== "ALL" ? { benefitType: benefitType === "SORTEIO" ? "Sorteio" : "Resgate" } : {})
  });

  return normalizeMonthlySummary(rawData, month);
}

export async function getMonthlySeriesForView(month: string, benefitType: "ALL" | BenefitType = "ALL"): Promise<MonthlySeries> {
  if (isDemoMode()) {
    return buildMonthlySeriesFromBatches(
      getHistoricalBatchesDemo()
        .filter((batch) => batch.scheduledAt.slice(0, 7) === month)
        .filter((batch) => benefitType === "ALL" || batch.benefitType === benefitType)
    );
  }

  const rawData = await n8nGet<unknown>("monthly", "series", {
    month,
    ...(benefitType !== "ALL" ? { benefitType: benefitType === "SORTEIO" ? "Sorteio" : "Resgate" } : {})
  });

  return normalizeMonthlySeries(rawData);
}

const getHistoricalBatchesForHistoryData = cache(async () => {
  if (isDemoMode()) {
    return getHistoricalBatchesDemo();
  }

  const rawData = await n8nGet<unknown>("history", "batches", {
    onlySuspicious: false
  });

  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.map((batch, index) => normalizeHistoricalBatch(batch, index));
});

export async function getHistoricalBatchesForHistory() {
  return getHistoricalBatchesForHistoryData();
}

export async function getHistoricalSummaryForHistory() {
  if (isDemoMode()) {
    return getHistorySummaryDemo();
  }

  const rawData = await n8nGet<unknown>("history", "summary", {
    onlySuspicious: false
  });

  return normalizeHistorySummary(rawData);
}

export async function getHistoryCompetencesForHistory() {
  if (isDemoMode()) {
    return getAvailableHistoryCompetences();
  }

  const batches = await getHistoricalBatchesForHistoryData();
  return Array.from(new Set(batches.map((batch) => batch.competence)));
}

function normalizeHistoricalBatch(rawData: unknown, index: number): HistoricalBatch {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};
  const id = pickText(payload.id, `history-batch-${index + 1}`);
  const batchNumber = pickText(payload.batchNumber, id);
  const scheduledAt = pickText(payload.scheduledAt, "");
  const competence = pickText(payload.competence, "-");

  return {
    id,
    batchNumber,
    benefitType: payload.benefitType === "SORTEIO" ? "SORTEIO" : "RESGATE",
    competence,
    scheduledAt,
    status: normalizeBatchStatus(payload.status),
    batchOutcome: normalizeBatchOutcome(payload.status),
    paymentCount: Number(payload.paymentCount ?? 0),
    totalAmount: Number(payload.totalAmount ?? 0),
    approvedCount: Number(payload.approvedCount ?? 0),
    rejectedCount: Number(payload.rejectedCount ?? 0),
    pendingCount: Number(payload.pendingCount ?? 0),
    approvedAmount: Number(payload.approvedAmount ?? 0),
    rejectedAmount: Number(payload.rejectedAmount ?? 0),
    payments: [],
    processedAt: pickText(payload.processedAt, scheduledAt),
    hasSuspiciousPayments: Boolean(payload.hasSuspiciousPayments),
    processingType: normalizeProcessingType(payload.processingType),
    processingSummary: normalizeProcessingSummary(payload.processingSummary)
  };
}

function normalizeBatchStatus(value: unknown): HistoricalBatchStatus {
  if (value === "APPROVED") {
    return "APPROVED";
  }

  if (value === "REJECTED") {
    return "REJECTED";
  }

  if (value === "PARTIALLY_APPROVED") {
    return "PARTIALLY_APPROVED";
  }

  return "PENDING";
}

function normalizeBatchOutcome(value: unknown): HistoryBatchOutcome {
  if (value === "APPROVED") {
    return "APPROVED";
  }

  if (value === "REJECTED") {
    return "REJECTED";
  }

  if (value === "PARTIALLY_APPROVED") {
    return "MIXED";
  }

  return "PENDING";
}

function normalizeProcessingType(value: unknown): HistoryProcessingType {
  if (value === "MANUAL") {
    return "MANUAL";
  }

  if (value === "AUTOMATICA") {
    return "AUTOMATICA";
  }

  return "MIXED";
}

function normalizeProcessingSummary(value: unknown) {
  const payload = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    manualCount: Number(payload.manualCount ?? 0),
    automaticCount: Number(payload.automaticCount ?? 0),
    manualAmount: Number(payload.manualAmount ?? 0),
    automaticAmount: Number(payload.automaticAmount ?? 0)
  };
}

function buildHistorySummaryFromBatches(batches: HistoricalBatch[]): HistorySummary {
  return {
    processedBatchCount: batches.length,
    approvedBatchCount: batches.filter((batch) => batch.batchOutcome === "APPROVED").length,
    rejectedBatchCount: batches.filter((batch) => batch.batchOutcome === "REJECTED").length,
    mixedBatchCount: batches.filter((batch) => batch.batchOutcome === "MIXED").length,
    pendingBatchCount: batches.filter((batch) => batch.batchOutcome === "PENDING").length,
    processedPaymentCount: batches.reduce((total, batch) => total + batch.paymentCount, 0),
    approvedPaymentCount: batches.reduce((total, batch) => total + batch.approvedCount, 0),
    rejectedPaymentCount: batches.reduce((total, batch) => total + batch.rejectedCount, 0),
    pendingPaymentCount: batches.reduce((total, batch) => total + batch.pendingCount, 0),
    suspiciousPaymentCount: 0,
    processedTotalAmount: batches.reduce((total, batch) => total + batch.totalAmount, 0),
    totalApprovedAmount: batches.reduce((total, batch) => total + batch.approvedAmount, 0),
    totalRejectedAmount: batches.reduce((total, batch) => total + batch.rejectedAmount, 0)
  };
}

function normalizeHistorySummary(rawData: unknown): HistorySummary {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};

  return {
    processedBatchCount: Number(payload.processedBatchCount ?? 0),
    approvedBatchCount: Number(payload.approvedBatchCount ?? 0),
    rejectedBatchCount: Number(payload.rejectedBatchCount ?? 0),
    mixedBatchCount: Number(payload.mixedBatchCount ?? 0),
    pendingBatchCount: Number(payload.pendingBatchCount ?? 0),
    processedPaymentCount: Number(payload.processedPaymentCount ?? 0),
    approvedPaymentCount: Number(payload.approvedPaymentCount ?? 0),
    rejectedPaymentCount: Number(payload.rejectedPaymentCount ?? 0),
    pendingPaymentCount: Number(payload.pendingPaymentCount ?? 0),
    suspiciousPaymentCount: Number(payload.suspiciousPaymentCount ?? 0),
    processedTotalAmount: Number(payload.processedTotalAmount ?? 0),
    totalApprovedAmount: Number(payload.totalApprovedAmount ?? 0),
    totalRejectedAmount: Number(payload.totalRejectedAmount ?? 0)
  };
}

function normalizeMonthlySummary(rawData: unknown, month: string): MonthlyTotals {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};

  return {
    month: pickText(payload.month, month),
    monthLabel: pickText(payload.monthLabel, month),
    totalReceivedAmount: Number(payload.totalReceivedAmount ?? 0),
    totalReceivedCount: Number(payload.totalReceivedCount ?? 0),
    totalApprovedAmount: Number(payload.totalApprovedAmount ?? 0),
    totalApprovedCount: Number(payload.totalApprovedCount ?? 0),
    totalRejectedAmount: Number(payload.totalRejectedAmount ?? 0),
    totalRejectedCount: Number(payload.totalRejectedCount ?? 0),
    totalSuspiciousAmount: Number(payload.totalSuspiciousAmount ?? 0),
    totalSuspiciousCount: Number(payload.totalSuspiciousCount ?? 0)
  };
}

function buildMonthlySummaryFromBatches(batches: HistoricalBatch[], month: string): MonthlyTotals {
  const payments = batches.flatMap((batch) => batch.payments);

  return {
    month,
    monthLabel: getAvailableMonthlyKeys().find((option) => option.value === month)?.label ?? month,
    totalReceivedAmount: payments.reduce((total, payment) => total + payment.grossAmount, 0),
    totalReceivedCount: payments.length,
    totalApprovedAmount: payments
      .filter((payment) => payment.status === "APPROVED")
      .reduce((total, payment) => total + payment.grossAmount, 0),
    totalApprovedCount: payments.filter((payment) => payment.status === "APPROVED").length,
    totalRejectedAmount: payments
      .filter((payment) => payment.status === "REJECTED")
      .reduce((total, payment) => total + payment.grossAmount, 0),
    totalRejectedCount: payments.filter((payment) => payment.status === "REJECTED").length,
    totalSuspiciousAmount: payments
      .filter((payment) => payment.isSuspicious)
      .reduce((total, payment) => total + payment.grossAmount, 0),
    totalSuspiciousCount: payments.filter((payment) => payment.isSuspicious).length
  };
}

function normalizeMonthlySeries(rawData: unknown): MonthlySeries {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};

  return {
    dailySeries: normalizeSeriesPoints(payload.dailySeries),
    weeklySeries: normalizeSeriesPoints(payload.weeklySeries)
  };
}

function normalizeSeriesPoints(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((point) => {
    const payload = typeof point === "object" && point !== null ? (point as Record<string, unknown>) : {};

    return {
      label: pickText(payload.label, "-"),
      count: Number(payload.count ?? 0),
      amount: Number(payload.amount ?? 0)
    };
  });
}

function buildMonthlySeriesFromBatches(batches: HistoricalBatch[]): MonthlySeries {
  const payments = batches.flatMap((batch) => batch.payments);

  return {
    dailySeries: aggregateMonthlySeries(
      payments,
      (payment) => payment.paymentDate,
      (value) => {
        const [, month, day] = value.split("-");
        return `${day}/${month}`;
      }
    ),
    weeklySeries: aggregateMonthlySeries(
      payments,
      (payment) => {
        const date = new Date(`${payment.paymentDate}T12:00:00`);
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const weekIndex = Math.floor((date.getDate() + firstDay.getDay() - 1) / 7) + 1;
        return `${date.getFullYear()}-${date.getMonth() + 1}-S${weekIndex}`;
      },
      (value) => `Semana ${value.split("S")[1]}`
    )
  };
}

function normalizeMonthlyOption(rawData: unknown, index: number) {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};
  const value = pickText(payload.value, `month-${index + 1}`);

  return {
    value,
    label: pickText(payload.label, value)
  };
}

function sortMonthlyOptions(options: Array<{ value: string; label: string }>) {
  return [...options].sort((left, right) => left.value.localeCompare(right.value));
}

function aggregateMonthlySeries(
  payments: HistoricalBatch["payments"],
  getKey: (payment: HistoricalBatch["payments"][number]) => string,
  getLabel: (key: string) => string
) {
  const aggregated = new Map<string, { label: string; count: number; amount: number }>();

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

function pickText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}
