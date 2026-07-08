import "server-only";

import { getAuthenticatedBffContext } from "@/lib/bff/auth-context";
import { getDashboardSummary, type DashboardSummaryFilters } from "@/lib/bff/payments-api";
import { getDemoResumoDashboard } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime-mode";

export async function getResumoDashboardServer(filters: DashboardSummaryFilters = {}) {
  if (isDemoMode()) {
    return getDemoResumoDashboard(filters);
  }

  const context = await getAuthenticatedBffContext();
  return getDashboardSummary(context, filters);
}
