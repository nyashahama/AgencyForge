export default function StatsBar({
  stats,
}: {
  stats: { label: string; value: string; delta: string; tag: string }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
            {stat.tag}
          </p>
          <p className="mt-4 font-serif text-4xl tracking-[-0.05em]">{stat.value}</p>
          <p className="mt-2 text-sm font-medium">{stat.label}</p>
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">{stat.delta}</p>
        </div>
      ))}
    </div>
  );
}
