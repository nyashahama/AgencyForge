export default function FeaturesSplit() {
  const capabilities = [
    ["Design Direction", "Moodboards, style guides, and visual systems"],
    ["Media Planning", "Channel mix, reach modeling, and pacing"],
    ["Budget Optimization", "Investment allocation with ROI tradeoffs"],
    ["Legal Documents", "Usage rights, NDAs, and compliance checks"],
    ["Client Portal", "White-label delivery and approval workflows"],
  ];

  return (
    <section id="features" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-soft)]">
            Platform
          </p>
          <h2 className="mt-4 font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl">
            Everything your team
            <br />
            doesn&apos;t have time to do.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg">
            AgencyForge is split into specialists, not a single generic agent.
            That keeps deliverables consistent across copy, design, channel
            planning, and client-facing operations.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              "24 ranked copy variants per brief",
              "Channel-aware outputs for paid, OOH, email, and social",
              "Voice memory carried across campaigns",
              "Localization, legal review, and portal delivery built in",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-7">
                <span className="mt-2 size-2 rounded-full bg-[var(--accent)]" />
                <span className="text-[var(--foreground-muted)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-4">
          {capabilities.map(([title, copy], index) => (
            <div
              key={title}
              className="flex items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em]">{title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
                  {copy}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--surface-strong)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
                Agent {String(index + 2).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
