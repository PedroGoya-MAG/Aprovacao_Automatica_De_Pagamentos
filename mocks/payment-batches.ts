import { type PaymentBatch } from "@/types/payments";

export const mockPaymentBatches: PaymentBatch[] = [
  {
    id: "batch-001",
    batchNumber: "2026-0313-001",
    benefitType: "SORTEIO",
    competence: "Mar/2026",
    scheduledAt: "2026-03-17",
    payments: [
      {
        id: "payment-001",
        beneficiaryName: "Ana Paula Martins",
        document: "12345678901",
        grossAmount: 1980.45,
        paymentDate: "2026-03-17",
        status: "PENDING",
        reference: "Sorteio trimestral - campanha Sul"
      },
      {
        id: "payment-002",
        beneficiaryName: "Carlos Eduardo Lima",
        document: "98765432100",
        grossAmount: 2540.1,
        paymentDate: "2026-03-17",
        status: "PENDING",
        reference: "Sorteio trimestral - campanha Sul"
      },
      {
        id: "payment-003",
        beneficiaryName: "Marina Ferreira Alves",
        document: "11222333444",
        grossAmount: 1750,
        paymentDate: "2026-03-17",
        status: "APPROVED",
        reference: "Sorteio trimestral - campanha Sul"
      }
    ]
  },
  {
    id: "batch-002",
    batchNumber: "2026-0313-002",
    benefitType: "RESGATE",
    competence: "Mar/2026",
    scheduledAt: "2026-03-18",
    payments: [
      {
        id: "payment-004",
        beneficiaryName: "Juliana Ribeiro Santos",
        document: "44555666777",
        grossAmount: 4210.3,
        paymentDate: "2026-03-18",
        status: "PENDING",
        reference: "Resgate de pontos premium"
      },
      {
        id: "payment-005",
        beneficiaryName: "Pedro Henrique Costa",
        document: "55666777888",
        grossAmount: 3899.9,
        paymentDate: "2026-03-18",
        status: "REJECTED",
        reference: "Resgate de pontos premium"
      },
      {
        id: "payment-006",
        beneficiaryName: "Rosana Duarte Melo",
        document: "66777888999",
        grossAmount: 2660.74,
        paymentDate: "2026-03-18",
        status: "PENDING",
        reference: "Resgate de pontos premium"
      }
    ]
  },
  {
    id: "batch-003",
    batchNumber: "2026-0313-003",
    benefitType: "SORTEIO",
    competence: "Mar/2026",
    scheduledAt: "2026-03-19",
    payments: [
      {
        id: "payment-007",
        beneficiaryName: "Bruno Fagundes Rocha",
        document: "77888999000",
        grossAmount: 5100,
        paymentDate: "2026-03-19",
        status: "PENDING",
        reference: "Sorteio nacional de incentivo"
      },
      {
        id: "payment-008",
        beneficiaryName: "Elisa Moreira Prado",
        document: "88999000111",
        grossAmount: 6100,
        paymentDate: "2026-03-19",
        status: "PENDING",
        reference: "Sorteio nacional de incentivo"
      },
      {
        id: "payment-009",
        beneficiaryName: "Leandro Pires Nogueira",
        document: "99000111222",
        grossAmount: 4720.89,
        paymentDate: "2026-03-19",
        status: "PENDING",
        reference: "Sorteio nacional de incentivo"
      },
      {
        id: "payment-010",
        beneficiaryName: "Tais Regina Bezerra",
        document: "00111222333",
        grossAmount: 1500,
        paymentDate: "2026-03-19",
        status: "REJECTED",
        reference: "Sorteio nacional de incentivo"
      }
    ]
  },
  {
    id: "batch-004",
    batchNumber: "2026-0313-004",
    benefitType: "RESGATE",
    competence: "Mar/2026",
    scheduledAt: "2026-03-20",
    payments: [
      {
        id: "payment-011",
        beneficiaryName: "Fernanda Barros Cunha",
        document: "12312312312",
        grossAmount: 3490.5,
        paymentDate: "2026-03-20",
        status: "APPROVED",
        reference: "Resgate mensal parceiro ouro"
      },
      {
        id: "payment-012",
        beneficiaryName: "Gustavo Vinicius Andrade",
        document: "23123123123",
        grossAmount: 2975.35,
        paymentDate: "2026-03-20",
        status: "PENDING",
        reference: "Resgate mensal parceiro ouro"
      },
      {
        id: "payment-013",
        beneficiaryName: "Helena Borges Tavares",
        document: "32132132132",
        grossAmount: 1880,
        paymentDate: "2026-03-20",
        status: "PENDING",
        reference: "Resgate mensal parceiro ouro"
      }
    ]
  }
];

