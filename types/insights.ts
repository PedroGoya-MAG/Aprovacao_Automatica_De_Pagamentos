import { type BenefitType, type Payment, type PaymentBatch, type PaymentStatus } from "@/types/payments";

export type SuspicionReasonCode = "HIGH_VALUE" | "DUPLICATE_BENEFICIARY" | "SINGLE_CONCENTRATION" | "DOUBLE_CONCENTRATION";
export type HistoryBatchOutcome = "APPROVED" | "REJECTED" | "MIXED" | "PENDING";

export type HistoricalPayment = Omit<Payment, "loteId" | "benefitType" | "batchNumber"> & {
  loteId: string;
  benefitType: BenefitType;
  batchNumber: string;
  processedAt: string;
  isSuspicious: boolean;
  suspicionReasons: SuspicionReasonCode[];
};

export type HistoricalBatch = Omit<PaymentBatch, "status" | "paymentCount" | "totalAmount" | "approvedCount" | "rejectedCount" | "pendingCount" | "payments"> & {
  status: PaymentStatus;
  batchOutcome: HistoryBatchOutcome;
  paymentCount: number;
  totalAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  payments: HistoricalPayment[];
  processedAt: string;
};

export type HistorySummary = {
  processedBatchCount: number;
  approvedBatchCount: number;
  rejectedBatchCount: number;
  mixedBatchCount: number;
  pendingBatchCount: number;
  processedPaymentCount: number;
  approvedPaymentCount: number;
  rejectedPaymentCount: number;
  suspiciousPaymentCount: number;
  processedTotalAmount: number;
  totalApprovedAmount: number;
  totalRejectedAmount: number;
};

export type MonthlyTotals = {
  month: string;
  monthLabel: string;
  totalReceivedAmount: number;
  totalReceivedCount: number;
  totalApprovedAmount: number;
  totalApprovedCount: number;
  totalRejectedAmount: number;
  totalRejectedCount: number;
  totalSuspiciousAmount: number;
  totalSuspiciousCount: number;
};

export type MonthlyReasonBreakdown = {
  reason: SuspicionReasonCode;
  count: number;
  amount: number;
};

export type MonthlySeriesPoint = {
  label: string;
  count: number;
  amount: number;
};

export type MonthlyOverview = {
  totals: MonthlyTotals;
  reasons: MonthlyReasonBreakdown[];
  dailySeries: MonthlySeriesPoint[];
  weeklySeries: MonthlySeriesPoint[];
};
