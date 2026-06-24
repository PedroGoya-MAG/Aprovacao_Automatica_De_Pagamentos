import { NextRequest, NextResponse } from "next/server";

import { N8nApiError, n8nGet } from "@/lib/n8n-api";
import { normalizeDateValue } from "@/lib/formatters";
import { type Payment } from "@/types/payments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  const { loteId } = await params;

  try {
    const rawData = await n8nGet<unknown>("approvals", "batch-payments", { loteId });
    return NextResponse.json(normalizePayments(rawData, loteId));
  } catch (error) {
    if (error instanceof N8nApiError) {
      return NextResponse.json([], { status: error.status });
    }

    return NextResponse.json([], { status: 502 });
  }
}

function normalizePayments(rawData: unknown, loteId: string): Payment[] {
  if (!Array.isArray(rawData)) {
    return [];
  }

  const items = rawData.filter((item) => isNonEmptyObject(item));
  const seen = new Set<string>();

  return items
    .map((item, index) => normalizePayment(item, loteId, index))
    .filter((payment) => {
      const dedupeKey = `${payment.id}-${payment.reference}`;

      if (seen.has(dedupeKey)) {
        return false;
      }

      seen.add(dedupeKey);
      return true;
    });
}

function normalizePayment(item: Record<string, unknown>, loteId: string, index: number): Payment {
  const normalizedId = String(item.id ?? `${loteId}-${index + 1}`);

  return {
    id: normalizedId,
    loteId,
    beneficiaryName: pickText(item.beneficiaryName, "Beneficiario nao informado"),
    document: pickText(item.document, "-"),
    grossAmount: Number(item.grossAmount ?? 0),
    paymentDate: firstDate("payment.paymentDate", item.paymentDate, item.dataPagamento, item.datePayment, item.dueDate),
    benefitType: item.benefitType === "SORTEIO" ? "SORTEIO" : "RESGATE",
    status: normalizeStatus(item.status),
    reference: pickText(item.reference, normalizedId)
  };
}

function firstDate(fieldName: string, ...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeDateValue(value as string | number | Date | null | undefined, fieldName);
    if (normalized) return normalized;
  }
  return null;
}

function normalizeStatus(value: unknown): Payment["status"] {
  if (value === "APPROVED") {
    return "APPROVED";
  }

  if (value === "REJECTED") {
    return "REJECTED";
  }

  return "PENDING";
}

function pickText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstValid = value.find((item) => typeof item === "string" && item.trim());
    return typeof firstValid === "string" ? firstValid.trim() : fallback;
  }

  return fallback;
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.keys(value).length > 0;
}
