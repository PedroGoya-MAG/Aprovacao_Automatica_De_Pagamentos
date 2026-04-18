import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "default" | "success" | "warning" | "info" | "error";
type BadgeSize = "sm" | "md" | "lg";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
  children: ReactNode;
};

const toneStyles: Record<BadgeTone, string> = {
  default: "border-[color:rgba(16,115,201,0.28)] bg-[color:rgba(16,115,201,0.1)] text-[color:var(--brand-strong)]",
  success: "border-[color:rgba(44,201,16,0.32)] bg-[color:rgba(44,201,16,0.12)] text-green-800",
  warning: "border-[color:rgba(245,159,0,0.4)] bg-[color:rgba(245,159,0,0.14)] text-amber-800",
  info: "border-[color:rgba(0,120,168,0.32)] bg-[color:rgba(0,120,168,0.12)] text-cyan-800",
  error: "border-[color:rgba(217,45,32,0.32)] bg-[color:rgba(217,45,32,0.1)] text-red-800"
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
  lg: "px-3.5 py-1.5 text-sm"
};

export function Badge({ className, tone = "default", size = "md", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium leading-none",
        toneStyles[tone],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
