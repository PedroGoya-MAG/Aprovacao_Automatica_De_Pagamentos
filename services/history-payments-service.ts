import { type HistoricalPayment } from "@/types/insights";

export async function getHistoricalPaymentsByBatch(loteId: string): Promise<HistoricalPayment[]> {
  const response = await fetch(`/api/historico/lotes/${loteId}/pagamentos`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os pagamentos do lote historico.");
  }

  return (await response.json()) as HistoricalPayment[];
}
