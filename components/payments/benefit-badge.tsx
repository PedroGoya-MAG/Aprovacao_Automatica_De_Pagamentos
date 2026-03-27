import { Gift, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBenefitType } from "@/lib/formatters";
import { type BenefitType } from "@/types/payments";

type BenefitBadgeProps = {
  benefitType: BenefitType;
  className?: string;
};

export function BenefitBadge({ benefitType, className }: BenefitBadgeProps) {
  const isSorteio = benefitType === "SORTEIO";
  const Icon = isSorteio ? Gift : Wallet;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        isSorteio
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {formatBenefitType(benefitType)}
    </span>
  );
}
