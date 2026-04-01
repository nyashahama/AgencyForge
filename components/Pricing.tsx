import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";

export default function Pricing() {
  const plans = [
    {
      name: "Studio",
      price: "$149",
      desc: "Solo operators and boutique shops validating the model.",
      features: [
        "Up to 8 active campaigns",
        "All six AI agents",
        "1 client workspace",
        "Legal document templates",
      ],
      variant: "outline" as const,
    },
    {
      name: "Agency",
      price: "$499",
      desc: "Multi-client teams that need throughput without quality drop-off.",
      features: [
        "Unlimited campaigns",
        "Unlimited client portals",
        "White-label branding",
        "Custom voice training",
        "Priority support",
      ],
      variant: "accent" as const,
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "Large agencies with bespoke infra, governance, and support needs.",
      features: [
        "SSO + custom auth",
        "Dedicated deployment options",
        "Custom model policies",
        "SLA-backed support",
      ],
      variant: "outline" as const,
    },
  ];

  return (
    <section id="pricing" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-soft)]">
              Pricing
            </p>
            <h2 className="mt-4 font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl">
              Simple, honest pricing.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[var(--foreground-muted)] sm:text-lg">
            No per-seat traps and no surprise usage fees. One platform price for
            the full agency operating layer.
          </p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[28px] border p-6 ${
                plan.featured
                  ? "border-[var(--accent-border)] bg-[color:color-mix(in_srgb,var(--accent-wash)_50%,var(--surface))]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              {plan.featured ? <Badge variant="accent">Most popular</Badge> : null}
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-soft)]">
                {plan.name}
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                {plan.name}
              </h3>
              <p className="mt-3 min-h-14 text-sm leading-7 text-[var(--foreground-muted)]">
                {plan.desc}
              </p>
              <div className="mt-8 flex items-end gap-2">
                <span className="font-serif text-5xl tracking-[-0.05em]">
                  {plan.price}
                </span>
                {plan.price !== "Custom" ? (
                  <span className="pb-2 text-sm text-[var(--foreground-muted)]">
                    /month
                  </span>
                ) : null}
              </div>
              <ul className="mt-8 space-y-3 text-sm leading-7 text-[var(--foreground-muted)]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-2 size-2 rounded-full bg-[var(--accent)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={buttonClass({
                  variant: plan.variant,
                  size: "lg",
                  className: "mt-8 w-full rounded-full",
                })}
              >
                {plan.price === "Custom" ? "Talk to sales" : "Start free trial"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
