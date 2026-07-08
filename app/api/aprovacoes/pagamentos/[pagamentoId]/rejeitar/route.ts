import { NextRequest, NextResponse } from "next/server";

import { N8nApiError, n8nPost } from "@/lib/n8n-api";

type RejectPaymentResponse = {
  id: string;
  status: "REJECTED";
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pagamentoId: string }> }
) {
  const { pagamentoId } = await params;

  let motivo: string | undefined;

  try {
    const payload = (await request.json()) as { motivo?: unknown };
    motivo = typeof payload.motivo === "string" && payload.motivo.trim() ? payload.motivo.trim() : undefined;
  } catch {
    motivo = undefined;
  }

  try {
    const rawData = await n8nPost<unknown>("approvals", "reject-payment", {
      pagamentoId,
      motivo
    });
    const normalized = normalizeRejectResponse(rawData, pagamentoId);

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
