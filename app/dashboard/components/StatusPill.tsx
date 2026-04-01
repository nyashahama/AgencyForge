import { cn } from "@/lib/utils";

export default function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-[var(--surface-muted)] text-[var(--foreground-muted)]",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    info: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium tracking-[0.12em] uppercase",
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}
