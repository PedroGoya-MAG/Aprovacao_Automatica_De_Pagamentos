import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarRange, ClipboardCheck, History, ShieldCheck } from "lucide-react";

type AppHeaderTab = "approvals" | "history" | "monthly";

const navItems: Array<{ label: string; icon: typeof ClipboardCheck; href: Route; value: AppHeaderTab }> = [
  { label: "Aprovacoes", icon: ClipboardCheck, href: "/" as Route, value: "approvals" },
  { label: "Historico", icon: History, href: "/historico" as Route, value: "history" },
  { label: "Visao mensal", icon: CalendarRange, href: "/visao-mensal" as Route, value: "monthly" }
];

const activeDescriptions: Record<
  AppHeaderTab,
  { eyebrow: string; description: string; sideTitle: string; sideText: string }
> = {
  approvals: {
    eyebrow: "Aprovacoes",
    description:
      "Acompanhe lotes, avalie pagamentos e conduza aprovacoes com uma visao clara, objetiva e alinhada ao fluxo interno da CAP.",
    sideTitle: "Operacao de aprovacao",
    sideText: "Painel preparado para decisao rapida por lote, com filtros, detalhes individuais e visao consolidada da operacao."
  },
  history: {
    eyebrow: "Historico",
    description:
      "Consulte lotes e pagamentos ja processados com foco em rastreabilidade, leitura executiva e analise posterior da operacao.",
    sideTitle: "Consulta historica",
    sideText: "Visao orientada a consulta e revisao, com filtros por competencia, status, beneficio e alertas ja identificados."
  },
  monthly: {
    eyebrow: "Visao mensal",
    description:
      "Acompanhe o comportamento do mes com indicadores, volumes recebidos e sinais de atencao para leitura gerencial da operacao.",
    sideTitle: "Leitura gerencial",
    sideText: "Area preparada para acompanhar totais do mes, motivos de suspeita e comportamento diario e semanal dos pagamentos."
  }
};

export function AppHeader({ activeTab = "approvals" }: { activeTab?: AppHeaderTab }) {
  const portalTitle = process.env.NEXT_PUBLIC_PORTAL_TITLE ?? "Portal de Aprovacao de Pagamentos";
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const activeContent = activeDescriptions[activeTab];

  return (
    <header className="overflow-hidden border-b border-[color:var(--border)] bg-white">
      <div className="border-b border-[color:var(--border)] px-5 py-3 sm:px-6 xl:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <Image
              src="/mag-capitalizacao-logo.svg"
              alt="MAG Capitalizacao"
              width={220}
              height={58}
              className="h-auto w-[150px] sm:w-[180px]"
              priority
            />
            <div className="hidden h-8 w-px bg-[color:var(--border)] lg:block" />
            <div className="hidden text-sm text-slate-600 lg:block">
              <p className="font-semibold text-slate-900">Gestao de beneficios</p>
              <p>Aprovacao operacional de pagamentos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="data-chip">Uso corporativo</span>
            <span className="data-chip">Fluxo operacional</span>
            {isDemoMode ? <span className="data-chip">Modo demonstracao</span> : null}
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

            <nav aria-label="Navegacao principal do portal" className="border-b border-[color:var(--border)]">
              <ul className="flex flex-wrap items-center gap-1 sm:gap-4">
                {navItems.map((item) => {
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
