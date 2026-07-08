<<<<<<< HEAD
import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext, requireApprovalsManagement } from "@/lib/bff/auth-context";
import { jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { approvePayment } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pagamentoId: string }> }
) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    requireApprovalsManagement(context);
    const { pagamentoId } = await params;
    const result = await approvePayment(context, pagamentoId);
    return result ? jsonOk(result) : jsonOk(null, { status: 404 });
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel aprovar o pagamento informado.", correlationId);
  }
}
=======
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
>>>>>>> prd/staging
