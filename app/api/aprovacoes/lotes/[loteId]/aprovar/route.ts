<<<<<<< HEAD
import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext, requireApprovalsManagement } from "@/lib/bff/auth-context";
import { jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { approveBatch } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    requireApprovalsManagement(context);
    const { loteId } = await params;
    const result = await approveBatch(context, loteId);
    return result ? jsonOk(result) : jsonOk(null, { status: 404 });
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel aprovar o lote informado.", correlationId);
  }
}
=======
import { NextRequest, NextResponse } from "next/server";

import { N8nApiError, n8nPost } from "@/lib/n8n-api";

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

  try {
    const rawData = await n8nPost<unknown>("approvals", "approve-batch", { loteId });
    const normalized = normalizeApproveBatchResponse(rawData, loteId);

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
>>>>>>> prd/staging
