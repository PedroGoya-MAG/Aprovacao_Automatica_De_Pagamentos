import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext } from "@/lib/bff/auth-context";
import { jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { getBatchPayments } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    const { loteId } = await params;
    return jsonOk(await getBatchPayments(context, loteId));
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel carregar os pagamentos do lote.", correlationId);
  }
}
