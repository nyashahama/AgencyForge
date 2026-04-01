export default function DashboardPageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-soft)]">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
          {title}
        </h1>
      </div>
      <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
