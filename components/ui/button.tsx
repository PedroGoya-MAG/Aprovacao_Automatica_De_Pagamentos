import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "destructive" | "success";
type ButtonSize = "md" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border-[color:var(--brand)] bg-[color:var(--brand)] text-white hover:border-[color:var(--brand-strong)] hover:bg-[color:var(--brand-strong)] focus-visible:ring-[color:var(--brand)]",
  secondary:
    "border-[color:var(--border)] bg-white text-[color:var(--brand-deep)] hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-soft)] focus-visible:ring-[color:var(--brand)]",
  outline:
    "border-[color:var(--brand)] bg-transparent text-[color:var(--brand-strong)] hover:bg-[color:var(--brand-soft)] focus-visible:ring-[color:var(--brand)]",
  ghost:
    "border-transparent bg-transparent text-[color:var(--brand-strong)] hover:bg-[color:var(--brand-soft)] focus-visible:ring-[color:var(--brand)]",
  danger:
    "border-[color:var(--danger)] bg-[color:var(--danger)] text-white hover:border-red-700 hover:bg-red-700 focus-visible:ring-[color:var(--danger)]",
  destructive:
    "border-[color:var(--danger)] bg-[color:var(--danger)] text-white hover:border-red-700 hover:bg-red-700 focus-visible:ring-[color:var(--danger)]",
  success:
    "border-[color:var(--success)] bg-[color:var(--success)] text-[color:var(--mag-dark-blue-primary)] hover:border-green-600 hover:bg-green-500 focus-visible:ring-[color:var(--success)]"
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  icon: "h-10 w-10 px-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border px-4 font-medium shadow-none transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
