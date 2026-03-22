import { NextRequest, NextResponse } from "next/server";

const DEFAULT_APPROVALS_WEBHOOK_BASE_URL = "https://capn8nwfhmg.azurewebsites.net/webhook/603abf2b-0367-4379-b3a7-0407fd7878eb";

type ApproveBatchResponse = {
  loteId: string;
  status: "APPROVED";
  approvedPaymentIds: string[];
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> }
) {
  const { loteId } = await params;
  const baseUrl =
    process.env.APPROVALS_WEBHOOK_BASE_URL ??
    process.env.NEXT_PUBLIC_APPROVALS_WEBHOOK_BASE_URL ??
    DEFAULT_APPROVALS_WEBHOOK_BASE_URL;

  const targetUrl = `${baseUrl.replace(/\/$/, "")}/api/aprovacoes/lotes/${loteId}/aprovar`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return NextResponse.json(null, { status: response.status });
    }

    const rawData = await response.json();
    const normalized = normalizeApproveBatchResponse(rawData, loteId);

    if (!normalized) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}

function normalizeApproveBatchResponse(rawData: unknown, loteId: string): ApproveBatchResponse | null {
  if (typeof rawData !== "object" || rawData === null || Object.keys(rawData).length === 0) {
    return null;
  }

  const payload = rawData as Record<string, unknown>;
  const approvedPaymentIds = Array.isArray(payload.approvedPaymentIds)
    ? payload.approvedPaymentIds.map((value) => String(value))
    : [];

  if (payload.status !== "APPROVED") {
    return null;
  }

  return {
    loteId: String(payload.loteId ?? loteId),
    status: "APPROVED",
    approvedPaymentIds
  };
}
