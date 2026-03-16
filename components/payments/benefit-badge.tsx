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
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-[0_14px_30px_-22px_rgba(15,23,42,0.32)]",
        isSorteio
          ? "border-sky-200/80 bg-[linear-gradient(135deg,rgba(22,99,214,0.14)_0%,rgba(92,163,255,0.14)_100%)] text-sky-800"
          : "border-teal-200/80 bg-[linear-gradient(135deg,rgba(15,118,110,0.14)_0%,rgba(45,212,191,0.14)_100%)] text-teal-800",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {formatBenefitType(benefitType)}
    </span>
  );
}
