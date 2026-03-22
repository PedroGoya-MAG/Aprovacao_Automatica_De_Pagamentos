export type ApproveSelectedPaymentsResult = {
  loteId: string;
  approvedPaymentIds: string[];
  status: "PARTIALLY_APPROVED" | "APPROVED";
};

export async function approveSelectedPayments(
  loteId: string,
  paymentIds: string[]
): Promise<ApproveSelectedPaymentsResult> {
  const response = await fetch(`/api/aprovacoes/lotes/${loteId}/aprovar-selecionados`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ paymentIds })
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
