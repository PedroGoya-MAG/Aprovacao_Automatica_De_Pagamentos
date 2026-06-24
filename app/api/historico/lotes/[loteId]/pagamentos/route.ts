import { NextRequest, NextResponse } from "next/server";

import { N8nApiError, n8nGet } from "@/lib/n8n-api";
import { normalizeDateValue } from "@/lib/formatters";
import { type HistoricalPayment, type HistoryPaymentProcessingType, type SuspicionReasonCode } from "@/types/insights";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  const { loteId } = await params;

  try {
    const rawData = await n8nGet<unknown>("history", "batch-payments", { loteId });
    return NextResponse.json(normalizeHistoricalPayments(rawData, loteId));
  } catch (error) {
    if (error instanceof N8nApiError) {
      return NextResponse.json([], { status: error.status });
    }

    return NextResponse.json([], { status: 502 });
  }
}

function normalizeHistoricalPayments(rawData: unknown, loteId: string): HistoricalPayment[] {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => normalizeHistoricalPayment(item, loteId, index));
}

function normalizeHistoricalPayment(
  item: Record<string, unknown>,
  loteId: string,
  index: number
): HistoricalPayment {
  const normalizedId = pickText(item.id, `${loteId}-${index + 1}`);
  const suspicionReasons = Array.isArray(item.suspicionReasons)
    ? item.suspicionReasons.filter(isSuspicionReasonCode)
    : [];

  return {
    id: normalizedId,
    loteId: pickText(item.loteId, loteId),
    batchNumber: pickText(item.batchNumber, loteId),
    beneficiaryName: pickText(item.beneficiaryName, "Beneficiario nao informado"),
    document: pickText(item.document, "-"),
    grossAmount: Number(item.grossAmount ?? 0),
    paymentDate: firstDate("payment.paymentDate", item.paymentDate, item.dataPagamento, item.datePayment, item.dueDate),
    benefitType: item.benefitType === "SORTEIO" ? "SORTEIO" : "RESGATE",
    status: normalizeStatus(item.status),
    reference: pickText(item.reference, normalizedId),
    observations: pickOptionalText(item.observations) ?? undefined,
    processedAt: firstDate("payment.processedAt", item.processedAt, item.dataAprovacao, item.dateStatus),
    processingType: normalizeProcessingType(item.processingType),
    rejectionReason: pickOptionalText(item.rejectionReason),
    isSuspicious: Boolean(item.isSuspicious),
    suspicionReasons
  };
}

function firstDate(fieldName: string, ...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeDateValue(value as string | number | Date | null | undefined, fieldName);
    if (normalized) return normalized;
  }
  return null;
}

function normalizeStatus(value: unknown): HistoricalPayment["status"] {
  if (value === "APPROVED") {
    return "APPROVED";
  }

  if (value === "REJECTED") {
    return "REJECTED";
  }

  return "PENDING";
}

function normalizeProcessingType(value: unknown): HistoryPaymentProcessingType {
  if (value === "MANUAL") {
    return "MANUAL";
  }

  return "AUTOMATIC";
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

function pickOptionalText(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function isSuspicionReasonCode(value: unknown): value is SuspicionReasonCode {
  return (
    value === "HIGH_VALUE" ||
    value === "DUPLICATE_BENEFICIARY" ||
    value === "SINGLE_CONCENTRATION" ||
    value === "DOUBLE_CONCENTRATION"
  );
}
