export type TipoBeneficio = "SORTEIO" | "RESGATE";
export type StatusPagamento = "PENDING" | "APPROVED" | "REJECTED";
export type StatusLote = "PENDING" | "PARTIALLY_APPROVED" | "APPROVED" | "REJECTED";

export interface HistoricoPagamento {
  id: string;
  paymentId: string;
  action: "CREATED" | "SENT_TO_APPROVAL" | "WAITING_DECISION" | "APPROVED" | "REJECTED";
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface Pagamento {
  id: string;
  loteId?: string;
  batchNumber?: string;
  beneficiaryName: string;
  document: string;
  grossAmount: number;
  paymentDate: string;
  benefitType?: TipoBeneficio;
  status: StatusPagamento;
  reference: string;
  observations?: string;
  history?: HistoricoPagamento[];
}

export interface Lote {
  id: string;
  batchNumber: string;
  benefitType: TipoBeneficio;
  competence: string;
  scheduledAt: string;
  status?: StatusLote;
  paymentCount?: number;
  totalAmount?: number;
  approvedCount?: number;
  rejectedCount?: number;
  pendingCount?: number;
  payments?: Pagamento[];
}

export interface ResumoDashboard {
  pendingBatchCount: number;
  pendingPaymentCount: number;
  pendingTotalAmount: number;
  resgateBatchCount: number;
  sorteioBatchCount: number;
}

export type BenefitType = TipoBeneficio;
export type PaymentStatus = StatusPagamento;
export type Payment = Pagamento;
export type PaymentBatch = Lote;