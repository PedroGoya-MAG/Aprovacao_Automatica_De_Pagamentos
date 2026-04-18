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

const toneMap: Record<ToastTone, { icon: typeof CheckCircle2; className: string; iconClassName: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-[color:rgba(44,201,16,0.32)] bg-white text-[color:var(--foreground)]",
    iconClassName: "bg-[color:rgba(44,201,16,0.12)] text-green-700"
  },
  warning: {
    icon: TriangleAlert,
    className: "border-[color:rgba(245,159,0,0.4)] bg-white text-[color:var(--foreground)]",
    iconClassName: "bg-[color:rgba(245,159,0,0.14)] text-amber-700"
  },
  info: {
    icon: Info,
    className: "border-[color:rgba(0,120,168,0.32)] bg-white text-[color:var(--foreground)]",
    iconClassName: "bg-[color:rgba(0,120,168,0.12)] text-[color:var(--info)]"
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
              "pointer-events-auto rounded-[var(--radius-lg)] border px-4 py-4 shadow-[var(--shadow-soft)] transition duration-200 animate-[toast-in_220ms_ease-out]",
              config.className
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]", config.iconClassName)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[color:var(--brand-deep)]">{toast.title}</p>
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
