import { NextRequest, NextResponse } from "next/server";

import { N8nApiError, n8nPost } from "@/lib/n8n-api";

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

  let payload: { paymentIds?: Array<string | number>; pagamentosIds?: Array<string | number> };

  try {
    payload = (await request.json()) as { paymentIds?: Array<string | number>; pagamentosIds?: Array<string | number> };
  } catch {
    return NextResponse.json(null, { status: 400 });
  }

  const paymentIds = Array.isArray(payload.paymentIds)
    ? payload.paymentIds
    : Array.isArray(payload.pagamentosIds)
      ? payload.pagamentosIds
      : [];

  try {
    const rawData = await n8nPost<unknown>("approvals", "approve-selected", {
      loteId,
      paymentIds
    });
    const normalized = normalizeApproveSelectedResponse(rawData, loteId);

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
