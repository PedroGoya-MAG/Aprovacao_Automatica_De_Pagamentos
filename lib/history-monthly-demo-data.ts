import { normalizeText } from "@/lib/utils";
import {
  type HistoricalBatch,
  type HistoricalPayment,
  type HistoryBatchOutcome,
  type HistorySummary,
  type MonthlyOverview,
  type MonthlyReasonBreakdown,
  type MonthlySeriesPoint,
  type SuspicionReasonCode
} from "@/types/insights";
import { type BenefitType, type PaymentStatus } from "@/types/payments";

type BatchSeed = {
  id: string;
  batchNumber: string;
  benefitType: BenefitType;
  competence: string;
  scheduledAt: string;
  processedAt: string;
  payments: Array<{
    id: string;
    beneficiaryName: string;
    document: string;
    grossAmount: number;
    paymentDate: string;
    status: PaymentStatus;
    reference: string;
    observations?: string;
    suspicionReasons?: SuspicionReasonCode[];
  }>;
};

const historicalSeeds: BatchSeed[] = [
  {
    id: "LOT-RES-20260305",
    batchNumber: "LOT-RES-20260305",
    benefitType: "RESGATE",
    competence: "Mar/2026",
    scheduledAt: "2026-03-05",
    processedAt: "2026-03-05T11:20:00",
    payments: [
      {
        id: "3101",
        beneficiaryName: "Patricia Soares Lima",
        document: "12345678901",
        grossAmount: 420.8,
        paymentDate: "2026-03-05",
        status: "APPROVED",
        reference: "RES-3101",
        observations: "Pagamento liberado no fechamento do lote.",
        suspicionReasons: ["HIGH_VALUE"]
      },
      {
        id: "3102",
        beneficiaryName: "Marcelo Nogueira Alves",
        document: "23456789012",
        grossAmount: 140.2,
        paymentDate: "2026-03-05",
        status: "APPROVED",
        reference: "RES-3102"
      },
      {
        id: "3103",
        beneficiaryName: "Marcelo Nogueira Alves",
        document: "23456789012",
        grossAmount: 138.4,
        paymentDate: "2026-03-05",
        status: "REJECTED",
        reference: "RES-3103",
        observations: "Documento divergente na conciliacao final.",
        suspicionReasons: ["DUPLICATE_BENEFICIARY"]
      },
      {
        id: "3104",
        beneficiaryName: "Vanessa Cardoso Pires",
        document: "34567890123",
        grossAmount: 119.6,
        paymentDate: "2026-03-05",
        status: "APPROVED",
        reference: "RES-3104"
      }
    ]
  },
  {
    id: "LOT-SOR-20260312",
    batchNumber: "LOT-SOR-20260312",
    benefitType: "SORTEIO",
    competence: "Mar/2026",
    scheduledAt: "2026-03-12",
    processedAt: "2026-03-12T15:05:00",
    payments: [
      {
        id: "3201",
        beneficiaryName: "Camila Furtado Rocha",
        document: "45678901234",
        grossAmount: 210,
        paymentDate: "2026-03-12",
        status: "APPROVED",
        reference: "SOR-3201"
      },
      {
        id: "3202",
        beneficiaryName: "Camila Furtado Rocha",
        document: "45678901234",
        grossAmount: 205,
        paymentDate: "2026-03-12",
        status: "APPROVED",
        reference: "SOR-3202",
        suspicionReasons: ["DUPLICATE_BENEFICIARY", "DOUBLE_CONCENTRATION"]
      },
      {
        id: "3203",
        beneficiaryName: "Leandro Araujo Teles",
        document: "56789012345",
        grossAmount: 95,
        paymentDate: "2026-03-12",
        status: "APPROVED",
        reference: "SOR-3203",
        suspicionReasons: ["DOUBLE_CONCENTRATION"]
      }
    ]
  },
  {
    id: "LOT-RES-20260221",
    batchNumber: "LOT-RES-20260221",
    benefitType: "RESGATE",
    competence: "Fev/2026",
    scheduledAt: "2026-02-21",
    processedAt: "2026-02-21T10:48:00",
    payments: [
      {
        id: "3001",
        beneficiaryName: "Renata Barbosa Lima",
        document: "67890123456",
        grossAmount: 165.3,
        paymentDate: "2026-02-21",
        status: "APPROVED",
        reference: "RES-3001"
      },
      {
        id: "3002",
        beneficiaryName: "Cesar Mendes Silva",
        document: "78901234567",
        grossAmount: 160.7,
        paymentDate: "2026-02-21",
        status: "APPROVED",
        reference: "RES-3002"
      },
      {
        id: "3003",
        beneficiaryName: "Bianca Torres Nunes",
        document: "89012345678",
        grossAmount: 158.9,
        paymentDate: "2026-02-21",
        status: "REJECTED",
        reference: "RES-3003",
        observations: "Conta de destino invalida na confirmacao final."
      }
    ]
  },
  {
    id: "LOT-SOR-20260228",
    batchNumber: "LOT-SOR-20260228",
    benefitType: "SORTEIO",
    competence: "Fev/2026",
    scheduledAt: "2026-02-28",
    processedAt: "2026-02-28T16:20:00",
    payments: [
      {
        id: "3051",
        beneficiaryName: "Helena Pires Gomes",
        document: "90123456789",
        grossAmount: 510,
        paymentDate: "2026-02-28",
        status: "APPROVED",
        reference: "SOR-3051",
        suspicionReasons: ["HIGH_VALUE", "SINGLE_CONCENTRATION"]
      },
      {
        id: "3052",
        beneficiaryName: "Jorge Luiz Moraes",
        document: "01234567890",
        grossAmount: 90,
        paymentDate: "2026-02-28",
        status: "APPROVED",
        reference: "SOR-3052"
      },
      {
        id: "3053",
        beneficiaryName: "Priscila Neves Cardoso",
        document: "11234567890",
        grossAmount: 75,
        paymentDate: "2026-02-28",
        status: "APPROVED",
        reference: "SOR-3053"
      }
    ]
  },
  {
    id: "LOT-RES-20260117",
    batchNumber: "LOT-RES-20260117",
    benefitType: "RESGATE",
    competence: "Jan/2026",
    scheduledAt: "2026-01-17",
    processedAt: "2026-01-17T09:55:00",
    payments: [
      {
        id: "2901",
        beneficiaryName: "Tatiane Moura Pinto",
        document: "21234567890",
        grossAmount: 132.2,
        paymentDate: "2026-01-17",
        status: "APPROVED",
        reference: "RES-2901"
      },
      {
        id: "2902",
        beneficiaryName: "Andre Siqueira Ramos",
        document: "31234567890",
        grossAmount: 129.4,
        paymentDate: "2026-01-17",
        status: "APPROVED",
        reference: "RES-2902"
      },
      {
        id: "2903",
        beneficiaryName: "Karla Duarte Freitas",
        document: "41234567890",
        grossAmount: 131.8,
        paymentDate: "2026-01-17",
        status: "APPROVED",
        reference: "RES-2903"
      }
    ]
  }
];

