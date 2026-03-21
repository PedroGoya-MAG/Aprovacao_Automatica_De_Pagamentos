import { NextRequest, NextResponse } from "next/server";

const DEFAULT_APPROVALS_SUMMARY_URL = "https://capn8nwfhmg.azurewebsites.net/webhook/api/aprovacoes/resumo";

export async function GET(request: NextRequest) {
  const upstreamUrl =
    process.env.APPROVALS_SUMMARY_URL ??
    process.env.NEXT_PUBLIC_APPROVALS_SUMMARY_URL ??
    DEFAULT_APPROVALS_SUMMARY_URL;

  const targetUrl = new URL(upstreamUrl);
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