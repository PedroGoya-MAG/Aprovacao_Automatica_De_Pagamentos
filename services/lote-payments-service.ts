import { getDemoPagamentosByLote } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime-mode";
import { type Payment } from "@/types/payments";

export async function getPagamentosByLote(loteId: string): Promise<Payment[]> {
  if (isDemoMode()) {
    return getDemoPagamentosByLote(loteId);
  }

  const response = await fetch(`/api/aprovacoes/lotes/${loteId}/pagamentos`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os pagamentos do lote.");
  }

  return (await response.json()) as Payment[];
}
