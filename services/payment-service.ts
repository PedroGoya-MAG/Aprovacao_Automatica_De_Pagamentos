import { getDemoLotes } from "@/lib/demo-data";
import { n8nGet } from "@/lib/n8n-api";
import { isDemoMode } from "@/lib/runtime-mode";
import { type BenefitType, type Lote, type PaymentStatus } from "@/types/payments";

type LotesFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
};

export async function getLotes(filters: LotesFilters = {}): Promise<Lote[]> {
  if (isDemoMode()) {
    return getDemoLotes(filters);
  }

  const data = await n8nGet<unknown>("approvals", "batches", buildApprovalsBatchesParams(filters));

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((batch, index) => normalizeBatch(batch, index));
}

export const paymentService = {
  getLotes,
  listBatches: getLotes
};

function buildApprovalsBatchesParams(filters: LotesFilters) {
  const params: Record<string, string> = {};

  if (filters.benefitType && filters.benefitType !== "ALL") {
    params.benefitType = filters.benefitType === "SORTEIO" ? "Sorteio" : "Resgate";
  }

  if (filters.status && filters.status !== "ALL") {
    const statusMap: Record<PaymentStatus, string> = {
      PENDING: "PENDENTE",
      APPROVED: "APROVADO",
      REJECTED: "REJEITADO"
    };

    params.status = statusMap[filters.status];
  }

  return params;
}

function normalizeBatch(rawData: unknown, index: number): Lote {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};
  const id = pickText(payload.id, `lote-${index + 1}`);
  const batchNumber = pickText(payload.batchNumber, id);
  const benefitType = payload.benefitType === "SORTEIO" ? "SORTEIO" : "RESGATE";
  const status = normalizeBatchStatus(payload.status);

  return {
    id,
    batchNumber,
    benefitType,
    competence: pickText(payload.competence, "-"),
    scheduledAt: pickText(payload.scheduledAt, ""),
    status,
    paymentCount: Number(payload.paymentCount ?? 0),
    totalAmount: Number(payload.totalAmount ?? 0),
    approvedCount: Number(payload.approvedCount ?? 0),
    rejectedCount: Number(payload.rejectedCount ?? 0),
    pendingCount: Number(payload.pendingCount ?? 0),
    payments: Array.isArray(payload.payments) ? payload.payments : []
  };
}

function normalizeBatchStatus(value: unknown): Lote["status"] {
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

function pickText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}
