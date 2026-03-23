import { NextRequest, NextResponse } from "next/server";

import { getApprovalsWebhookBaseUrl } from "@/lib/env";
import { type Payment } from "@/types/payments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pagamentoId: string }> }
) {
  const { pagamentoId } = await params;
  const targetUrl = `${getApprovalsWebhookBaseUrl().replace(/\/$/, "")}/api/aprovacoes/pagamentos/${pagamentoId}`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return NextResponse.json(null, { status: response.status });
    }

    const rawData = await response.json();
    const payment = normalizePayment(rawData, pagamentoId);

    if (!payment) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}

function normalizePayment(rawData: unknown, pagamentoId: string): Payment | null {
  if (!isNonEmptyObject(rawData)) {
    return null;
  }

  return {
    id: String(rawData.id ?? pagamentoId),
    loteId: pickText(rawData.loteId),
    beneficiaryName: pickText(rawData.beneficiaryName, "Beneficiario nao informado") ?? "Beneficiario nao informado",
    document: pickText(rawData.document, "-") ?? "-",
    grossAmount: Number(rawData.grossAmount ?? 0),
    paymentDate: String(rawData.paymentDate ?? ""),
    benefitType: normalizeBenefitType(rawData.benefitType),
    status: normalizeStatus(rawData.status),
    reference: pickText(rawData.reference, String(rawData.id ?? pagamentoId)) ?? String(rawData.id ?? pagamentoId),
    observations: pickText(rawData.observations)
  };
}

function normalizeBenefitType(value: unknown): Payment["benefitType"] {
  if (value === "SORTEIO") {
    return "SORTEIO";
  }

  if (value === "RESGATE") {
    return "RESGATE";
  }

  return undefined;
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

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const firstValid = value.find((item) => {
      if (typeof item === "string") {
        return item.trim().length > 0;
      }

      return typeof item === "number";
    });

    if (typeof firstValid === "string") {
      return firstValid.trim();
    }

    if (typeof firstValid === "number") {
      return String(firstValid);
    }
  }

  return fallback;
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.keys(value).length > 0;
}
