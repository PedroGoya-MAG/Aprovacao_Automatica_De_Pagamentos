import { NextRequest, NextResponse } from "next/server";

import { N8nApiError, n8nPost } from "@/lib/n8n-api";

type ApprovePaymentResponse = {
  id: string;
  status: "APPROVED";
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pagamentoId: string }> }
) {
  const { pagamentoId } = await params;

  try {
    const rawData = await n8nPost<unknown>("approvals", "approve-payment", { pagamentoId });
    const normalized = normalizeApproveResponse(rawData, pagamentoId);

    if (!normalized) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(normalized);
  } catch (error) {
    if (error instanceof N8nApiError) {
      return NextResponse.json(null, { status: error.status });
    }

    return NextResponse.json(null, { status: 502 });
  }
}

function normalizeApproveResponse(rawData: unknown, pagamentoId: string): ApprovePaymentResponse | null {
  if (typeof rawData !== "object" || rawData === null || Object.keys(rawData).length === 0) {
    return null;
  }

  const payload = rawData as Record<string, unknown>;

  if (payload.status !== "APPROVED") {
    return null;
  }

  return {
    id: String(payload.id ?? pagamentoId),
    status: "APPROVED"
  };
}
