import { type BenefitType, type PaymentStatus, type ResumoDashboard } from "@/types/payments";

type DashboardSummaryFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
  search?: string;
};

export async function getResumoDashboard(filters: DashboardSummaryFilters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.benefitType && filters.benefitType !== "ALL") {
    searchParams.set("benefitType", filters.benefitType === "SORTEIO" ? "Sorteio" : "Resgate");
  }

  if (filters.status && filters.status !== "ALL") {
    const statusMap: Record<PaymentStatus, string> = {
      PENDING: "PENDENTE",
      APPROVED: "APROVADO",
      REJECTED: "REJEITADO"
    };

    searchParams.set("status", statusMap[filters.status]);
  }

  if (filters.search?.trim()) {
    searchParams.set("search", filters.search.trim());
  }

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  const response = await fetch(`/api/aprovacoes/resumo${query}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o resumo da dashboard.");
  }

  return (await response.json()) as ResumoDashboard;
}