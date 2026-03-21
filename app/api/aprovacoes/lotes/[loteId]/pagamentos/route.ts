import { NextRequest, NextResponse } from "next/server";

import { type Payment } from "@/types/payments";

const DEFAULT_APPROVALS_WEBHOOK_BASE_URL = "https://capn8nwfhmg.azurewebsites.net/webhook/603abf2b-0367-4379-b3a7-0407fd7878eb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  const { loteId } = await params;
  const baseUrl =
    process.env.APPROVALS_WEBHOOK_BASE_URL ??
    process.env.NEXT_PUBLIC_APPROVALS_WEBHOOK_BASE_URL ??
    DEFAULT_APPROVALS_WEBHOOK_BASE_URL;

  const targetUrl = `${baseUrl.replace(/\/$/, "")}/api/aprovacoes/lotes/${loteId}/pagamentos`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const rawData = await response.json();
    return NextResponse.json(normalizePayments(rawData, loteId));
  } catch {
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
    paymentDate: String(item.paymentDate ?? ""),
    benefitType: item.benefitType === "SORTEIO" ? "SORTEIO" : "RESGATE",
    status: normalizeStatus(item.status),
    reference: pickText(item.reference, normalizedId)
  };
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