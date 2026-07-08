import { getDemoPagamentosByLote } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime-mode";
import { type Payment } from "@/types/payments";

export async function getPagamentosByLote(loteId: string): Promise<Payment[]> {
  if (isDemoMode()) {
    const payments = getDemoPagamentosByLote(loteId);
    logPaymentsLoaded(loteId, "mock", payments.length);
    return payments;
  }

  console.info("[approvals] client loading batch payments", {
    loteId,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: false
  });

<<<<<<< HEAD
  const response = await fetch(`/api/bff/batches/${loteId}/payments`, {
=======
  const response = await fetch(`/api/aprovacoes/lotes/${loteId}/pagamentos`, {
>>>>>>> prd/staging
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message ?? "Nao foi possivel carregar os pagamentos do lote.");
  }

  const payments = (await response.json()) as Payment[];
  logPaymentsLoaded(loteId, "api", payments.length);
  return payments;
}

async function readErrorMessage(response: Response) {
  try {
<<<<<<< HEAD
    const payload = (await response.json()) as { error?: { message?: unknown }; message?: unknown };
    const message = payload.error?.message ?? payload.message;
    return typeof message === "string" && message.trim() ? message.trim() : null;
=======
    const payload = (await response.json()) as { message?: unknown };
    return typeof payload.message === "string" && payload.message.trim() ? payload.message.trim() : null;
>>>>>>> prd/staging
  } catch {
    return null;
  }
}

function logPaymentsLoaded(loteId: string, source: "api" | "mock", paymentCount: number) {
  console.info("[approvals] client batch payments loaded", {
    loteId,
    source,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: source === "mock",
    paymentCount
  });
}
