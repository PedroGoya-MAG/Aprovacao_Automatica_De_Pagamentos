import { getDemoLotes } from "@/lib/demo-data";
import { getApprovalsBatchesUrl } from "@/lib/env";
import { isDemoMode } from "@/lib/runtime-mode";
import { type BenefitType, type Lote, type PaymentStatus } from "@/types/payments";

type LotesFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
};

export async function getLotes(filters: LotesFilters = {}): Promise<Lote[]> {
  if (isDemoMode()) {
    return getDemoLotes(filters);
  }

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
  const url = new URL(getApprovalsBatchesUrl());

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
