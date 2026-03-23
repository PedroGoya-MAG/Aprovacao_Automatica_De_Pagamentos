import { getDemoResumoDashboard } from "@/lib/demo-data";
import { getApprovalsSummaryUrl } from "@/lib/env";
import { isDemoMode } from "@/lib/runtime-mode";
import { type BenefitType, type PaymentStatus, type ResumoDashboard } from "@/types/payments";

type DashboardSummaryFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
  search?: string;
};

export async function getResumoDashboard(filters: DashboardSummaryFilters = {}) {
  if (isDemoMode()) {
    return getDemoResumoDashboard(filters);
  }

  const query = buildSummaryQuery(filters);
  const response = await fetch(`/api/aprovacoes/resumo${query}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o resumo da dashboard.");
  }

  return (await response.json()) as ResumoDashboard;
}

export async function getResumoDashboardServer(filters: DashboardSummaryFilters = {}) {
  if (isDemoMode()) {
    return getDemoResumoDashboard(filters);
  }

  const targetUrl = new URL(getApprovalsSummaryUrl());
  const searchParams = new URLSearchParams(buildSummaryQuery(filters).replace(/^\?/, ""));

  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const response = await fetch(targetUrl.toString(), {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o resumo da dashboard.");
  }

  return (await response.json()) as ResumoDashboard;
}

function buildSummaryQuery(filters: DashboardSummaryFilters = {}) {
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

  return searchParams.size > 0 ? `?${searchParams.toString()}` : "";
}
