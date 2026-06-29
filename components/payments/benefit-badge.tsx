import { Gift, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { BenefitType } from "@/types/payments";

type BenefitBadgeProps = {
  benefitType: BenefitType;
};

const benefitConfig: Record<BenefitType, { label: string; icon: typeof Gift; tone: "info" | "success" }> = {
  SORTEIO: { label: "Sorteio", icon: Gift, tone: "info" },
  RESGATE: { label: "Resgate", icon: Wallet, tone: "success" }
};

export function BenefitBadge({ benefitType }: BenefitBadgeProps) {
  const config = benefitConfig[benefitType];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} size="md" className="whitespace-nowrap">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
