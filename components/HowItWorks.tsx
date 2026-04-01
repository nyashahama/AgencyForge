export default function HowItWorks() {
  const steps = [
    {
      id: "01",
      title: "Upload Brief",
      copy:
        "Drop in a PDF, doc, or plain-text brief. The system extracts audience, goals, channels, deadlines, and tone in seconds.",
    },
    {
      id: "02",
      title: "Agents Activate",
      copy:
        "Specialists for copy, design, media, legal, and approvals run in parallel from a single source of truth.",
    },
    {
      id: "03",
      title: "Package Assembles",
      copy:
        "Campaign-ready outputs are bundled into a clean client-facing workspace with rationale, assets, and timelines.",
    },
    {
      id: "04",
      title: "Revisions Stay Synced",
      copy:
        "Feedback in one place propagates across deliverables, so scope changes don’t create coordination debt.",
    },
  ];

  return (
    <section id="how" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-soft)]">
              Process
            </p>
            <h2 className="mt-4 font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl">
              Four steps.
              <br />
              One input.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg">
            Every campaign begins with the same artifact. That lets the platform
            run a disciplined workflow instead of improvising across disconnected
            prompts and tools.
          </p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-soft)]">
                {step.id} / 04
              </p>
              <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em]">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--foreground-muted)]">
                {step.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
