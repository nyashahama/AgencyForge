export default function OutputPreview() {
  const outputs = [
    ["Campaign Copy Suite", "24 ranked variants across paid, social, and email", "Ready for review"],
    ["Visual Direction Brief", "Moodboards, palette rationale, and typography direction", "Ready for review"],
    ["Media Plan", "Allocation, reach assumptions, and pacing model", "Ready for review"],
    ["Legal Documents", "Rights, NDAs, and compliance flags", "Pending legal review"],
    ["Performance Forecast", "Projected CTR, ROAS ranges, and benchmark comparison", "Ready for review"],
    ["Client Presentation", "Narrative deck with strategy, creative, and investment summary", "Ready for review"],
  ];

  return (
    <section id="output" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-soft)]">
              Deliverables
            </p>
            <h2 className="mt-4 font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl">
              What ships
              <br />
              with every brief.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg">
            Not loose drafts. Each run packages assets into a review-ready set
            with ownership, status, and a handoff path for the client team.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {outputs.map(([title, copy, status], index) => (
            <div
              key={title}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-soft)]">
                Output {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                {copy}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm">
                <span className="text-[var(--foreground)]">{status}</span>
                <span className="font-mono uppercase tracking-[0.2em] text-[var(--foreground-soft)]">
                  ~{12 - index} min
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
