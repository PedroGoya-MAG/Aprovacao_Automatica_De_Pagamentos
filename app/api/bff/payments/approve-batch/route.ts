import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext, requireApprovalsManagement } from "@/lib/bff/auth-context";
import { jsonError, jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { approveBatch } from "@/lib/bff/payments-api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    requireApprovalsManagement(context);

    const payload = await readJson(request);
    const batchId = typeof payload.batchId === "string" && payload.batchId.trim() ? payload.batchId.trim() : "";

    if (!batchId) {
      return jsonError(400, "INVALID_PAYLOAD", "Informe o lote para aprovacao.", correlationId);
    }

    const result = await approveBatch(context, batchId);
    return result ? jsonOk(result) : jsonOk(null, { status: 404 });
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel aprovar o lote informado.", correlationId);
  }
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { batchId?: unknown };
  } catch {
    return {};
  }
}
