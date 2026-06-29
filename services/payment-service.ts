import { getDemoLotes } from "@/lib/demo-data";
import { n8nGet } from "@/lib/n8n-api";
import { isDemoMode } from "@/lib/runtime-mode";
import { normalizeDateValue } from "@/lib/formatters";
import { type BenefitType, type Lote, type PaymentStatus } from "@/types/payments";

type LotesFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
};

export async function getLotes(filters: LotesFilters = {}): Promise<Lote[]> {
  if (isDemoMode()) {
    const batches = getDemoLotes(filters);
    logBatchesLoaded("mock", batches);
    return batches;
  }

  logBatchesLoadStart();
  const data = await n8nGet<unknown>("approvals", "batches", buildApprovalsBatchesParams(filters));

  if (!Array.isArray(data)) {
    logBatchesLoaded("api", []);
    return [];
  }

  const normalized = data
    .map((batch) => normalizeBatch(batch))
    .filter((batch): batch is Lote => Boolean(batch));
  const batches = filterOperationalBatches(normalized, filters);
  logBatchesLoaded("api", batches);
  return batches;
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

function normalizeBatch(rawData: unknown): Lote | null {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};
  const id = pickText(payload.id);

  if (!id) {
    return null;
  }

  const batchNumber = pickText(payload.batchNumber, id) ?? id;
  const benefitType = payload.benefitType === "SORTEIO" ? "SORTEIO" : "RESGATE";
  const status = normalizeBatchStatus(payload.status);

  return {
    id,
    batchNumber,
    benefitType,
    competence: pickText(payload.competence, "-") ?? "-",
    scheduledAt: firstDate("batch.scheduledAt", payload.scheduledAt, payload.dataPagamento, payload.datePayment, payload.dueDate, payload.dataLiberacao),
    status,
    paymentCount: Number(payload.paymentCount ?? 0),
    totalAmount: Number(payload.totalAmount ?? 0),
    approvedCount: Number(payload.approvedCount ?? 0),
    rejectedCount: Number(payload.rejectedCount ?? 0),
    pendingCount: Number(payload.pendingCount ?? 0),
    payments: Array.isArray(payload.payments) ? payload.payments : []
  };
}

function firstDate(fieldName: string, ...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeDateValue(value as string | number | Date | null | undefined, fieldName);
    if (normalized) return normalized;
  }
  return null;
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

function pickText(value: unknown, fallback?: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function logBatchesLoadStart() {
  console.info("[approvals] loading batches", {
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: false
  });
}

function logBatchesLoaded(source: "api" | "mock", batches: Lote[]) {
  console.info("[approvals] batches loaded", {
    source,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: source === "mock",
    batchCount: batches.length,
    paymentCount: batches.reduce((total, batch) => total + (batch.payments?.length ?? batch.paymentCount ?? 0), 0)
  });
}

function filterOperationalBatches(batches: Lote[], filters: LotesFilters) {
  if (filters.status !== "PENDING") {
    return batches;
  }

  return batches.filter((batch) => {
    if ((batch.pendingCount ?? 0) > 0) {
      return true;
    }

    if ((batch.payments ?? []).some((payment) => payment.status === "PENDING")) {
      return true;
    }

    return batch.status === "PENDING" || batch.status === "PARTIALLY_APPROVED";
  });
}
