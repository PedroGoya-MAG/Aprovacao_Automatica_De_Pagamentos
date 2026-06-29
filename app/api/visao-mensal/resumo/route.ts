import { NextResponse, type NextRequest } from "next/server";

import { getMonthlySummaryForView } from "@/services/history-insights-service";
import { type BenefitType } from "@/types/payments";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month")?.trim();

  if (!month) {
    return NextResponse.json({ message: "Mes nao informado." }, { status: 400 });
  }

  try {
    const benefitType = normalizeBenefitType(request.nextUrl.searchParams.get("benefitType"));
    const summary = await getMonthlySummaryForView(month, benefitType);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ message: "Nao foi possivel carregar o resumo mensal." }, { status: 502 });
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
