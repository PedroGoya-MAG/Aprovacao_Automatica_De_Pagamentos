import type { ComponentType } from "react";
import { CalendarDays, Landmark, ShieldCheck, TrendingUp } from "lucide-react";

import { BenefitBadge } from "@/components/payments/benefit-badge";

export function AppHeader() {
  const portalTitle = process.env.NEXT_PUBLIC_PORTAL_TITLE ?? "Portal de Aprovacao de Pagamentos";
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";


  return (
    <header className="panel relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(23,101,214,0.13),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(15,139,125,0.15),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--brand)_0%,var(--brand-strong)_100%)]" />

      <div className="relative grid gap-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-end">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-strong)_100%)] shadow-[0_20px_42px_-24px_rgba(23,101,214,0.7)]">
              <Landmark className="h-6 w-6 text-white" />
            </div>
            <span className="data-chip">Fluxo financeiro controlado</span>
            {isDemoMode ? <span className="data-chip">Modo demonstracao</span> : null}
          </div>

          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Dashboard principal</p>
            <h1 className="text-3xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">{portalTitle}</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Acompanhe lotes de beneficios, priorize valores pendentes e decida aprovacoes com visao clara,
              confiavel e preparada para a operacao corporativa.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <BenefitBadge benefitType="SORTEIO" />
            <BenefitBadge benefitType="RESGATE" />
          </div>
        </div>

        <div className="sub-panel relative overflow-hidden px-5 py-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Painel executivo</p>
              <span className="rounded-full bg-[linear-gradient(135deg,rgba(23,101,214,0.12)_0%,rgba(15,139,125,0.12)_100%)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                Ambiente interno
              </span>
            </div>
            <div className="grid gap-3">
              <InfoLine icon={CalendarDays} label="Atualizacao" value="Dados sincronizados em tempo real" />
              <InfoLine icon={ShieldCheck} label="Objetivo" value="Aprovar lotes e pagamentos com seguranca" />
              <InfoLine icon={TrendingUp} label="Diretriz" value="Clareza operacional e resposta rapida" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

type InfoLineProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function InfoLine({ icon: Icon, label, value }: InfoLineProps) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-slate-200/70 bg-slate-50/92 px-4 py-3 transition hover:border-slate-300/80 hover:bg-white">
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)]">
        <Icon className="h-4 w-4 text-[color:var(--brand-deep)]" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}




