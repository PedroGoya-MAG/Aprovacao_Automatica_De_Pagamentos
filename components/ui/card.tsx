import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "glass" | "accent" | "success" | "warning" | "info";
  children: ReactNode;
};

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "panel",
  glass: "panel-glass",
  accent: "panel border-[color:rgba(16,115,201,0.32)] bg-[color:rgba(16,115,201,0.06)]",
  success: "panel border-[color:rgba(44,201,16,0.32)] bg-[color:rgba(44,201,16,0.08)]",
  warning: "panel border-[color:rgba(245,159,0,0.38)] bg-[color:rgba(245,159,0,0.1)]",
  info: "panel border-[color:rgba(0,120,168,0.32)] bg-[color:rgba(0,120,168,0.08)]"
};

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  return (
    <div className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </div>
  );
}
