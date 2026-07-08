import { getDemoResumoDashboard } from "@/lib/demo-data";
import { n8nGet } from "@/lib/n8n-api";
import { isDemoMode } from "@/lib/runtime-mode";
import { type BenefitType, type PaymentStatus, type ResumoDashboard } from "@/types/payments";

type DashboardSummaryFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
  search?: string;
};

export async function getResumoDashboard(filters: DashboardSummaryFilters = {}) {
  if (isDemoMode()) {
    const summary = getDemoResumoDashboard(filters);
    logSummaryLoaded("mock", summary);
    return summary;
  }

  console.info("[approvals] client loading summary", {
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: false
  });

  const query = buildSummaryQuery(filters);
  const response = await fetch(`/api/aprovacoes/resumo${query}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o resumo da dashboard.");
  }

  const summary = (await response.json()) as ResumoDashboard;
  logSummaryLoaded("api", summary);
  return summary;
}

export async function getResumoDashboardServer(filters: DashboardSummaryFilters = {}) {
  if (isDemoMode()) {
    const summary = getDemoResumoDashboard(filters);
    logSummaryLoaded("mock", summary);
    return summary;
  }

  console.info("[approvals] loading summary", {
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: false
  });

  const summary = await n8nGet<ResumoDashboard>("approvals", "summary", buildSummaryParams(filters));
  logSummaryLoaded("api", summary);
  return summary;
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

function buildSummaryParams(filters: DashboardSummaryFilters = {}) {
  const params: Record<string, string> = {};

  if (filters.benefitType && filters.benefitType !== "ALL") {
    params.benefitType = filters.benefitType === "SORTEIO" ? "Sorteio" : "Resgate";
  }

  if (filters.status && filters.status !== "ALL") {
    const statusMap: Record<PaymentStatus, string> = {
      PENDING: "PENDENTE",
      APPROVED: "APROVADO",
      REJECTED: "REJEITADO"
    };

    params.status = statusMap[filters.status];
  }

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  return params;
}

function logSummaryLoaded(source: "api" | "mock", summary: ResumoDashboard) {
  console.info("[approvals] summary loaded", {
    source,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: source === "mock",
    batchCount: summary.pendingBatchCount,
    paymentCount: summary.pendingPaymentCount
  });
}
