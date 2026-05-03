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
  type HistoricalBatch,
  type HistoryBatchOutcome,
  type HistoricalBatchStatus,
  type HistoryProcessingType,
  type HistorySummary
} from "@/types/insights";

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
  return getAvailableMonthlyKeys();
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

function pickText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}
