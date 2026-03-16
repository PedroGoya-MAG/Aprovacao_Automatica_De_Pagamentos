import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="panel relative overflow-hidden px-6 py-16 text-center">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--brand)_0%,var(--brand-strong)_100%)]" />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,rgba(22,99,214,0.12)_0%,rgba(15,118,110,0.12)_100%)] p-5 shadow-[0_20px_40px_-28px_rgba(22,99,214,0.45)]">
          <Inbox className="h-9 w-9 text-[color:var(--brand-strong)]" />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Nenhum resultado com os filtros atuais</p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

