import { paymentMockApi } from "@/mocks/payment-api";
import { buildPaymentApiUrl, getPaymentApiHeaders, paymentApiConfig } from "@/services/api-config";
import { type Lote } from "@/types/payments";

export async function getLotes(): Promise<Lote[]> {
  if (shouldUseMocks()) {
    return paymentMockApi.getLotes();
  }

  const response = await fetch(buildPaymentApiUrl(), {
    cache: "no-store",
    headers: getPaymentApiHeaders()
  });

  return handleResponse<Lote[]>(response, "Nao foi possivel carregar os lotes de pagamentos.");
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

function shouldUseMocks() {
  return paymentApiConfig.useMocks || !paymentApiConfig.baseUrl;
}

async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  return (await response.json()) as T;
}
