export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "We delivered three client launches in one week without adding headcount. The biggest win was how coherent every deliverable felt.",
      name: "Sarah R.",
      role: "Creative Director, Meld Studio",
    },
    {
      quote:
        "The white-label portal changed the way clients perceive the work. It feels like a premium operating system, not a chat transcript.",
      name: "Daniel M.",
      role: "Founder, Northline Agency",
    },
    {
      quote:
        "Copy, media, and legal are finally moving off the same brief. That removed the rework we used to accept as normal.",
      name: "Tobi K.",
      role: "Strategy Lead, Halo & Co.",
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-soft)]">
            In their words
          </p>
          <h2 className="mt-4 font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl">
            Agencies that changed
            <br />
            how they work.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <p className="text-lg leading-8 tracking-[-0.02em] text-[var(--foreground)]">
                &quot;{item.quote}&quot;
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-full bg-[var(--card-strong)] font-mono text-sm text-[var(--accent)]">
                  {item.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
