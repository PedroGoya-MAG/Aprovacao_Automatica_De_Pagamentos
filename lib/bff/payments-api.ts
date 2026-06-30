import "server-only";

import { normalizeDateValue } from "@/lib/formatters";
import { bffGet, bffPost } from "@/lib/bff/http-client";
import { type BackendParams, type BffAuthContext } from "@/lib/bff/types";
import { type BenefitType, type Lote, type Payment, type PaymentStatus, type ResumoDashboard } from "@/types/payments";

export type DashboardSummaryFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
  search?: string;
};

export type BatchesFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
};

export type ApproveBatchResponse = {
  loteId: string;
  status: "APPROVED";
  approvedPaymentIds: string[];
};

export type ApproveSelectedResponse = {
  loteId: string;
  approvedPaymentIds: string[];
  status: "PARTIALLY_APPROVED" | "APPROVED";
};

export type ApprovePaymentResponse = {
  id: string;
  status: "APPROVED";
};

export type RejectPaymentResponse = {
  id: string;
  status: "REJECTED";
};

export async function getDashboardSummary(context: BffAuthContext, filters: DashboardSummaryFilters = {}) {
  return bffGet<ResumoDashboard>("approvals", "summary", context, buildSummaryParams(filters));
}

export async function getBatches(context: BffAuthContext, filters: BatchesFilters = {}) {
  const data = await bffGet<unknown>("approvals", "batches", context, buildBatchesParams(filters));

  if (!Array.isArray(data)) {
    return [];
  }

  return filterOperationalBatches(
    data.map((batch) => normalizeBatch(batch)).filter((batch): batch is Lote => Boolean(batch)),
    filters
  );
}

export async function getBatchDetail(context: BffAuthContext, batchId: string) {
  const batches = await getBatches(context, {});
  return batches.find((batch) => batch.id === batchId || batch.batchNumber === batchId) ?? null;
}

export async function getBatchPayments(context: BffAuthContext, batchId: string) {
  const rawData = await bffGet<unknown>("approvals", "batch-payments", context, { loteId: batchId });
  return normalizePayments(rawData, batchId);
}

export async function getPaymentDetail(context: BffAuthContext, paymentId: string) {
  const rawData = await bffGet<unknown>("approvals", "payment-detail", context, { pagamentoId: paymentId });
  return normalizePayment(rawData, paymentId);
}

export async function approvePayment(context: BffAuthContext, paymentId: string) {
  const rawData = await bffPost<unknown>("approvals", "approve-payment", context, {
    pagamentoId: paymentId,
    userId: context.user.id,
    userEmail: context.user.email
  });

  return normalizeApprovePaymentResponse(rawData, paymentId);
}

export async function approveSelectedPayments(context: BffAuthContext, batchId: string, paymentIds: string[]) {
  const rawData = await bffPost<unknown>("approvals", "approve-selected", context, {
    loteId: batchId,
    paymentIds,
    userId: context.user.id,
    userEmail: context.user.email
  });

  return normalizeApproveSelectedResponse(rawData, batchId);
}

export async function approveBatch(context: BffAuthContext, batchId: string) {
  const rawData = await bffPost<unknown>("approvals", "approve-batch", context, {
    loteId: batchId,
    userId: context.user.id,
    userEmail: context.user.email
  });

  return normalizeApproveBatchResponse(rawData, batchId);
}

export async function rejectPayment(context: BffAuthContext, paymentId: string, reason?: string) {
  const rawData = await bffPost<unknown>("approvals", "reject-payment", context, {
    pagamentoId: paymentId,
    motivo: reason,
    userId: context.user.id,
    userEmail: context.user.email
  });

  return normalizeRejectResponse(rawData, paymentId);
}

function buildSummaryParams(filters: DashboardSummaryFilters = {}): BackendParams {
  return {
    ...buildBatchesParams(filters),
    search: filters.search?.trim()
  };
}

function buildBatchesParams(filters: BatchesFilters = {}): BackendParams {
  const params: Record<string, string> = {};

  if (filters.benefitType && filters.benefitType !== "ALL") {
    params.benefitType = filters.benefitType === "SORTEIO" ? "Sorteio" : "Resgate";
  }

  if (filters.status && filters.status !== "ALL") {
    params.status = {
      PENDING: "PENDENTE",
      APPROVED: "APROVADO",
      REJECTED: "REJEITADO"
    }[filters.status];
  }

  return params;
}

function normalizeBatch(rawData: unknown): Lote | null {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};
  const id = pickText(payload.id);

  if (!id) return null;

  const batchNumber = pickText(payload.batchNumber, id) ?? id;

  return {
    id,
    batchNumber,
    benefitType: payload.benefitType === "SORTEIO" ? "SORTEIO" : "RESGATE",
    competence: pickText(payload.competence, "-") ?? "-",
    scheduledAt: firstDate("batch.scheduledAt", payload.scheduledAt, payload.dataPagamento, payload.datePayment, payload.dueDate, payload.dataLiberacao),
    status: normalizeBatchStatus(payload.status),
    paymentCount: Number(payload.paymentCount ?? 0),
    totalAmount: Number(payload.totalAmount ?? 0),
    approvedCount: Number(payload.approvedCount ?? 0),
    rejectedCount: Number(payload.rejectedCount ?? 0),
    pendingCount: Number(payload.pendingCount ?? 0),
    payments: Array.isArray(payload.payments) ? payload.payments : []
  };
}

