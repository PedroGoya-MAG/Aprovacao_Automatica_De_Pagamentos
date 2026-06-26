import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarRange, ClipboardCheck, History, ShieldCheck } from "lucide-react";

import { canAccessTab, formatRoleLabel } from "@/lib/auth/access";
import { getServerSession } from "@/lib/auth/session";

type AppHeaderTab = "approvals" | "history" | "monthly" | "treasury";

const navItems: Array<{ label: string; icon: typeof ClipboardCheck; href: Route; value: AppHeaderTab }> = [
  { label: "Aprovações", icon: ClipboardCheck, href: "/" as Route, value: "approvals" },
  { label: "Histórico", icon: History, href: "/historico" as Route, value: "history" },
  { label: "Visão mensal", icon: CalendarRange, href: "/visao-mensal" as Route, value: "monthly" },
  { label: "Tesouraria", icon: Building2, href: "/tesouraria" as Route, value: "treasury" }
];

const activeDescriptions: Record<
  AppHeaderTab,
  { eyebrow: string; description: string; sideTitle: string; sideText: string }
> = {
  approvals: {
    eyebrow: "Aprovações",
    description:
      "Acompanhe lotes, avalie pagamentos e conduza aprovações com uma visão clara, objetiva e alinhada ao fluxo interno da CAP.",
    sideTitle: "Operação de aprovação",
    sideText: "Painel preparado para decisão rápida por lote, com filtros, detalhes individuais e visão consolidada da operação."
  },
  history: {
    eyebrow: "Histórico",
    description:
      "Consulte lotes e pagamentos já processados com foco em rastreabilidade, leitura executiva e análise posterior da operação.",
    sideTitle: "Consulta histórica",
    sideText: "Visão orientada a consulta e revisão, com filtros por competência, status, benefício e alertas já identificados."
  },
  monthly: {
    eyebrow: "Visão mensal",
    description:
      "Acompanhe o comportamento do mês com indicadores, volumes recebidos e sinais de atenção para leitura gerencial da operação.",
    sideTitle: "Leitura gerencial",
    sideText: "Área preparada para acompanhar totais do mês, motivos de suspeita e comportamento diário e semanal dos pagamentos."
  },
  treasury: {
    eyebrow: "Tesouraria",
    description:
      "Consulte os pagamentos importados no PagNet com visão operacional por data de importação, busca rápida e filtros objetivos.",
    sideTitle: "Monitoramento de importações",
    sideText: "Tela somente leitura para acompanhamento do que já foi importado para o PagNet, agrupado por dia de importação."
  }
};

export async function AppHeader({ activeTab = "approvals" }: { activeTab?: AppHeaderTab }) {
  const portalTitle = process.env.NEXT_PUBLIC_PORTAL_TITLE ?? "Portal de Aprovação de Pagamentos";
  const activeContent = activeDescriptions[activeTab];
  const session = await getServerSession();
  const visibleNavItems = session ? navItems.filter((item) => canAccessTab(session.user.role, item.value)) : navItems;

  return (
    <header className="overflow-hidden border-b border-[color:var(--border)] bg-white">
      <div className="border-b border-[color:var(--border)] px-5 py-3 sm:px-6 xl:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <Image
              src="/mag-capitalizacao-logo.svg"
              alt="MAG Capitalização"
              width={220}
              height={58}
              className="h-auto w-[150px] sm:w-[180px]"
              priority
            />
            <div className="hidden h-8 w-px bg-[color:var(--border)] lg:block" />
            <div className="hidden text-sm text-slate-600 lg:block">
              <p className="font-semibold text-slate-900">Gestão de benefícios</p>
              <p>Aprovação operacional de pagamentos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {session ? <span className="data-chip">{formatRoleLabel(session.user.role)}</span> : null}
            {session ? <span className="data-chip">{session.user.name}</span> : null}
            {session ? (
              <a
                href="/api/auth/logout"
                className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--border)] bg-white px-3 text-xs font-semibold text-[color:var(--brand-deep)] transition hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-soft)]"
              >
                Sair
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6 sm:py-8 xl:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="mag-label text-[color:var(--brand)]">{activeContent.eyebrow}</p>
              <h1 className="text-[32px] font-bold leading-tight tracking-[-0.02em] text-[color:var(--brand-deep)] sm:text-[32px]">{portalTitle}</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-600">{activeContent.description}</p>
            </div>

            <nav aria-label="Navegação principal do portal" className="border-b border-[color:var(--border)]">
              <ul className="flex flex-wrap items-center gap-1 sm:gap-4">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.value === activeTab;

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={[
                          "inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition",
                          isActive
                            ? "border-[color:var(--brand)] text-[color:var(--brand-deep)]"
                            : "border-transparent text-slate-600 hover:text-[color:var(--brand-deep)]"
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="panel-dark px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-white/15 bg-white/10">
                <ShieldCheck className="h-5 w-5 text-[color:var(--mag-green)]" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-white">{activeContent.sideTitle}</p>
                <p className="text-sm leading-6 text-white/80">{activeContent.sideText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
