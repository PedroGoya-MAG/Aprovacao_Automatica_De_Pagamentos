import { getPagnetImportedPaymentsDemo } from "@/lib/treasury-pagnet-demo-data";
import { n8nGet } from "@/lib/n8n-api";
import { isDemoMode } from "@/lib/runtime-mode";
import { normalizeDateValue } from "@/lib/formatters";
import { type PagnetImportedPayment } from "@/types/treasury";

export async function getPagnetImportedPayments(): Promise<PagnetImportedPayment[]> {
  if (isDemoMode()) {
    return getPagnetImportedPaymentsDemo();
  }

  const rawData = await n8nGet<unknown>("treasury", "summary");

  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData
    .map((item, index) => normalizePagnetImportedPayment(item, index))
    .sort((left, right) => (right.importedAt ?? "").localeCompare(left.importedAt ?? ""));
}

function normalizePagnetImportedPayment(rawData: unknown, index: number): PagnetImportedPayment {
  const payload = typeof rawData === "object" && rawData !== null ? (rawData as Record<string, unknown>) : {};

  return {
    id: pickText(payload.id, `pagnet-${index + 1}`),
    importedAt: firstDate("payment.importedAt", payload.importedAt, payload.dataCriacao, payload.datePaymentRegistration),
    amount: Number(payload.amount ?? 0),
    customerName: pickText(payload.customerName, "Cliente nao informado"),
    customerDocument: pickText(payload.customerDocument, "-"),
    paymentType: payload.paymentType === "SORTEIO" ? "SORTEIO" : "RESGATE",
    paymentDate: firstDate("payment.paymentDate", payload.paymentDate, payload.dataPagamento, payload.datePayment, payload.dueDate)
  };
}

function firstDate(fieldName: string, ...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeDateValue(value as string | number | Date | null | undefined, fieldName);
    if (normalized) return normalized;
  }
  return null;
}

function pickText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}
