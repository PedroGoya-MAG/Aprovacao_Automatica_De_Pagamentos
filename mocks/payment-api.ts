import { mockPaymentBatches } from "@/mocks/payment-batches";
import { type Lote } from "@/types/payments";

let mockDatabase = cloneLotes(mockPaymentBatches);

export const paymentMockApi = {
  async getLotes(): Promise<Lote[]> {
    await simulateDelay();
    return cloneLotes(mockDatabase);
  },

  async getLoteById(loteId: string): Promise<Lote | null> {
    await simulateDelay();
    const lote = mockDatabase.find((item) => item.id === loteId);
    return lote ? cloneLote(lote) : null;
  },

  async aprovarLote(loteId: string): Promise<Lote> {
    await simulateDelay();
    const lote = getExistingLote(loteId);

    lote.payments = lote.payments.map((payment) =>
      payment.status === "PENDING" ? { ...payment, status: "APPROVED" } : payment
    );

    return cloneLote(lote);
  },

  async aprovarPagamento(loteId: string, pagamentoId: string): Promise<Lote> {
    await simulateDelay();
    const lote = getExistingLote(loteId);

    lote.payments = lote.payments.map((payment) =>
      payment.id === pagamentoId ? { ...payment, status: "APPROVED" } : payment
    );

    return cloneLote(lote);
  },

  async rejeitarPagamento(loteId: string, pagamentoId: string): Promise<Lote> {
    await simulateDelay();
    const lote = getExistingLote(loteId);

    lote.payments = lote.payments.map((payment) =>
      payment.id === pagamentoId ? { ...payment, status: "REJECTED" } : payment
    );

    return cloneLote(lote);
  },

  reset() {
    mockDatabase = cloneLotes(mockPaymentBatches);
  }
};

function getExistingLote(loteId: string) {
  const lote = mockDatabase.find((item) => item.id === loteId);

  if (!lote) {
    throw new Error("Lote nao encontrado no mock.");
  }

  return lote;
}

function simulateDelay(duration = 180) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function cloneLote(lote: Lote): Lote {
  return {
    ...lote,
    payments: lote.payments.map((payment) => ({ ...payment }))
  };
}

function cloneLotes(lotes: Lote[]) {
  return lotes.map(cloneLote);
}
