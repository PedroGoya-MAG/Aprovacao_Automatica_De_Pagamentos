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
  readOnly: boolean;
  canApproveAll: boolean;
  processingAllVisible: boolean;
  onApproveAll: () => void;
  onViewBatches: () => void;
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
  readOnly,
  canApproveAll,
  processingAllVisible,
  onApproveAll,
  onViewBatches,
  onFilterChange,
  onStatusChange,
  onSearchChange,
  onReset
}: FiltersBarProps) {
  const hasActiveFilters = filterType !== "ALL" || filterStatus !== "ALL" || search.trim().length > 0;

  return (
    <div className="panel flex flex-col gap-3 px-4 py-4 sm:px-5 2xl:gap-4 2xl:px-6 2xl:py-5">
      <div className="flex flex-col gap-3 border-b border-[color:var(--border)] pb-3 xl:flex-row xl:items-start xl:justify-between 2xl:gap-4 2xl:pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--brand-deep)]">
            <SlidersHorizontal className="h-4 w-4 text-[color:var(--brand)]" />
            Filtros de operacao liberada
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            {totalResults} lote(s) exibido(s) ja liberados para decisao ou com suspeitas previamente resolvidas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4" />Limpar filtros
            </Button>
          ) : null}
          <Button type="button" variant="secondary" className="min-w-[148px]" onClick={onViewBatches}>
            Visualizar lotes
          </Button>
          {readOnly ? (
            <span className="data-chip">Perfil somente leitura</span>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="min-w-[210px] border-emerald-700 bg-emerald-600 font-semibold text-white shadow-md hover:border-emerald-800 hover:bg-emerald-700"
              disabled={!canApproveAll || processingAllVisible}
              onClick={onApproveAll}
            >
              <CircleCheckBig className="h-4 w-4" />
              {processingAllVisible ? "Aprovando lotes..." : "Aprovar todos os lotes"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_minmax(200px,0.75fr)_minmax(200px,0.9fr)_minmax(240px,1.15fr)] xl:items-stretch">
        <label className="block w-full">
          <span className="mag-label mb-2 block">Busca</span>
          <div className="flex h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-white px-4 transition focus-within:border-[color:var(--brand)] focus-within:ring-2 focus-within:ring-[color:var(--brand-soft)]">
            <Search className="h-4 w-4 shrink-0 self-center text-[color:var(--brand)]" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por beneficiario, documento ou ID do lote"
              className="h-full w-full border-0 bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </label>
        <FilterGroup label="Tipo de beneficio" options={benefitFilters} activeValue={filterType} onSelect={onFilterChange} />
        <FilterGroup label="Status" options={statusFilters} activeValue={filterStatus} onSelect={onStatusChange} />
        <div className="rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
          <p className="mag-label">Escopo</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Esta area lista apenas lotes e pagamentos prontos para decisao. Itens suspeitos pendentes de triagem ficam concentrados acima, no painel gerencial.
          </p>
        </div>
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
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
      <p className="mag-label mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={activeValue === option.value ? "primary" : "secondary"}
            size="sm"
            className={cn("min-w-[92px] flex-1 justify-center rounded-full px-3")}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
