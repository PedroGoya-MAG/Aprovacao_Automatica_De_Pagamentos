import { type MonthlySeries } from "@/types/insights";
import { type BenefitType } from "@/types/payments";

export async function getMonthlySeries(month: string, benefitType: "ALL" | BenefitType = "ALL"): Promise<MonthlySeries> {
  const searchParams = new URLSearchParams({ month });

  if (benefitType !== "ALL") {
    searchParams.set("benefitType", benefitType);
  }

  const response = await fetch(`/api/visao-mensal/series?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar as series mensais.");
  }

  return (await response.json()) as MonthlySeries;
}
