import { getDemoApproveBatchResult } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime-mode";

export type ApproveBatchResult = {
  loteId: string;
  status: "APPROVED";
  approvedPaymentIds: string[];
};

export async function approveBatch(loteId: string): Promise<ApproveBatchResult> {
  if (isDemoMode()) {
    return getDemoApproveBatchResult(loteId);
  }

  const response = await fetch("/api/bff/payments/approve-batch", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ batchId: loteId })
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel aprovar o lote informado.");
  }

  const data = (await response.json()) as ApproveBatchResult | null;

  if (!data || data.status !== "APPROVED") {
    throw new Error("Resposta invalida ao aprovar o lote informado.");
  }

  return {
    loteId: String(data.loteId ?? loteId),
    status: "APPROVED",
    approvedPaymentIds: Array.isArray(data.approvedPaymentIds)
      ? data.approvedPaymentIds.map((paymentId) => String(paymentId))
      : []
  };
}
