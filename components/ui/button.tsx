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
    "border-[color:var(--brand)] bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-strong)] hover:border-[color:var(--brand-strong)] active:bg-[color:var(--brand-deep)]",
  secondary:
    "border-[color:var(--border)] bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:bg-slate-100",
  ghost:
    "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200/70",
  danger:
    "border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:border-rose-700 active:bg-rose-800",
  success:
    "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 active:bg-emerald-800"
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-sm",
  icon: "h-10 w-10 px-0"
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
        "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:pointer-events-none disabled:opacity-45",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
});
