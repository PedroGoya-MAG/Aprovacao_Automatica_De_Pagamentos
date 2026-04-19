"use client";

import { type ReactNode, useMemo, useState } from "react";
import { CalendarRange, Eraser, Search } from "lucide-react";

import { BenefitBadge } from "@/components/payments/benefit-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow, TableShell } from "@/components/ui/table";
import { formatCurrency, formatDate, formatDocument, formatLongDate } from "@/lib/formatters";
import { normalizeText } from "@/lib/utils";
import { type PagnetImportedPayment } from "@/types/treasury";

type TreasuryPagnetShellProps = {
  initialPayments: PagnetImportedPayment[];
};

type GroupedPayments = {
  importedDate: string;
  title: string;
  paymentCount: number;
  totalAmount: number;
  payments: PagnetImportedPayment[];
};

export function TreasuryPagnetShell({ initialPayments }: TreasuryPagnetShellProps) {
  const [importedFrom, setImportedFrom] = useState("");
  const [importedTo, setImportedTo] = useState("");
  const [search, setSearch] = useState("");
  const [amountMin, setAmountMin] = useState("");

  const hasActiveFilters =
    importedFrom.trim().length > 0 ||
    importedTo.trim().length > 0 ||
    search.trim().length > 0 ||
    amountMin.trim().length > 0;

  const latestImportedDate = useMemo(() => {
    return initialPayments.reduce((latest, payment) => {
      const current = payment.importedAt.slice(0, 10);
      return current > latest ? current : latest;
    }, initialPayments[0]?.importedAt.slice(0, 10) ?? "");
  }, [initialPayments]);

  const visiblePayments = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    const parsedAmountMin = Number(amountMin.replace(",", "."));
    const hasAmountMin = amountMin.trim().length > 0 && Number.isFinite(parsedAmountMin);
    const defaultWindowStart = latestImportedDate ? shiftDate(latestImportedDate, -14) : "";

    return initialPayments.filter((payment) => {
      const importedDate = payment.importedAt.slice(0, 10);
      const matchesDefaultWindow =
        !hasActiveFilters && latestImportedDate
          ? importedDate >= defaultWindowStart && importedDate <= latestImportedDate
          : true;
      const matchesImportedFrom = importedFrom ? importedDate >= importedFrom : true;
      const matchesImportedTo = importedTo ? importedDate <= importedTo : true;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeText(payment.customerName).includes(normalizedSearch) ||
        normalizeText(payment.customerDocument).includes(normalizedSearch);
      const matchesAmount = hasAmountMin ? payment.amount >= parsedAmountMin : true;

      return matchesDefaultWindow && matchesImportedFrom && matchesImportedTo && matchesSearch && matchesAmount;
    });
  }, [amountMin, hasActiveFilters, importedFrom, importedTo, initialPayments, latestImportedDate, search]);

  const groupedPayments = useMemo<GroupedPayments[]>(() => {
    const map = new Map<string, GroupedPayments>();

    visiblePayments.forEach((payment) => {
      const importedDate = payment.importedAt.slice(0, 10);
      const currentGroup = map.get(importedDate);

      if (currentGroup) {
        currentGroup.payments.push(payment);
        currentGroup.paymentCount += 1;
        currentGroup.totalAmount += payment.amount;
        return;
      }

      map.set(importedDate, {
        importedDate,
        title: formatLongDate(`${importedDate}T12:00:00`),
        paymentCount: 1,
        totalAmount: payment.amount,
        payments: [payment]
      });
    });

    return [...map.values()].sort((left, right) => right.importedDate.localeCompare(left.importedDate));
  }, [visiblePayments]);

  const totalVisibleAmount = visiblePayments.reduce((total, payment) => total + payment.amount, 0);

  return (
    <div className="space-y-6">
      <section className="panel px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">Tesouraria</p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">Importacoes no PagNet</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Consulte os pagamentos importados para o PagNet com leitura operacional por dia de importacao, busca rapida e filtros simples para acompanhamento do time de tesouraria.
          </p>
        </div>
      </section>

      <section className="panel px-5 py-5 sm:px-6">
        <div className="grid gap-4 xl:grid-cols-[220px_220px_minmax(0,1fr)_220px_auto] xl:items-end">
          <FilterField label="Importado de">
            <input type="date" value={importedFrom} onChange={(event) => setImportedFrom(event.target.value)} className="mag-input" />
          </FilterField>

          <FilterField label="Importado ate">
            <input type="date" value={importedTo} onChange={(event) => setImportedTo(event.target.value)} className="mag-input" />
          </FilterField>

          <FilterField label="Busca rapida por nome ou documento">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mag-input pl-10"
                placeholder="Digite nome ou documento"
              />
            </div>
          </FilterField>

          <FilterField label="Valor minimo">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountMin}
              onChange={(event) => setAmountMin(event.target.value)}
              className="mag-input"
              placeholder="Ex.: 1000"
            />
          </FilterField>

          <div className="flex justify-end xl:pb-[1px]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!hasActiveFilters}
              onClick={() => {
                setImportedFrom("");
                setImportedTo("");
                setSearch("");
                setAmountMin("");
              }}
            >
              <Eraser className="h-4 w-4" />Limpar filtros
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {!hasActiveFilters ? <span className="data-chip">Ultimos 15 dias carregados automaticamente</span> : null}
          <span className="data-chip">{visiblePayments.length} pagamento(s)</span>
          <span className="data-chip">{formatCurrency(totalVisibleAmount)}</span>
        </div>
      </section>

      <section className="space-y-4">
        {groupedPayments.length === 0 ? (
          <EmptyState
            title="Nenhuma importacao encontrada"
            description="Ajuste o periodo, a busca ou o valor minimo para consultar outros pagamentos importados no PagNet."
          />
        ) : (
          groupedPayments.map((group) => (
            <article key={group.importedDate} className="panel overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[color:var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CalendarRange className="h-4 w-4 text-[color:var(--brand)]" />
                    {group.title}
                  </div>
                  <p className="text-sm text-slate-600">Importacoes registradas no PagNet nesta data.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="data-chip">{group.paymentCount} pagamento(s)</span>
                  <span className="data-chip">{formatCurrency(group.totalAmount)}</span>
                </div>
              </div>

              <TableShell className="rounded-none border-0 shadow-none">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeaderCell>Valor</TableHeaderCell>
                        <TableHeaderCell>Nome do cliente</TableHeaderCell>
                        <TableHeaderCell>Documento do cliente</TableHeaderCell>
                        <TableHeaderCell>Tipo de pagamento</TableHeaderCell>
                        <TableHeaderCell>Data que deve ser pago</TableHeaderCell>
                      </tr>
                    </TableHead>
                    <tbody>
                      {group.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-semibold text-slate-950">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <div className="min-w-[220px]">
                              <p className="font-semibold text-slate-950">{payment.customerName}</p>
                              <p className="text-xs text-slate-500">ID {payment.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDocument(payment.customerDocument)}</TableCell>
                          <TableCell>
                            <BenefitBadge benefitType={payment.paymentType} />
                          </TableCell>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </TableShell>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-semibold">{label}</span>
      {children}
    </label>
  );
}

function shiftDate(date: string, offsetInDays: number) {
  const base = new Date(`${date}T12:00:00`);
  base.setDate(base.getDate() + offsetInDays);

  const year = base.getFullYear();
  const month = `${base.getMonth() + 1}`.padStart(2, "0");
  const day = `${base.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
