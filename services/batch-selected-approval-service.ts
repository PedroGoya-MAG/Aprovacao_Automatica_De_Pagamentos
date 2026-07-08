import { getDemoApproveSelectedResult } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime-mode";

export type ApproveSelectedPaymentsResult = {
  loteId: string;
  approvedPaymentIds: string[];
  status: "PARTIALLY_APPROVED" | "APPROVED";
};

export async function approveSelectedPayments(
  loteId: string,
  paymentIds: string[]
): Promise<ApproveSelectedPaymentsResult> {
  if (isDemoMode()) {
    return getDemoApproveSelectedResult(loteId, paymentIds);
  }

<<<<<<< HEAD
  const response = await fetch("/api/bff/payments/approve-selected", {
=======
  const response = await fetch(`/api/aprovacoes/lotes/${loteId}/aprovar-selecionados`, {
>>>>>>> prd/staging
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
<<<<<<< HEAD
    body: JSON.stringify({ batchId: loteId, paymentIds })
=======
    body: JSON.stringify({ paymentIds })
>>>>>>> prd/staging
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel aprovar os pagamentos selecionados.");
  }

  const data = (await response.json()) as ApproveSelectedPaymentsResult | null;

  if (!data || !Array.isArray(data.approvedPaymentIds) || data.approvedPaymentIds.length === 0) {
    throw new Error("Resposta invalida ao aprovar os pagamentos selecionados.");
  }

  return {
    loteId: String(data.loteId ?? loteId),
    approvedPaymentIds: data.approvedPaymentIds.map((paymentId) => String(paymentId)),
    status: data.status === "APPROVED" ? "APPROVED" : "PARTIALLY_APPROVED"
  };
}