const monthLabels: Record<string, string> = {
  "2026-01": "Janeiro de 2026",
  "2026-02": "Fevereiro de 2026",
  "2026-03": "Marco de 2026"
};

export function getHistoricalBatchesDemo() {
  return historicalSeeds.map(buildHistoricalBatch);
}

export function getHistorySummaryDemo(): HistorySummary {
  return summarizeHistoricalBatches(getHistoricalBatchesDemo());
}

export function getMonthlyOverviewDemo(month: string): MonthlyOverview {
  const batches = getHistoricalBatchesDemo().filter((batch) => getMonthKey(batch.scheduledAt) === month);
  const payments = batches.flatMap((batch) => batch.payments);
  const reasons = buildReasonBreakdown(payments);

  return {
    totals: {
      month,
      monthLabel: monthLabels[month] ?? month,
      totalReceivedAmount: payments.reduce((total, payment) => total + payment.grossAmount, 0),
      totalReceivedCount: payments.length,
      totalApprovedAmount: payments.filter((payment) => payment.status === "APPROVED").reduce((total, payment) => total + payment.grossAmount, 0),
      totalApprovedCount: payments.filter((payment) => payment.status === "APPROVED").length,
      totalRejectedAmount: payments.filter((payment) => payment.status === "REJECTED").reduce((total, payment) => total + payment.grossAmount, 0),
      totalRejectedCount: payments.filter((payment) => payment.status === "REJECTED").length,
      totalSuspiciousAmount: payments.filter((payment) => payment.isSuspicious).reduce((total, payment) => total + payment.grossAmount, 0),
      totalSuspiciousCount: payments.filter((payment) => payment.isSuspicious).length
    },
    reasons,
    dailySeries: buildDailySeries(payments),
    weeklySeries: buildWeeklySeries(payments)
  };
}

