import { NextRequest, NextResponse } from "next/server";

import { getApprovalsWebhookBaseUrl } from "@/lib/env";

type ApproveBatchResponse = {
  loteId: string;
  status: "APPROVED";
  approvedPaymentIds: string[];
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  const { loteId } = await params;
  const targetUrl = `${getApprovalsWebhookBaseUrl().replace(/\/$/, "")}/api/aprovacoes/lotes/${loteId}/aprovar`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return NextResponse.json(null, { status: response.status });
    }

    const rawData = await response.json();
    const normalized = normalizeApproveBatchResponse(rawData, loteId);

    if (!normalized) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}

function normalizeApproveBatchResponse(rawData: unknown, loteId: string): ApproveBatchResponse | null {
  if (typeof rawData !== "object" || rawData === null || Object.keys(rawData).length === 0) {
    return null;
  }

  const payload = rawData as Record<string, unknown>;
  const approvedPaymentIds = Array.isArray(payload.approvedPaymentIds)
    ? payload.approvedPaymentIds.map((value) => String(value))
    : [];

  if (payload.status !== "APPROVED") {
    return null;
  }

  return {
    loteId: String(payload.loteId ?? loteId),
    status: "APPROVED",
    approvedPaymentIds
  };
}
