import { NextRequest, NextResponse } from "next/server";

import { getApprovalsWebhookBaseUrl } from "@/lib/env";

type RejectPaymentResponse = {
  id: string;
  status: "REJECTED";
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pagamentoId: string }> }
) {
  const { pagamentoId } = await params;
  const targetUrl = `${getApprovalsWebhookBaseUrl().replace(/\/$/, "")}/api/aprovacoes/pagamentos/${pagamentoId}/rejeitar`;

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
    const normalized = normalizeRejectResponse(rawData, pagamentoId);

    if (!normalized) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}

function normalizeRejectResponse(rawData: unknown, pagamentoId: string): RejectPaymentResponse | null {
  if (typeof rawData !== "object" || rawData === null || Object.keys(rawData).length === 0) {
    return null;
  }

  const payload = rawData as Record<string, unknown>;

  if (payload.status !== "REJECTED") {
    return null;
  }

  return {
    id: String(payload.id ?? pagamentoId),
    status: "REJECTED"
  };
}
