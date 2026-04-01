import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default:
    "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]",
  accent:
    "border border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--accent-foreground)]",
  success:
    "border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning:
    "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-[0.08em] uppercase",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
