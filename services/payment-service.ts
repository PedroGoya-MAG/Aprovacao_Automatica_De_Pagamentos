import { mockPaymentBatches } from "@/mocks/payment-batches";
import { paymentMockApi } from "@/mocks/payment-api";
import { buildPaymentApiUrl, getPaymentApiHeaders, paymentApiConfig } from "@/services/api-config";
import { type BenefitType, type Lote, type PaymentStatus } from "@/types/payments";

const DEFAULT_APPROVALS_BATCHES_URL = "https://capn8nwfhmg.azurewebsites.net/webhook/api/aprovacoes/lotes";

type LotesFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
};

export async function getLotes(filters: LotesFilters = {}): Promise<Lote[]> {
  const realtimeUrl = buildApprovalsBatchesUrl(filters);

  try {
    const response = await fetch(realtimeUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel carregar os lotes reais.");
    }

    const data = (await response.json()) as Lote[];
    return data.map(normalizeRealtimeBatch);
  } catch {
    if (shouldUseMocks()) {
      return cloneBatches(mockPaymentBatches);
    }

    throw new Error("Nao foi possivel carregar os lotes de pagamentos.");
  }
}

export async function getLoteById(loteId: string): Promise<Lote | null> {
  if (shouldUseMocks()) {
    return paymentMockApi.getLoteById(loteId);
  }

  const response = await fetch(buildPaymentApiUrl(loteId), {
    cache: "no-store",
    headers: getPaymentApiHeaders()
  });

  if (response.status === 404) {
    return null;
  }

  return handleResponse<Lote>(response, "Nao foi possivel carregar o lote informado.");
}

export async function aprovarLote(loteId: string): Promise<Lote> {
  if (shouldUseMocks()) {
    return paymentMockApi.aprovarLote(loteId);
  }

  const response = await fetch(buildPaymentApiUrl(`${loteId}/approve`), {
    method: "POST",
    headers: getPaymentApiHeaders()
  });

  return handleResponse<Lote>(response, "Nao foi possivel aprovar o lote informado.");
}

export async function aprovarPagamento(loteId: string, pagamentoId: string): Promise<Lote> {
  if (shouldUseMocks()) {
    return paymentMockApi.aprovarPagamento(loteId, pagamentoId);
  }

  const response = await fetch(buildPaymentApiUrl(`${loteId}/payments/${pagamentoId}/approve`), {
    method: "POST",
    headers: getPaymentApiHeaders()
  });

  return handleResponse<Lote>(response, "Nao foi possivel aprovar o pagamento informado.");
}

export async function rejeitarPagamento(loteId: string, pagamentoId: string): Promise<Lote> {
  if (shouldUseMocks()) {
    return paymentMockApi.rejeitarPagamento(loteId, pagamentoId);
  }

  const response = await fetch(buildPaymentApiUrl(`${loteId}/payments/${pagamentoId}/reject`), {
    method: "POST",
    headers: getPaymentApiHeaders()
  });

  return handleResponse<Lote>(response, "Nao foi possivel rejeitar o pagamento informado.");
}

export const paymentService = {
  getLotes,
  getLoteById,
  aprovarLote,
  aprovarPagamento,
  rejeitarPagamento,
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

function normalizeRealtimeBatch(batch: Lote): Lote {
  return {
    ...batch,
    payments: batch.payments ?? []
  };
}

function shouldUseMocks() {
  return paymentApiConfig.useMocks || !paymentApiConfig.baseUrl;
}

async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  return (await response.json()) as T;
}

function cloneBatches(batches: Lote[]) {
  return batches.map((batch) => ({
    ...batch,
    payments: batch.payments?.map((payment) => ({ ...payment })) ?? []
  }));
}