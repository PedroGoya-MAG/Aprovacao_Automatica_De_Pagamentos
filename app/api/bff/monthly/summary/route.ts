import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext } from "@/lib/bff/auth-context";
import { jsonError, jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { getMonthlySummaryForView } from "@/services/history-insights-service";
import { type BenefitType } from "@/types/payments";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    const month = request.nextUrl.searchParams.get("month")?.trim();

    if (!month) {
      return jsonError(400, "BAD_REQUEST", "Mes nao informado.", correlationId);
    }

    const benefitType = normalizeBenefitType(request.nextUrl.searchParams.get("benefitType"));
    const summary = await getMonthlySummaryForView(month, benefitType);

    return jsonOk(summary);
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel carregar o resumo mensal.", correlationId);
  }
}

function normalizeBenefitType(value: string | null): "ALL" | BenefitType {
  if (value === "Sorteio" || value === "SORTEIO") {
    return "SORTEIO";
  }

  if (value === "Resgate" || value === "RESGATE") {
    return "RESGATE";
  }

  return "ALL";
}
