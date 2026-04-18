import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/types/payments";

type StatusBadgeProps = {
  status: PaymentStatus;
};

const statusConfig: Record<PaymentStatus, { label: string; icon: typeof Clock3; tone: "warning" | "success" | "error" }> = {
  PENDING: { label: "Pendente", icon: Clock3, tone: "warning" },
  APPROVED: { label: "Aprovado", icon: CheckCircle2, tone: "success" },
  REJECTED: { label: "Rejeitado", icon: XCircle, tone: "error" }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} size="md" className="whitespace-nowrap">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
