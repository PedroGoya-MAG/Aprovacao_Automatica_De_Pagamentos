<<<<<<< HEAD
import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext, requireApprovalsManagement } from "@/lib/bff/auth-context";
import { jsonError, jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { approveSelectedPayments } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";
=======
import { NextRequest, NextResponse } from "next/server";

import { N8nApiError, n8nPost } from "@/lib/n8n-api";

type ApproveSelectedResponse = {
  loteId: string;
  approvedPaymentIds: string[];
  status: "PARTIALLY_APPROVED" | "APPROVED";
};
>>>>>>> prd/staging

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
<<<<<<< HEAD
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    requireApprovalsManagement(context);
    const { loteId } = await params;
    const payload = await readJson(request);
    const paymentIds = Array.isArray(payload.paymentIds)
      ? payload.paymentIds.map((item) => String(item).trim()).filter(Boolean)
      : Array.isArray(payload.pagamentosIds)
        ? payload.pagamentosIds.map((item) => String(item).trim()).filter(Boolean)
        : [];

    if (paymentIds.length === 0) {
      return jsonError(400, "INVALID_PAYLOAD", "Informe os pagamentos para aprovacao.", correlationId);
    }

    const result = await approveSelectedPayments(context, loteId, paymentIds);
    return result ? jsonOk(result) : jsonOk(null, { status: 404 });
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel aprovar os pagamentos selecionados.", correlationId);
  }
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { paymentIds?: unknown; pagamentosIds?: unknown };
  } catch {
    return {};
  }
=======
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
>>>>>>> prd/staging
}
