import { type BenefitType, type Lote, type PaymentStatus } from "@/types/payments";

const DEFAULT_APPROVALS_BATCHES_URL = "https://capn8nwfhmg.azurewebsites.net/webhook-test/api/aprovacoes/lotes";

type LotesFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
};

export async function getLotes(filters: LotesFilters = {}): Promise<Lote[]> {
  const response = await fetch(buildApprovalsBatchesUrl(filters), {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os lotes de pagamentos.");
  }

  const data = (await response.json()) as Lote[];
  return data.map((batch) => ({
    ...batch,
    payments: batch.payments ?? []
  }));
}

export const paymentService = {
  getLotes,
  listBatches: getLotes
};

function buildApprovalsBatchesUrl(filters: LotesFilters) {
  const baseUrl =
    process.env.APPROVALS_BATCHES_URL ??
    process.env.NEXT_PUBLIC_APPROVALS_BATCHES_URL ??
    DEFAULT_APPROVALS_BATCHES_URL;

  const url = new URL(baseUrl);

  if (filters.benefitType && filters.benefitType !== "ALL") {
    url.searchParams.set("benefitType", filters.benefitType === "SORTEIO" ? "Sorteio" : "Resgate");
  }

  if (filters.status && filters.status !== "ALL") {
    const statusMap: Record<PaymentStatus, string> = {
      PENDING: "PENDENTE",
      APPROVED: "APROVADO",
      REJECTED: "REJEITADO"
    };

    url.searchParams.set("status", statusMap[filters.status]);
  }

  return url.toString();
}
