export default function StatsRow() {
  const stats = [
    ["Avg", "4.2h", "Brief to first campaign delivery"],
    ["Lifetime", "3,400+", "Campaigns generated"],
    ["Rate", "98%", "First-round client approval rate"],
    ["Managed", "$2.1B", "Client billing under orchestration"],
  ];

  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
        {stats.map(([tag, value, label]) => (
          <div
            key={label}
            className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-soft)]">
              {tag}
            </p>
            <p className="mt-4 font-serif text-5xl tracking-[-0.05em]">{value}</p>
            <p className="mt-3 max-w-[14ch] text-sm leading-6 text-[var(--foreground-muted)]">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
