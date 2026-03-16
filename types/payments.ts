export type TipoBeneficio = "SORTEIO" | "RESGATE";
export type StatusPagamento = "PENDING" | "APPROVED" | "REJECTED";

export interface Pagamento {
  id: string;
  beneficiaryName: string;
  document: string;
  grossAmount: number;
  paymentDate: string;
  status: StatusPagamento;
  reference: string;
}

export interface Lote {
  id: string;
  batchNumber: string;
  benefitType: TipoBeneficio;
  competence: string;
  scheduledAt: string;
  payments: Pagamento[];
}

export type BenefitType = TipoBeneficio;
export type PaymentStatus = StatusPagamento;
export type Payment = Pagamento;
export type PaymentBatch = Lote;
