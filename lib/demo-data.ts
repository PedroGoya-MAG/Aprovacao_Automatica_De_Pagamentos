import { type BenefitType, type Lote, type Payment, type PaymentStatus, type ResumoDashboard } from "@/types/payments";

type DashboardSummaryFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
  search?: string;
};

type LotesFilters = {
  benefitType?: "ALL" | BenefitType;
  status?: "ALL" | PaymentStatus;
};

const demoPayments: Payment[] = [
  {
    id: "994",
    loteId: "LOT-SOR-20140324",
    batchNumber: "LOT-SOR-20140324",
    beneficiaryName: "Mariana Costa Lima",
    document: "12345678901",
    grossAmount: 120.5,
    paymentDate: "2014-03-24",
    benefitType: "SORTEIO",
    status: "PENDING",
    reference: "SOR-20140324-994",
    observations: "Pagamento pronto para aprovacao executiva."
  },
  {
    id: "995",
    loteId: "LOT-SOR-20140324",
    batchNumber: "LOT-SOR-20140324",
    beneficiaryName: "Eduardo Pereira Nunes",
    document: "23456789012",
    grossAmount: 95.3,
    paymentDate: "2014-03-24",
    benefitType: "SORTEIO",
    status: "PENDING",
    reference: "SOR-20140324-995",
    observations: "Beneficio conferido e aguardando decisao."
  },
  {
    id: "996",
    loteId: "LOT-SOR-20140324",
    batchNumber: "LOT-SOR-20140324",
    beneficiaryName: "Patricia Almeida Rocha",
    document: "34567890123",
    grossAmount: 88.9,
    paymentDate: "2014-03-24",
    benefitType: "SORTEIO",
    status: "PENDING",
    reference: "SOR-20140324-996",
    observations: "Documento validado para liberacao."
  },
  {
    id: "997",
    loteId: "LOT-SOR-20140324",
    batchNumber: "LOT-SOR-20140324",
    beneficiaryName: "Bruno Henrique Matos",
    document: "45678901234",
    grossAmount: 102.1,
    paymentDate: "2014-03-24",
    benefitType: "SORTEIO",
    status: "PENDING",
    reference: "SOR-20140324-997",
    observations: "Pagamento preparado para lote do dia."
  },
  {
    id: "1018",
    loteId: "LOT-SOR-20140324",
    batchNumber: "LOT-SOR-20140324",
    beneficiaryName: "Aline Ferreira Gomes",
    document: "56789012345",
    grossAmount: 130.75,
    paymentDate: "2014-03-24",
    benefitType: "SORTEIO",
    status: "PENDING",
    reference: "SOR-20140324-1018",
    observations: "Pagamento estrategico para demonstracao."
  },
  {
    id: "1094",
    loteId: "LOT-RES-20131002",
    batchNumber: "LOT-RES-20131002",
    beneficiaryName: "Juliana Ribeiro Santos",
    document: "44555666777",
    grossAmount: 73.79,
    paymentDate: "2013-10-02",
    benefitType: "RESGATE",
    status: "PENDING",
    reference: "120059400",
    observations: "Pagamento pendente de processamento."
  },
  {
    id: "1095",
    loteId: "LOT-RES-20131002",
    batchNumber: "LOT-RES-20131002",
    beneficiaryName: "Carlos Eduardo Silva",
    document: "55666777888",
    grossAmount: 73.79,
    paymentDate: "2013-10-02",
    benefitType: "RESGATE",
    status: "PENDING",
    reference: "120059401",
    observations: "Pagamento em validacao final."
  },
  {
    id: "1201",
    loteId: "LOT-RES-20140410",
    batchNumber: "LOT-RES-20140410",
    beneficiaryName: "Renata Souza Martins",
    document: "66777888999",
    grossAmount: 220.15,
    paymentDate: "2014-04-10",
    benefitType: "RESGATE",
    status: "APPROVED",
    reference: "RES-20140410-1201",
    observations: "Pagamento ja aprovado e liberado."
  },
  {
    id: "1202",
    loteId: "LOT-RES-20140410",
    batchNumber: "LOT-RES-20140410",
    beneficiaryName: "Leonardo Batista Costa",
    document: "77888999000",
    grossAmount: 180.4,
    paymentDate: "2014-04-10",
    benefitType: "RESGATE",
    status: "REJECTED",
    reference: "RES-20140410-1202",
    observations: "Pagamento rejeitado para revisao cadastral."
  }
];