export function getAvailableHistoryCompetences() {
  return Array.from(new Set(getHistoricalBatchesDemo().map((batch) => batch.competence)));
}

export function getAvailableMonthlyKeys() {
  return Object.entries(monthLabels).map(([value, label]) => ({ value, label }));
}

export function searchHistoricalBatches(query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return getHistoricalBatchesDemo();
  }

  return getHistoricalBatchesDemo().filter((batch) => {
    const matchesBatch =
      normalizeText(batch.batchNumber).includes(normalizedQuery) || normalizeText(batch.id).includes(normalizedQuery);

    if (matchesBatch) {
      return true;
    }

    return batch.payments.some(
      (payment) =>
        normalizeText(payment.beneficiaryName).includes(normalizedQuery) ||
        normalizeText(payment.document).includes(normalizedQuery)
    );
  });
}

export function summarizeHistoricalBatches(batches: HistoricalBatch[]): HistorySummary {
  const payments = batches.flatMap((batch) => batch.payments);

  return {
    processedBatchCount: batches.length,
    approvedBatchCount: batches.filter((batch) => batch.batchOutcome === "APPROVED").length,
    rejectedBatchCount: batches.filter((batch) => batch.batchOutcome === "REJECTED").length,
    mixedBatchCount: batches.filter((batch) => batch.batchOutcome === "MIXED").length,
    pendingBatchCount: batches.filter((batch) => batch.batchOutcome === "PENDING").length,
    processedPaymentCount: payments.length,
    approvedPaymentCount: payments.filter((payment) => payment.status === "APPROVED").length,
    rejectedPaymentCount: payments.filter((payment) => payment.status === "REJECTED").length,
    suspiciousPaymentCount: payments.filter((payment) => payment.isSuspicious).length,
    processedTotalAmount: payments.reduce((total, payment) => total + payment.grossAmount, 0),
    totalApprovedAmount: payments.filter((payment) => payment.status === "APPROVED").reduce((total, payment) => total + payment.grossAmount, 0),
    totalRejectedAmount: payments.filter((payment) => payment.status === "REJECTED").reduce((total, payment) => total + payment.grossAmount, 0)
  };
}

