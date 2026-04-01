"use client";

import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRIEFS } from "../components/data";

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
        <DashboardKpiGrid
          items={[
            {
              label: "New intake",
              value: `${BRIEFS.filter((brief) => brief.status === "new").length}`,
              note: "Briefs still waiting for normalization",
            },
            {
              label: "Ready to run",
              value: `${BRIEFS.filter((brief) => brief.status === "ready").length}`,
              note: "Items that can move straight into campaign assembly",
            },
            {
              label: "Blocked",
              value: `${BRIEFS.filter((brief) => brief.status === "blocked").length}`,
              note: "Intake items with unresolved compliance or context issues",
            },
            {
              label: "Avg. file depth",
              value: "10.3p",
              note: "Average brief page count across the queue",
            },
          ]}
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
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
              className={`rounded-[28px] border-2 border-dashed p-8 transition ${
                dragging
                  ? "border-[var(--accent)] bg-[var(--accent-wash)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-serif text-3xl tracking-[-0.04em]">Drop your brief here</p>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--foreground-muted)]">
                    Accept PDF, DOCX, or TXT. The intake layer will normalize
                    content, extract campaign metadata, and route the brief to the
                    right specialists.
                  </p>
                </div>
                <Button variant="accent" className="rounded-full">
                  Choose file
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Intake queue</CardTitle>
                <CardDescription>
                  Triage every brief by readiness, owner, and next action.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {BRIEFS.map((brief) => (
                  <div
                    key={brief.id}
                    className="grid gap-4 rounded-[24px] border border-[var(--border)] p-5 lg:grid-cols-[minmax(0,1fr)_160px_180px]"
                  >
                    <div>
                      <p className="text-sm text-[var(--foreground-muted)]">{brief.client}</p>
                      <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                        {brief.title}
                      </p>
                      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                        {brief.channel} · {brief.pages} pages · uploaded {brief.uploaded}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <StatusPill
                        label={brief.status}
                        tone={
                          brief.status === "ready"
                            ? "success"
                            : brief.status === "blocked"
                              ? "danger"
                              : brief.status === "processing"
                                ? "info"
                                : "warning"
                        }
                      />
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Owner: {brief.owner}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                        Next action
                      </p>
                      <p className="mt-2 text-sm leading-6">{brief.nextAction}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Intake rules</CardTitle>
              <CardDescription>
                Keep the queue moving without introducing review debt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-[var(--foreground-muted)]">
              <div className="rounded-[22px] border border-[var(--border)] p-4">
                Ready briefs should move into campaign assembly within 30 minutes.
              </div>
              <div className="rounded-[22px] border border-[var(--border)] p-4">
                Blocked briefs require either client clarification or legal resolution.
              </div>
              <div className="rounded-[22px] border border-[var(--border)] p-4">
                Intake owners are responsible for metadata accuracy before handoff.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
