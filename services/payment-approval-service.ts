import { getDemoApprovePaymentResult } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime-mode";

export type ApprovePaymentResult = {
  id: string;
  status: "APPROVED";
};

export async function approvePaymentById(pagamentoId: string | number): Promise<ApprovePaymentResult> {
  if (isDemoMode()) {
    return getDemoApprovePaymentResult(pagamentoId);
  }

  const response = await fetch(`/api/bff/payments/${pagamentoId}`, {
    method: "PATCH",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action: "approve" })
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel aprovar o pagamento informado.");
  }

  const data = (await response.json()) as ApprovePaymentResult | null;

  if (!data || data.status !== "APPROVED") {
    throw new Error("Resposta invalida ao aprovar o pagamento.");
  }

  return {
    id: String(data.id),
    status: "APPROVED"
  };
}
