import { getDemoLotes } from "@/lib/demo-data";
import { getAuthenticatedBffContext } from "@/lib/bff/auth-context";
import { getBatches } from "@/lib/bff/payments-api";
import { isDemoMode } from "@/lib/runtime-mode";
import { normalizeDateValue } from "@/lib/formatters";
import { type BenefitType, type Lote, type PaymentStatus } from "@/types/payments";

type LotesFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
};

export async function getLotes(filters: LotesFilters = {}): Promise<Lote[]> {
  if (isDemoMode()) {
    const batches = getDemoLotes(filters);
    logBatchesLoaded("mock", batches);
    return batches;
  }

  logBatchesLoadStart();
  const context = await getAuthenticatedBffContext();
  const batches = await getBatches(context, filters);
  logBatchesLoaded("api", batches);
  return batches;
}

export const paymentService = {
  getLotes,
  listBatches: getLotes
};

function logBatchesLoadStart() {
  console.info("[approvals] loading batches", {
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: false
  });
}

function logBatchesLoaded(source: "api" | "mock", batches: Lote[]) {
  console.info("[approvals] batches loaded", {
    source,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: source === "mock",
    batchCount: batches.length,
    paymentCount: batches.reduce((total, batch) => total + (batch.payments?.length ?? batch.paymentCount ?? 0), 0)
  });
}

