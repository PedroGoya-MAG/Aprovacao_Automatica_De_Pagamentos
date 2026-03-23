import { NextRequest, NextResponse } from "next/server";

import { getApprovalsWebhookBaseUrl } from "@/lib/env";

type ApproveSelectedResponse = {
  loteId: string;
  approvedPaymentIds: string[];
  status: "PARTIALLY_APPROVED" | "APPROVED";
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  const { loteId } = await params;

  let payload: { paymentIds: Array<string | number> };

  try {
    payload = (await request.json()) as { paymentIds: Array<string | number> };
  } catch {
    return NextResponse.json(null, { status: 400 });
  }

  const targetUrl = `${getApprovalsWebhookBaseUrl().replace(/\/$/, "")}/api/aprovacoes/lotes/${loteId}/aprovar-selecionados`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        paymentIds: Array.isArray(payload.paymentIds) ? payload.paymentIds : []
      })
    });

    if (!response.ok) {
      return NextResponse.json(null, { status: response.status });
    }

    const rawData = await response.json();
    const normalized = normalizeApproveSelectedResponse(rawData, loteId);

    if (!normalized) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}

function normalizeApproveSelectedResponse(rawData: unknown, loteId: string): ApproveSelectedResponse | null {
  if (typeof rawData !== "object" || rawData === null || Object.keys(rawData).length === 0) {
    return null;
  }

  const payload = rawData as Record<string, unknown>;
  const approvedPaymentIds = Array.isArray(payload.approvedPaymentIds)
    ? payload.approvedPaymentIds.map((value) => String(value))
    : payload.approvedPaymentId !== undefined && payload.approvedPaymentId !== null
      ? [String(payload.approvedPaymentId)]
      : [];

  if (approvedPaymentIds.length === 0) {
    return null;
  }

  return {
    loteId: String(payload.loteId ?? loteId),
    approvedPaymentIds,
    status: payload.status === "APPROVED" ? "APPROVED" : "PARTIALLY_APPROVED"
  };
}
