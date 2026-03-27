"use client";

import { CircleCheckBig, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type BenefitType, type PaymentStatus } from "@/types/payments";

type FiltersBarProps = {
  filterType: "ALL" | BenefitType;
  filterStatus: "ALL" | PaymentStatus;
  search: string;
  totalResults: number;
  canApproveAll: boolean;
  processingAllVisible: boolean;
  onApproveAll: () => void;
  onFilterChange: (value: "ALL" | BenefitType) => void;
  onStatusChange: (value: "ALL" | PaymentStatus) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
};

const benefitFilters: Array<{ label: string; value: "ALL" | BenefitType }> = [
  { label: "Todos", value: "ALL" },
  { label: "Sorteio", value: "SORTEIO" },
  { label: "Resgate", value: "RESGATE" }
];

const statusFilters: Array<{ label: string; value: "ALL" | PaymentStatus }> = [
  { label: "Todos", value: "ALL" },
  { label: "Pendente", value: "PENDING" },
  { label: "Aprovado", value: "APPROVED" },
  { label: "Rejeitado", value: "REJECTED" }
];

export function FiltersBar({
  filterType,
  filterStatus,
  search,
  totalResults,
  canApproveAll,
  processingAllVisible,
  onApproveAll,
  onFilterChange,
  onStatusChange,
  onSearchChange,
  onReset
}: FiltersBarProps) {
  const hasActiveFilters = filterType !== "ALL" || filterStatus !== "ALL" || search.trim().length > 0;

  return (
    <div className="panel flex flex-col gap-5 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <SlidersHorizontal className="h-4 w-4 text-[color:var(--brand)]" />
            Filtros de operacao liberada
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            {totalResults} lote(s) exibido(s) ja liberados para decisao ou com suspeitas previamente resolvidas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4" />Limpar filtros
            </Button>
          ) : null}
          <Button type="button" variant="primary" size="sm" className="min-w-[164px] rounded-lg shadow-none" disabled={!canApproveAll || processingAllVisible} onClick={onApproveAll}>
            <CircleCheckBig className="h-4 w-4" />
            {processingAllVisible ? "Aprovando lotes..." : "Aprovar tudo"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <label className="block w-full">
          <div className="flex h-12 items-center gap-3 rounded-lg border border-[color:var(--border)] bg-white px-4 transition focus-within:border-[color:var(--brand)] focus-within:ring-2 focus-within:ring-sky-100">
            <Search className="h-4 w-4 shrink-0 self-center text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por beneficiario, documento ou ID do lote"
              className="h-full w-full border-0 bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </label>
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Escopo</p>
          <p className="mt-1 text-sm text-slate-600">
            Esta area lista apenas lotes e pagamentos prontos para decisao. Itens suspeitos pendentes de triagem ficam concentrados acima, no painel gerencial.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FilterGroup label="Tipo de beneficio" options={benefitFilters} activeValue={filterType} onSelect={onFilterChange} />
        <FilterGroup label="Status" options={statusFilters} activeValue={filterStatus} onSelect={onStatusChange} />
      </div>
    </div>
  );
}

type FilterGroupProps<TValue extends string> = {
  label: string;
  options: Array<{ label: string; value: TValue }>;
  activeValue: TValue;
  onSelect: (value: TValue) => void;
};

function FilterGroup<TValue extends string>({ label, options, activeValue, onSelect }: FilterGroupProps<TValue>) {
  return <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p><div className="flex flex-wrap gap-2">{options.map((option) => <Button key={option.value} type="button" variant={activeValue === option.value ? "primary" : "secondary"} size="sm" className={cn("min-w-[110px] justify-center rounded-full")} onClick={() => onSelect(option.value)}>{option.label}</Button>)}</div></div>;
}


