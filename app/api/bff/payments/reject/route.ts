import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext, requireApprovalsManagement } from "@/lib/bff/auth-context";
import { jsonError, jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { rejectPayment } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    requireApprovalsManagement(context);

    const payload = await readJson(request);
    const paymentId = typeof payload.paymentId === "string" && payload.paymentId.trim() ? payload.paymentId.trim() : "";
    const reason = typeof payload.motivo === "string" && payload.motivo.trim() ? payload.motivo.trim() : undefined;

    if (!paymentId) {
      return jsonError(400, "INVALID_PAYLOAD", "Informe o pagamento para rejeicao.", correlationId);
    }

    const result = await rejectPayment(context, paymentId, reason);
    return result ? jsonOk(result) : jsonOk(null, { status: 404 });
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel rejeitar o pagamento informado.", correlationId);
  }
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { paymentId?: unknown; motivo?: unknown };
  } catch {
    return {};
  }
}
