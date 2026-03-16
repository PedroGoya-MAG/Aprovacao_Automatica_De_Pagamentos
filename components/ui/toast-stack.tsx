import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastTone = "success" | "warning" | "info";

export type ToastItem = {
  id: number;
  title: string;
  description: string;
  tone: ToastTone;
};

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

const toneMap: Record<ToastTone, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200/80 bg-white/95 text-slate-800 shadow-[0_24px_45px_-28px_rgba(5,150,105,0.45)]"
  },
  warning: {
    icon: TriangleAlert,
    className: "border-amber-200/80 bg-white/95 text-slate-800 shadow-[0_24px_45px_-28px_rgba(217,119,6,0.4)]"
  },
  info: {
    icon: Info,
    className: "border-sky-200/80 bg-white/95 text-slate-800 shadow-[0_24px_45px_-28px_rgba(22,99,214,0.4)]"
  }
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[70] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const config = toneMap[toast.tone];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-[24px] border px-4 py-4 backdrop-blur-xl transition duration-300 animate-[toast-in_220ms_ease-out]",
              config.className
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(22,99,214,0.12)_0%,rgba(15,118,110,0.12)_100%)]">
                <Icon className="h-5 w-5 text-[color:var(--brand-deep)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950">{toast.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{toast.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar notificacao"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
