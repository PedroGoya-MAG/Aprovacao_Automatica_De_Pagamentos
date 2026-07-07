import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext, requireApprovalsManagement } from "@/lib/bff/auth-context";
import { jsonError, jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { approvePayment, getPaymentDetail } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    const { paymentId } = await params;
    const payment = await getPaymentDetail(context, paymentId);
    return payment ? jsonOk(payment) : jsonOk(null, { status: 404 });
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel carregar os detalhes do pagamento.", correlationId);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    requireApprovalsManagement(context);

    const payload = await readJson(request);
    if (payload.action !== "approve") {
      return jsonError(400, "INVALID_PAYLOAD", "Acao invalida para pagamento.", correlationId);
    }

    const { paymentId } = await params;
    const result = await approvePayment(context, paymentId);
    return result ? jsonOk(result) : jsonOk(null, { status: 404 });
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel aprovar o pagamento informado.", correlationId);
  }
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { action?: unknown };
  } catch {
    return {};
  }
}
