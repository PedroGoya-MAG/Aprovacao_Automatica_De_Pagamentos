import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="panel px-6 py-14 text-center">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
        <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--brand-soft)] p-5">
          <Inbox className="h-8 w-8 text-[color:var(--brand)]" />
        </div>
        <div className="space-y-3">
          <p className="mag-label text-[color:var(--brand)]">Nenhum resultado com os filtros atuais</p>
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[color:var(--brand-deep)]">{title}</h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
