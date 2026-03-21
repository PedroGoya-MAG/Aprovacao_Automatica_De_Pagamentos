import { type Payment } from "@/types/payments";

export async function getPagamentoById(pagamentoId: string | number): Promise<Payment | null> {
  const response = await fetch(`/api/aprovacoes/pagamentos/${pagamentoId}`, {
    method: "GET",
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os detalhes do pagamento.");
  }

  const data = (await response.json()) as Payment | null;

  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return null;
  }

  return data;
}
