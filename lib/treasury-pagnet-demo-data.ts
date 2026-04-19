import { type PagnetImportedPayment } from "@/types/treasury";

const pagnetImportedPayments: PagnetImportedPayment[] = [
  { id: "PGN-20260418-001", importedAt: "2026-04-18T08:12:00", amount: 1840.55, customerName: "Camila Bezerra Nogueira", customerDocument: "23844599871", paymentType: "RESGATE", paymentDate: "2026-04-22" },
  { id: "PGN-20260418-002", importedAt: "2026-04-18T08:12:00", amount: 5220.00, customerName: "Rafael dos Santos Lima", customerDocument: "34811222000155", paymentType: "SORTEIO", paymentDate: "2026-04-23" },
  { id: "PGN-20260418-003", importedAt: "2026-04-18T11:04:00", amount: 970.40, customerName: "Marta Silva Ferreira", customerDocument: "44011866735", paymentType: "RESGATE", paymentDate: "2026-04-24" },
  { id: "PGN-20260417-001", importedAt: "2026-04-17T09:21:00", amount: 12660.18, customerName: "Eduardo Costa Pinheiro", customerDocument: "09234455019", paymentType: "SORTEIO", paymentDate: "2026-04-22" },
  { id: "PGN-20260417-002", importedAt: "2026-04-17T09:21:00", amount: 2150.00, customerName: "Aline Castro Mendes", customerDocument: "55088777132", paymentType: "RESGATE", paymentDate: "2026-04-25" },
  { id: "PGN-20260416-001", importedAt: "2026-04-16T07:58:00", amount: 3400.99, customerName: "Rodrigo Amaral Neves", customerDocument: "12477866002", paymentType: "RESGATE", paymentDate: "2026-04-20" },
  { id: "PGN-20260416-002", importedAt: "2026-04-16T13:10:00", amount: 7800.00, customerName: "Viviane Matos de Souza", customerDocument: "31122544000103", paymentType: "SORTEIO", paymentDate: "2026-04-21" },
  { id: "PGN-20260415-001", importedAt: "2026-04-15T10:05:00", amount: 1125.40, customerName: "Thiago Martins Araujo", customerDocument: "81922311409", paymentType: "RESGATE", paymentDate: "2026-04-19" },
  { id: "PGN-20260415-002", importedAt: "2026-04-15T10:05:00", amount: 25890.77, customerName: "Marina Lopes Carvalho", customerDocument: "67344122077", paymentType: "SORTEIO", paymentDate: "2026-04-22" },
  { id: "PGN-20260414-001", importedAt: "2026-04-14T08:42:00", amount: 1990.00, customerName: "Beatriz Nascimento Prado", customerDocument: "30418877099", paymentType: "RESGATE", paymentDate: "2026-04-18" },
  { id: "PGN-20260414-002", importedAt: "2026-04-14T08:42:00", amount: 4560.19, customerName: "Fernando Pires Tavares", customerDocument: "17422388070", paymentType: "RESGATE", paymentDate: "2026-04-22" },
  { id: "PGN-20260413-001", importedAt: "2026-04-13T12:34:00", amount: 6020.00, customerName: "Patricia Duarte Lins", customerDocument: "77899134000166", paymentType: "SORTEIO", paymentDate: "2026-04-18" },
  { id: "PGN-20260412-001", importedAt: "2026-04-12T09:10:00", amount: 845.00, customerName: "Gustavo Henrique Vidal", customerDocument: "92877122034", paymentType: "RESGATE", paymentDate: "2026-04-17" },
  { id: "PGN-20260411-001", importedAt: "2026-04-11T09:52:00", amount: 10340.00, customerName: "Sabrina de Oliveira Mello", customerDocument: "11788233000190", paymentType: "SORTEIO", paymentDate: "2026-04-17" },
  { id: "PGN-20260410-001", importedAt: "2026-04-10T14:28:00", amount: 2750.35, customerName: "Luciana Teixeira Gomes", customerDocument: "71422566088", paymentType: "RESGATE", paymentDate: "2026-04-15" },
  { id: "PGN-20260409-001", importedAt: "2026-04-09T07:40:00", amount: 14980.00, customerName: "Carlos Roberto Fagundes", customerDocument: "66377155040", paymentType: "SORTEIO", paymentDate: "2026-04-15" },
  { id: "PGN-20260408-001", importedAt: "2026-04-08T11:47:00", amount: 1220.00, customerName: "Monique Ribeiro Chagas", customerDocument: "20844777031", paymentType: "RESGATE", paymentDate: "2026-04-14" },
  { id: "PGN-20260407-001", importedAt: "2026-04-07T08:16:00", amount: 3325.80, customerName: "Leonardo Campos Freitas", customerDocument: "45866322055", paymentType: "RESGATE", paymentDate: "2026-04-13" },
  { id: "PGN-20260406-001", importedAt: "2026-04-06T10:02:00", amount: 8870.12, customerName: "Juliana Farias Monteiro", customerDocument: "51288744000109", paymentType: "SORTEIO", paymentDate: "2026-04-12" },
  { id: "PGN-20260405-001", importedAt: "2026-04-05T15:11:00", amount: 910.90, customerName: "Renata Alves Paes", customerDocument: "13866099028", paymentType: "RESGATE", paymentDate: "2026-04-10" },
  { id: "PGN-20260404-001", importedAt: "2026-04-04T09:32:00", amount: 11880.43, customerName: "Bruno Cezar Moreira", customerDocument: "39544777013", paymentType: "SORTEIO", paymentDate: "2026-04-10" },
  { id: "PGN-20260403-001", importedAt: "2026-04-03T08:04:00", amount: 1540.00, customerName: "Carolina Andrade Pinho", customerDocument: "20733588042", paymentType: "RESGATE", paymentDate: "2026-04-09" },
  { id: "PGN-20260402-001", importedAt: "2026-04-02T11:22:00", amount: 6715.99, customerName: "Otavio Figueiredo Duarte", customerDocument: "52211477000148", paymentType: "SORTEIO", paymentDate: "2026-04-08" }
];

export function getPagnetImportedPaymentsDemo() {
  return [...pagnetImportedPayments].sort((left, right) => right.importedAt.localeCompare(left.importedAt));
}
