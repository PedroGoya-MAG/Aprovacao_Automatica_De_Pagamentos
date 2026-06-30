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
