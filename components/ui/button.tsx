import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "md" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-strong)_100%)] text-white shadow-[0_22px_36px_-24px_rgba(23,101,214,0.75)] hover:-translate-y-0.5 hover:brightness-[1.02] active:translate-y-0",
  secondary:
    "border-slate-200/90 bg-white/96 text-slate-700 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.38)] hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/90 hover:text-slate-950 active:translate-y-0",
  ghost:
    "border-transparent bg-transparent text-slate-600 hover:bg-white/80 hover:text-slate-950 active:bg-slate-100/90",
  danger:
    "border-transparent bg-[linear-gradient(135deg,#e11d48_0%,#be123c_100%)] text-white shadow-[0_22px_36px_-24px_rgba(225,29,72,0.6)] hover:-translate-y-0.5 hover:brightness-[1.02] active:translate-y-0",
  success:
    "border-transparent bg-[linear-gradient(135deg,#0f766e_0%,#0a9a7a_100%)] text-white shadow-[0_22px_36px_-24px_rgba(5,150,105,0.55)] hover:-translate-y-0.5 hover:brightness-[1.02] active:translate-y-0"
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "h-11 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
  icon: "h-11 w-11 px-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
});
