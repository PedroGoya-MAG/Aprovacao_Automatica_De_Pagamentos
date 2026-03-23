import { NextRequest, NextResponse } from "next/server";

import { getApprovalsSummaryUrl } from "@/lib/env";

export async function GET(request: NextRequest) {
  const targetUrl = new URL(getApprovalsSummaryUrl());
  const incomingParams = request.nextUrl.searchParams;

  ["benefitType", "status", "search"].forEach((key) => {
    const value = incomingParams.get(key);

    if (value) {
      targetUrl.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Nao foi possivel carregar o resumo da dashboard." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Falha ao consultar o resumo da dashboard." },
      { status: 502 }
    );
  }
}
