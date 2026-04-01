"use client";

import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const briefs = [
  ["Meridian Bank", "Retail credit expansion", "Ready to run"],
  ["Volta Footwear", "Summer launch 2026", "Processing"],
  ["Helix Health", "Awareness sprint", "In progress"],
  ["Crest Foods", "Oat series launch", "Ready to run"],
];

export default function BriefsPage() {
  const [dragging, setDragging] = useState(false);

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Input queue"
        title="Brief intake"
        description="Collect source material, validate intake, and hand work directly into the delivery pipeline."
        tone="from-sky-400/20 to-transparent"
      />
      <div className="space-y-6">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          className={`rounded-[28px] border-2 border-dashed p-8 text-center transition ${
            dragging
              ? "border-[var(--accent)] bg-[var(--accent-wash)]"
              : "border-[var(--border)] bg-[var(--surface)]"
          }`}
        >
          <p className="font-serif text-3xl tracking-[-0.04em]">Drop your brief here</p>
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">
            PDF, DOCX, or TXT. Agents will begin structuring the work immediately.
          </p>
          <Button variant="accent" className="mt-6 rounded-full">
            Choose file
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Queued briefs</CardTitle>
            <CardDescription>Latest intake waiting for delivery orchestration.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {briefs.map(([client, title, status]) => (
              <div
                key={client + title}
                className="rounded-[22px] border border-[var(--border)] p-5"
              >
                <p className="text-sm text-[var(--foreground-muted)]">{client}</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{title}</p>
                <p className="mt-3 text-sm text-[var(--foreground-muted)]">{status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
