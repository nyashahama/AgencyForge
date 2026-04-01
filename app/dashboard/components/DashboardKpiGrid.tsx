export default function DashboardKpiGrid({
  items,
}: {
  items: Array<{ label: string; value: string; note: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
            {item.label}
          </p>
          <p className="mt-4 font-serif text-4xl tracking-[-0.05em]">{item.value}</p>
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">{item.note}</p>
        </div>
      ))}
    </div>
  );
}
