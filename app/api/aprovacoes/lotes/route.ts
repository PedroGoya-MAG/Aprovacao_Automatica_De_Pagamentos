import { NextRequest, NextResponse } from "next/server";

<<<<<<< HEAD
=======
import { N8nApiError } from "@/lib/n8n-api";
>>>>>>> prd/staging
import { getLotes } from "@/services/payment-service";
import { type BenefitType, type PaymentStatus } from "@/types/payments";

export async function GET(request: NextRequest) {
  const benefitType = request.nextUrl.searchParams.get("benefitType");
  const status = request.nextUrl.searchParams.get("status");

  try {
    const data = await getLotes({
      benefitType: normalizeBenefitType(benefitType),
      status: normalizeStatus(status)
    });

    return NextResponse.json(data);
  } catch (error) {
<<<<<<< HEAD
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Nao foi possivel carregar os lotes de pagamentos." },
=======
    if (error instanceof N8nApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "Nao foi possivel carregar os lotes de pagamentos." },
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
