import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function CtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-[var(--accent-border)] bg-[linear-gradient(135deg,rgba(215,255,70,0.2),rgba(255,255,255,0.5))] p-8 sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-soft)]">
              Ready to switch
            </p>
            <h2 className="mt-4 font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl">
              Your agency,
              <br />
              reimagined.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg">
              No heavy onboarding. Upload the first brief and watch a complete
              campaign package assemble in under an hour.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/signup"
              className={buttonClass({
                variant: "default",
                size: "lg",
                className: "rounded-full px-6",
              })}
            >
              Start free
            </Link>
            <a
              href="/login"
              className={buttonClass({
                variant: "outline",
                size: "lg",
                className: "rounded-full px-6",
              })}
            >
              Explore the dashboard
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
