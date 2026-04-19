import { getPagnetImportedPaymentsDemo } from "@/lib/treasury-pagnet-demo-data";
import { type PagnetImportedPayment } from "@/types/treasury";

export async function getPagnetImportedPayments(): Promise<PagnetImportedPayment[]> {
  return getPagnetImportedPaymentsDemo();
}