function buildHistoricalBatch(seed: BatchSeed): HistoricalBatch {
  const payments = seed.payments.map((payment) => buildHistoricalPayment(seed, payment));
  const approvedCount = payments.filter((payment) => payment.status === "APPROVED").length;
  const rejectedCount = payments.filter((payment) => payment.status === "REJECTED").length;
  const pendingCount = payments.filter((payment) => payment.status === "PENDING").length;
  const approvedAmount = payments.filter((payment) => payment.status === "APPROVED").reduce((total, payment) => total + payment.grossAmount, 0);
  const rejectedAmount = payments.filter((payment) => payment.status === "REJECTED").reduce((total, payment) => total + payment.grossAmount, 0);
  const batchOutcome = getHistoryBatchOutcome(approvedCount, rejectedCount, pendingCount);

  return {
    id: seed.id,
    batchNumber: seed.batchNumber,
    benefitType: seed.benefitType,
    competence: seed.competence,
    scheduledAt: seed.scheduledAt,
    processedAt: seed.processedAt,
    status: pendingCount > 0 ? "PENDING" : rejectedCount > 0 && approvedCount === 0 ? "REJECTED" : "APPROVED",
    batchOutcome,
    paymentCount: payments.length,
    totalAmount: payments.reduce((total, payment) => total + payment.grossAmount, 0),
    approvedAmount,
    rejectedAmount,
    approvedCount,
    rejectedCount,
    pendingCount,
    payments
  };
}

function buildHistoricalPayment(seed: BatchSeed, payment: BatchSeed["payments"][number]): HistoricalPayment {
  return {
    id: payment.id,
    loteId: seed.id,
    batchNumber: seed.batchNumber,
    beneficiaryName: payment.beneficiaryName,
    document: payment.document,
    grossAmount: payment.grossAmount,
    paymentDate: payment.paymentDate,
    benefitType: seed.benefitType,
    status: payment.status,
    reference: payment.reference,
    observations: payment.observations,
    processedAt: seed.processedAt,
    isSuspicious: (payment.suspicionReasons ?? []).length > 0,
    suspicionReasons: payment.suspicionReasons ?? []
  };
}

function getHistoryBatchOutcome(approvedCount: number, rejectedCount: number, pendingCount: number): HistoryBatchOutcome {
  if (pendingCount > 0) {
    return "PENDING";
  }

  if (approvedCount > 0 && rejectedCount > 0) {
    return "MIXED";
  }

  if (approvedCount > 0) {
    return "APPROVED";
  }

  return "REJECTED";
}

function buildReasonBreakdown(payments: HistoricalPayment[]): MonthlyReasonBreakdown[] {
  const reasonMap = new Map<SuspicionReasonCode, MonthlyReasonBreakdown>();

  payments.forEach((payment) => {
    payment.suspicionReasons.forEach((reason) => {
      const current = reasonMap.get(reason) ?? { reason, count: 0, amount: 0 };
      current.count += 1;
      current.amount += payment.grossAmount;
      reasonMap.set(reason, current);
    });
  });

  return Array.from(reasonMap.values()).sort((left, right) => right.count - left.count);
}

function buildDailySeries(payments: HistoricalPayment[]): MonthlySeriesPoint[] {
  return aggregateSeries(
    payments,
    (payment) => payment.paymentDate,
    (value) => {
      const [, month, day] = value.split("-");
      return `${day}/${month}`;
    }
  );
}

function buildWeeklySeries(payments: HistoricalPayment[]): MonthlySeriesPoint[] {
  return aggregateSeries(
    payments,
    (payment) => {
      const date = new Date(`${payment.paymentDate}T12:00:00`);
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const weekIndex = Math.floor((date.getDate() + firstDay.getDay() - 1) / 7) + 1;
      return `${date.getFullYear()}-${date.getMonth() + 1}-S${weekIndex}`;
    },
    (value) => `Semana ${value.split("S")[1]}`
  );
}

function aggregateSeries(
  payments: HistoricalPayment[],
  getKey: (payment: HistoricalPayment) => string,
  getLabel: (key: string) => string
): MonthlySeriesPoint[] {
  const aggregated = new Map<string, MonthlySeriesPoint>();

  payments.forEach((payment) => {
    const key = getKey(payment);
    const current = aggregated.get(key) ?? { label: getLabel(key), count: 0, amount: 0 };
    current.count += 1;
    current.amount += payment.grossAmount;
    aggregated.set(key, current);
  });

  return Array.from(aggregated.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([, point]) => point);
}

function getMonthKey(value: string) {
  return value.slice(0, 7);
}
