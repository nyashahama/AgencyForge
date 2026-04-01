import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Hero() {
  const metrics = [
    { label: "Brief to deck", value: "42 min" },
    { label: "Avg. approval lift", value: "+31%" },
    { label: "Active agency teams", value: "840+" },
  ];

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-8 sm:px-6 sm:pb-24">
      <div className="noise pointer-events-none absolute inset-0" />
      <div className="panel-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem] opacity-40" />
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="relative z-10 space-y-8 pt-8 sm:pt-16">
          <Badge variant="accent" className="w-fit">
            <span className="size-2 rounded-full bg-current" />
            Beta access open
          </Badge>
          <div className="space-y-6">
            <h1 className="font-serif text-6xl leading-none tracking-[-0.06em] text-gradient sm:text-7xl lg:text-[7.5rem]">
              The agency
              <br />
              that runs itself.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[var(--foreground-muted)] sm:text-xl">
              Upload a client brief and let specialized AI agents return the full
              campaign stack: copy, visual direction, media plan, approvals, and
              white-label delivery.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={buttonClass({
                variant: "accent",
                size: "lg",
                className: "rounded-full px-6",
              })}
            >
              Start free trial
            </Link>
            <a
              href="#how"
              className={buttonClass({
                variant: "outline",
                size: "lg",
                className: "rounded-full px-6",
              })}
            >
              See how it works
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-soft)]">
                  {metric.label}
                </p>
                <p className="mt-3 font-serif text-4xl tracking-[-0.05em]">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Card className="relative overflow-hidden border-[var(--accent-border)] bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(215,255,70,0.18),transparent_36%)]" />
          <CardContent className="relative p-6 sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-soft)]">
                  Live run
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Meridian Bank launch
                </h2>
              </div>
              <Button variant="default" size="sm" className="rounded-full">
                Agents active
              </Button>
            </div>

            <div className="space-y-4">
              {[
                ["Copy suite", "24 variants", "Ready"],
                ["Visual direction", "6 artboards", "Review"],
                ["Media plan", "3 channels", "Ready"],
                ["Legal pack", "2 flags", "Pending"],
              ].map(([name, detail, status]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-[22px] border border-[var(--border)] bg-[var(--background-elevated)]/80 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {detail}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-wash)] px-3 py-1 text-xs font-medium text-[var(--accent-foreground)]">
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 text-[var(--card-strong-foreground)] sm:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
                  Throughput
                </p>
                <p className="mt-3 text-2xl font-semibold">18 briefs</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
                  Revision loops
                </p>
                <p className="mt-3 text-2xl font-semibold">1.2 avg</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
                  Delivery window
                </p>
                <p className="mt-3 text-2xl font-semibold">Same day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mx-auto mt-8 max-w-7xl overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]/80 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6 font-mono text-xs uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
          {[
            "Brief intake",
            "Audience analysis",
            "Copy generation",
            "Visual direction",
            "Media planning",
            "Legal review",
            "Client delivery",
            "Revision sync",
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
