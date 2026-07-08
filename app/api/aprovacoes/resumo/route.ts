import { NextRequest, NextResponse } from "next/server";

import { N8nApiError } from "@/lib/n8n-api";
import { getResumoDashboardServer } from "@/services/dashboard-service";
import { type BenefitType, type PaymentStatus } from "@/types/payments";

export async function GET(request: NextRequest) {
  try {
    const data = await getResumoDashboardServer({
      benefitType: normalizeBenefitType(request.nextUrl.searchParams.get("benefitType")),
      status: normalizeStatus(request.nextUrl.searchParams.get("status")),
      search: request.nextUrl.searchParams.get("search") ?? undefined
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof N8nApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "Falha ao consultar o resumo da dashboard." },
      { status: 502 }
    );
  }
}

function normalizeBenefitType(value: string | null): "ALL" | BenefitType {
  if (value === "SORTEIO" || value === "Sorteio") {
    return "SORTEIO";
  }

  if (value === "RESGATE" || value === "Resgate") {
    return "RESGATE";
  }

  return "ALL";
}

function normalizeStatus(value: string | null): "ALL" | PaymentStatus {
  if (value === "APPROVED" || value === "APROVADO") {
    return "APPROVED";
  }

  if (value === "REJECTED" || value === "REJEITADO") {
    return "REJECTED";
  }

  if (value === "PENDING" || value === "PENDENTE") {
    return "PENDING";
  }

  return "ALL";
}
