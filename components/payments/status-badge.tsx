import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { type PaymentStatus } from "@/types/payments";

type StatusBadgeProps = {
  status: PaymentStatus;
  label?: string;
};

const statusMap: Record<
  PaymentStatus,
  { text: string; className: string; icon: typeof Clock3 }
> = {
  PENDING: {
    text: "Pendente",
    className: "border-amber-200/80 bg-amber-50/90 text-amber-800",
    icon: Clock3
  },
  APPROVED: {
    text: "Aprovado",
    className: "border-emerald-200/80 bg-emerald-50/90 text-emerald-800",
    icon: CheckCircle2
  },
  REJECTED: {
    text: "Rejeitado",
    className: "border-rose-200/80 bg-rose-50/90 text-rose-800",
    icon: XCircle
  }
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusMap[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-[0_14px_30px_-22px_rgba(15,23,42,0.28)]",
        config.className
      )}
    >
      <Icon className="h-4 w-4" />
      {label ?? config.text}
    </span>
  );
}
