<<<<<<< HEAD
import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext } from "@/lib/bff/auth-context";
import { jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { getBatchPayments } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    const { loteId } = await params;
    return jsonOk(await getBatchPayments(context, loteId));
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel carregar os pagamentos do lote.", correlationId);
  }
}
=======
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
    const payments = normalizePayments(rawData, loteId);
    console.info("[approvals] batch payments loaded", {
      loteId,
      source: "api",
      demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
      usingMock: false,
      paymentCount: payments.length
    });
    return NextResponse.json(payments);
  } catch (error) {
    if (error instanceof N8nApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "Nao foi possivel carregar os pagamentos do lote." },
      { status: 502 }
    );
  }
}

function normalizePayments(rawData: unknown, loteId: string): Payment[] {
  if (!Array.isArray(rawData)) {
    return [];
  }

  const items = rawData.filter((item) => isNonEmptyObject(item));
  const seen = new Set<string>();

  return items
    .map((item) => normalizePayment(item, loteId))
    .filter((payment): payment is Payment => Boolean(payment))
    .filter((payment) => {
      const dedupeKey = `${payment.id}-${payment.reference}`;

      if (seen.has(dedupeKey)) {
        return false;
      }

      seen.add(dedupeKey);
      return true;
    });
}

function normalizePayment(item: Record<string, unknown>, loteId: string): Payment | null {
  const normalizedId = pickText(item.id);

  if (!normalizedId) {
    return null;
  }

  return {
    id: normalizedId,
    loteId,
    beneficiaryName: pickText(item.beneficiaryName, "Beneficiario nao informado") ?? "Beneficiario nao informado",
    document: pickText(item.document, "-") ?? "-",
    grossAmount: Number(item.grossAmount ?? 0),
    paymentDate: firstDate("payment.paymentDate", item.paymentDate, item.dataPagamento, item.datePayment, item.dueDate),
    benefitType: item.benefitType === "SORTEIO" ? "SORTEIO" : "RESGATE",
    status: normalizeStatus(item.status),
    reference: pickText(item.reference, normalizedId) ?? normalizedId
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

function pickText(value: unknown, fallback?: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstValid = value.find((item) => typeof item === "string" && item.trim());
    return typeof firstValid === "string" ? firstValid.trim() : fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.keys(value).length > 0;
}
>>>>>>> prd/staging
