import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext } from "@/lib/bff/auth-context";
import { jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { getBatchDetail, getBatchPayments } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    const { batchId } = await params;
    const batch = await getBatchDetail(context, batchId);

    if (!batch) {
      return jsonOk(null, { status: 404 });
    }

    if (request.nextUrl.searchParams.get("includePayments") === "true") {
      const payments = await getBatchPayments(context, batchId);
      return jsonOk({ ...batch, payments });
    }

    return jsonOk(batch);
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel carregar os detalhes do lote.", correlationId);
  }
}
