import { type NextRequest } from "next/server";

import { getAuthenticatedBffContext } from "@/lib/bff/auth-context";
import { jsonOk, toBffErrorResponse } from "@/lib/bff/errors";
import { getBatches } from "@/lib/bff/payments-api";
import { type BenefitType, type PaymentStatus } from "@/types/payments";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let correlationId: string | undefined;

  try {
    const context = await getAuthenticatedBffContext(request);
    correlationId = context.correlationId;
    const data = await getBatches(context, {
      benefitType: normalizeBenefitType(request.nextUrl.searchParams.get("benefitType")),
      status: normalizeStatus(request.nextUrl.searchParams.get("status"))
    });

    return jsonOk(data);
  } catch (error) {
    return toBffErrorResponse(error, "Nao foi possivel carregar os lotes de pagamentos.", correlationId);
  }
}

function normalizeBenefitType(value: string | null): "ALL" | BenefitType {
  if (value === "SORTEIO" || value === "Sorteio") return "SORTEIO";
  if (value === "RESGATE" || value === "Resgate") return "RESGATE";
  return "ALL";
}

function normalizeStatus(value: string | null): "ALL" | PaymentStatus {
  if (value === "APPROVED" || value === "APROVADO") return "APPROVED";
  if (value === "REJECTED" || value === "REJEITADO") return "REJECTED";
  if (value === "PENDING" || value === "PENDENTE") return "PENDING";
  return "ALL";
}
