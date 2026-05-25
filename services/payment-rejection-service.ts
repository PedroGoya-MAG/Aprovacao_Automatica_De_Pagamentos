import { getDemoRejectPaymentResult } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime-mode";

export type RejectPaymentResult = {
  id: string;
  status: "REJECTED";
};

export async function rejectPaymentById(
  pagamentoId: string | number,
  motivo?: string
): Promise<RejectPaymentResult> {
  if (isDemoMode()) {
    return getDemoRejectPaymentResult(pagamentoId);
  }

  const response = await fetch(`/api/aprovacoes/pagamentos/${pagamentoId}/rejeitar`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(motivo ? { motivo } : {})
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel rejeitar o pagamento informado.");
  }

  const data = (await response.json()) as RejectPaymentResult | null;

  if (!data || data.status !== "REJECTED") {
    throw new Error("Resposta invalida ao rejeitar o pagamento.");
  }

  return {
    id: String(data.id),
    status: "REJECTED"
  };
}
