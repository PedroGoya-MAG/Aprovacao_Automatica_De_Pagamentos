import { NextRequest, NextResponse } from "next/server";

<<<<<<< HEAD
import { getResumoDashboardServer } from "@/services/dashboard-server-service";
=======
import { N8nApiError } from "@/lib/n8n-api";
import { getResumoDashboardServer } from "@/services/dashboard-service";
>>>>>>> prd/staging
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
<<<<<<< HEAD
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Falha ao consultar o resumo da dashboard." },
=======
    if (error instanceof N8nApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "Falha ao consultar o resumo da dashboard." },
>>>>>>> prd/staging
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
