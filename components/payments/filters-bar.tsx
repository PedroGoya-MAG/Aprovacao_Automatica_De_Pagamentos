"use client";

import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type BenefitType, type PaymentStatus } from "@/types/payments";

type FiltersBarProps = {
  filterType: "ALL" | BenefitType;
  filterStatus: "ALL" | PaymentStatus;
  search: string;
  totalResults: number;
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
  onFilterChange,
  onStatusChange,
  onSearchChange,
  onReset
}: FiltersBarProps) {
  const hasActiveFilters = filterType !== "ALL" || filterStatus !== "ALL" || search.trim().length > 0;

  return (
    <div className="panel flex flex-col gap-5 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros operacionais
          </div>
          <p className="text-sm text-slate-600">{totalResults} lote(s) exibido(s) com os criterios atuais.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-[linear-gradient(135deg,rgba(22,99,214,0.12)_0%,rgba(15,118,110,0.12)_100%)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 xl:inline-flex">
            <Sparkles className="mr-2 h-4 w-4" />
            Atualizacao em tempo real
          </span>
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4" />
              Limpar filtros
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <label className="relative block w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por beneficiario, documento ou ID do lote"
            className="h-12 w-full rounded-2xl border border-sky-100 bg-white/95 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-[color:var(--brand)] focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <div className="rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(22,99,214,0.05)_0%,rgba(15,118,110,0.07)_100%)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Escopo da busca</p>
          <p className="mt-1 text-sm text-slate-600">
            Nome do beneficiario, documento e identificadores do lote respondem automaticamente.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FilterGroup
          label="Tipo de beneficio"
          options={benefitFilters}
          activeValue={filterType}
          onSelect={onFilterChange}
        />
        <FilterGroup
          label="Status"
          options={statusFilters}
          activeValue={filterStatus}
          onSelect={onStatusChange}
        />
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

function FilterGroup<TValue extends string>({
  label,
  options,
  activeValue,
  onSelect
}: FilterGroupProps<TValue>) {
  return (
    <div className="rounded-[28px] border border-[color:var(--border)] bg-slate-50/80 px-4 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={activeValue === option.value ? "primary" : "secondary"}
            className={cn(
              "min-w-[120px] justify-center",
              activeValue === option.value && "shadow-[0_16px_28px_-20px_rgba(22,99,214,0.8)]"
            )}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
