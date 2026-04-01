import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-[var(--card-strong)] text-[var(--card-strong-foreground)] hover:bg-[var(--card-strong-hover)]",
  accent:
    "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-soft)]",
  outline:
    "border border-[var(--border-strong)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
  ghost:
    "bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
  subtle:
    "bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--surface)]",
};

const sizes = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "size-10",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function buttonClass({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  ),
);

Button.displayName = "Button";
