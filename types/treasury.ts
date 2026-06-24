import { type BenefitType } from "@/types/payments";

export interface PagnetImportedPayment {
  id: string;
  importedAt: string | null;
  amount: number;
  customerName: string;
  customerDocument: string;
  paymentType: BenefitType;
  paymentDate: string | null;
}

export interface PagnetImportFilters {
  importedFrom?: string;
  importedTo?: string;
  search?: string;
  amountMin?: number;
}

export interface PagnetImportDayGroup {
  importedDate: string;
  title: string;
  totalAmount: number;
  paymentCount: number;
  payments: PagnetImportedPayment[];
}
