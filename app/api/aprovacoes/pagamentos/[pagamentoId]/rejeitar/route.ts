import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext, requireApprovalsManagement } from "@/lib/bff/auth-context";
import { jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { rejectPayment } from "@/lib/bff/payments-api";

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
    const payload = await readJson(request);
    const reason = typeof payload.motivo === "string" && payload.motivo.trim() ? payload.motivo.trim() : undefined;
    const result = await rejectPayment(context, pagamentoId, reason);
    return result ? jsonOk(result) : jsonOk(null, { status: 404 });
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel rejeitar o pagamento informado.", correlationId);
  }
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { motivo?: unknown };
  } catch {
    return {};
  }
}