const demoBatchBase = [
  {
    id: "LOT-SOR-20140324",
    batchNumber: "LOT-SOR-20140324",
    benefitType: "SORTEIO" as const,
    competence: "Mar/2014",
    scheduledAt: "2014-03-24"
  },
  {
    id: "LOT-RES-20131002",
    batchNumber: "LOT-RES-20131002",
    benefitType: "RESGATE" as const,
    competence: "Out/2013",
    scheduledAt: "2013-10-02"
  },
  {
    id: "LOT-RES-20140410",
    batchNumber: "LOT-RES-20140410",
    benefitType: "RESGATE" as const,
    competence: "Abr/2014",
    scheduledAt: "2014-04-10"
  }
];

export function getDemoLotes(filters: LotesFilters = {}): Lote[] {
  return demoBatchBase
    .map((batch) => buildDemoBatch(batch.id))
    .filter((batch) => filters.benefitType === undefined || filters.benefitType === "ALL" || batch.benefitType === filters.benefitType)
    .filter((batch) => filters.status === undefined || filters.status === "ALL" || matchesBatchStatus(batch, filters.status));
}

export function getDemoResumoDashboard(filters: DashboardSummaryFilters = {}): ResumoDashboard {
  const batches = getDemoLotes({
    benefitType: filters.benefitType,
    status: filters.status
  });

  return {
    pendingBatchCount: batches.filter((batch) => (batch.pendingCount ?? 0) > 0).length,
    pendingPaymentCount: batches.reduce((total, batch) => total + (batch.pendingCount ?? 0), 0),
    pendingTotalAmount: batches.reduce((total, batch) => {
      const pendingTotal = (batch.payments ?? [])
        .filter((payment) => payment.status === "PENDING")
        .reduce((subtotal, payment) => subtotal + payment.grossAmount, 0);

      return total + pendingTotal;
    }, 0),
    resgateBatchCount: batches.filter((batch) => batch.benefitType === "RESGATE").length,
    sorteioBatchCount: batches.filter((batch) => batch.benefitType === "SORTEIO").length
  };
}

export function getDemoPagamentosByLote(loteId: string): Payment[] {
  return demoPayments
    .filter((payment) => payment.loteId === loteId)
    .map((payment) => ({ ...payment }));
}

export function getDemoPagamentoById(pagamentoId: string | number): Payment | null {
  const payment = demoPayments.find((item) => item.id === String(pagamentoId));
  return payment ? { ...payment } : null;
}

export function getDemoApprovePaymentResult(pagamentoId: string | number) {
  return {
    id: String(pagamentoId),
    status: "APPROVED" as const
  };
}

export function getDemoRejectPaymentResult(pagamentoId: string | number) {
  return {
    id: String(pagamentoId),
    status: "REJECTED" as const
  };
}

export function getDemoApproveSelectedResult(loteId: string, paymentIds: string[]) {
  const pendingIds = getDemoPagamentosByLote(loteId)
    .filter((payment) => payment.status === "PENDING")
    .map((payment) => payment.id);
  const approvedPaymentIds = paymentIds.map((paymentId) => String(paymentId));
  const isFullBatch = pendingIds.length > 0 && pendingIds.every((paymentId) => approvedPaymentIds.includes(paymentId));

  return {
    loteId,
    approvedPaymentIds,
    status: isFullBatch ? ("APPROVED" as const) : ("PARTIALLY_APPROVED" as const)
  };
}

export function getDemoApproveBatchResult(loteId: string) {
  const approvedPaymentIds = getDemoPagamentosByLote(loteId)
    .filter((payment) => payment.status === "PENDING")
    .map((payment) => payment.id);

  return {
    loteId,
    status: "APPROVED" as const,
    approvedPaymentIds
  };
}

function buildDemoBatch(batchId: string): Lote {
  const base = demoBatchBase.find((batch) => batch.id === batchId);
  const payments = getDemoPagamentosByLote(batchId);
  const pendingCount = payments.filter((payment) => payment.status === "PENDING").length;
  const approvedCount = payments.filter((payment) => payment.status === "APPROVED").length;
  const rejectedCount = payments.filter((payment) => payment.status === "REJECTED").length;
  const status = pendingCount > 0 ? "PENDING" : rejectedCount > 0 ? "REJECTED" : "APPROVED";

  return {
    id: batchId,
    batchNumber: base?.batchNumber ?? batchId,
    benefitType: base?.benefitType ?? "RESGATE",
    competence: base?.competence ?? "-",
    scheduledAt: base?.scheduledAt ?? "2014-01-01",
    status,
    paymentCount: payments.length,
    totalAmount: payments.reduce((total, payment) => total + payment.grossAmount, 0),
    approvedCount,
    rejectedCount,
    pendingCount,
    payments
  };
}

function matchesBatchStatus(batch: Lote, status: PaymentStatus) {
  if ((batch.payments ?? []).length > 0) {
    return (batch.payments ?? []).some((payment) => payment.status === status);
  }

  return batch.status === status;
}
