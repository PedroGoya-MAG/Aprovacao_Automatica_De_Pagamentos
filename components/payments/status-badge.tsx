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
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock3
  },
  APPROVED: {
    text: "Aprovado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2
  },
  REJECTED: {
    text: "Rejeitado",
    className: "border-rose-200 bg-rose-50 text-rose-800",
    icon: XCircle
  }
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusMap[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        config.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label ?? config.text}
    </span>
  );
}
