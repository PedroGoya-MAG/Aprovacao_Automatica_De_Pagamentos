import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarRange, ClipboardCheck, History } from "lucide-react";

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
  { eyebrow: string; description: string }
> = {
  approvals: {
    eyebrow: "Aprovações",
    description:
      "Acompanhe lotes, avalie pagamentos e conduza aprovações com uma visão clara, objetiva e alinhada ao fluxo interno da CAP."
  },
  history: {
    eyebrow: "Histórico",
    description:
      "Consulte lotes e pagamentos já processados com foco em rastreabilidade, leitura executiva e análise posterior da operação."
  },
  monthly: {
    eyebrow: "Visão mensal",
    description:
      "Acompanhe o comportamento do mês com indicadores, volumes recebidos e sinais de atenção para leitura gerencial da operação."
  },
  treasury: {
    eyebrow: "Tesouraria",
    description:
      "Consulte os pagamentos importados no PagNet com visão operacional por data de importação, busca rápida e filtros objetivos."
  }
};

export async function AppHeader({ activeTab = "approvals" }: { activeTab?: AppHeaderTab }) {
  const portalTitle = process.env.NEXT_PUBLIC_PORTAL_TITLE ?? "Portal de Aprovação de Pagamentos";
  const activeContent = activeDescriptions[activeTab];
  const session = await getServerSession();
  const visibleNavItems = session ? navItems.filter((item) => canAccessTab(session.user.role, item.value)) : navItems;

  return (
    <header className="overflow-hidden border-b border-[color:var(--border)] bg-white">
      <div className="border-b border-[color:var(--border)] px-4 py-3 sm:px-5 lg:px-6 xl:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

      <div className="px-4 py-4 sm:px-5 lg:px-6 xl:px-8 xl:py-5 2xl:py-6">
        <div className="space-y-3 2xl:space-y-4">
          <div className="space-y-2">
            <p className="mag-label text-[color:var(--brand)]">{activeContent.eyebrow}</p>
            <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-[color:var(--brand-deep)] sm:text-[28px] 2xl:text-[30px]">{portalTitle}</h1>
            <p className="max-w-4xl text-sm leading-6 text-slate-600 lg:text-[15px] 2xl:text-base 2xl:leading-7">{activeContent.description}</p>
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
                          "inline-flex items-center gap-2 border-b-2 px-1 py-2.5 text-sm font-semibold transition 2xl:py-3",
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
      </div>
    </header>
  );
}
