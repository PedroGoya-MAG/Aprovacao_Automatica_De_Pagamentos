import { type MonthlyTotals } from "@/types/insights";
import { type BenefitType } from "@/types/payments";

export async function getMonthlySummary(month: string, benefitType: "ALL" | BenefitType = "ALL"): Promise<MonthlyTotals> {
  const searchParams = new URLSearchParams({ month });

  if (benefitType !== "ALL") {
    searchParams.set("benefitType", benefitType);
  }

  const response = await fetch(`/api/bff/monthly/summary?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o resumo mensal.");
  }

  return (await response.json()) as MonthlyTotals;
}