function normalizePayments(rawData: unknown, batchId: string): Payment[] {
  if (!Array.isArray(rawData)) return [];

  const seen = new Set<string>();

  return rawData
    .filter((item): item is Record<string, unknown> => isNonEmptyObject(item))
    .map((item) => normalizePayment({ ...item, loteId: item.loteId ?? batchId }, pickText(item.id, "") ?? ""))
    .filter((payment): payment is Payment => Boolean(payment))
    .filter((payment) => {
      const dedupeKey = `${payment.id}-${payment.reference}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
}

function normalizePayment(rawData: unknown, paymentId: string): Payment | null {
  if (!isNonEmptyObject(rawData)) return null;

  const id = pickText(rawData.id, paymentId);
  if (!id) return null;

  return {
    id,
    loteId: pickText(rawData.loteId),
    beneficiaryName: pickText(rawData.beneficiaryName, "Beneficiario nao informado") ?? "Beneficiario nao informado",
    document: pickText(rawData.document, "-") ?? "-",
    grossAmount: Number(rawData.grossAmount ?? 0),
    paymentDate: firstDate("payment.paymentDate", rawData.paymentDate, rawData.dataPagamento, rawData.datePayment, rawData.dueDate),
    benefitType: rawData.benefitType === "SORTEIO" ? "SORTEIO" : rawData.benefitType === "RESGATE" ? "RESGATE" : undefined,
    status: normalizePaymentStatus(rawData.status),
    reference: pickText(rawData.reference, id) ?? id,
    observations: pickText(rawData.observations)
  };
}

function normalizeApprovePaymentResponse(rawData: unknown, paymentId: string): ApprovePaymentResponse | null {
  if (!isNonEmptyObject(rawData) || rawData.status !== "APPROVED") return null;
  return { id: String(rawData.id ?? paymentId), status: "APPROVED" };
}

function normalizeApproveSelectedResponse(rawData: unknown, batchId: string): ApproveSelectedResponse | null {
  if (!isNonEmptyObject(rawData)) return null;

  const approvedPaymentIds = Array.isArray(rawData.approvedPaymentIds)
    ? rawData.approvedPaymentIds.map((value) => String(value))
    : rawData.approvedPaymentId !== undefined && rawData.approvedPaymentId !== null
      ? [String(rawData.approvedPaymentId)]
      : [];

  if (approvedPaymentIds.length === 0) return null;

  return {
    loteId: String(rawData.loteId ?? batchId),
    approvedPaymentIds,
    status: rawData.status === "APPROVED" ? "APPROVED" : "PARTIALLY_APPROVED"
  };
}

function normalizeApproveBatchResponse(rawData: unknown, batchId: string): ApproveBatchResponse | null {
  if (!isNonEmptyObject(rawData) || rawData.status !== "APPROVED") return null;

  return {
    loteId: String(rawData.loteId ?? batchId),
    status: "APPROVED",
    approvedPaymentIds: Array.isArray(rawData.approvedPaymentIds)
      ? rawData.approvedPaymentIds.map((value) => String(value))
      : []
  };
}

function normalizeRejectResponse(rawData: unknown, paymentId: string): RejectPaymentResponse | null {
  if (!isNonEmptyObject(rawData) || rawData.status !== "REJECTED") return null;
  return { id: String(rawData.id ?? paymentId), status: "REJECTED" };
}

function firstDate(fieldName: string, ...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeDateValue(value as string | number | Date | null | undefined, fieldName);
    if (normalized) return normalized;
  }
  return null;
}

function normalizeBatchStatus(value: unknown): Lote["status"] {
  if (value === "APPROVED") return "APPROVED";
  if (value === "REJECTED") return "REJECTED";
  if (value === "PARTIALLY_APPROVED") return "PARTIALLY_APPROVED";
  return "PENDING";
}

function normalizePaymentStatus(value: unknown): Payment["status"] {
  if (value === "APPROVED") return "APPROVED";
  if (value === "REJECTED") return "REJECTED";
  return "PENDING";
}

function pickText(value: unknown, fallback?: string) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    const firstValid = value.find((item) => (typeof item === "string" && item.trim()) || typeof item === "number");
    if (typeof firstValid === "string") return firstValid.trim();
    if (typeof firstValid === "number") return String(firstValid);
  }

  return fallback;
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.keys(value).length > 0;
}

function filterOperationalBatches(batches: Lote[], filters: BatchesFilters) {
  if (filters.status !== "PENDING") return batches;

  return batches.filter((batch) => {
    if ((batch.pendingCount ?? 0) > 0) return true;
    if ((batch.payments ?? []).some((payment) => payment.status === "PENDING")) return true;
    return batch.status === "PENDING" || batch.status === "PARTIALLY_APPROVED";
  });
}
