"use client";

import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { type Brief } from "../components/data";
import { useMockDashboard } from "../components/mock-state";

export default function BriefsPage() {
  const {
    briefs,
    advanceBrief,
    createCampaignFromBrief,
    pushToast,
    setUploadModalOpen,
  } = useMockDashboard();
  const [dragging, setDragging] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);

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
              value: `${briefs.filter((brief) => brief.status === "new").length}`,
              note: "Briefs still waiting for normalization",
            },
            {
              label: "Ready to run",
              value: `${briefs.filter((brief) => brief.status === "ready").length}`,
              note: "Items that can move straight into campaign assembly",
            },
            {
              label: "Blocked",
              value: `${briefs.filter((brief) => brief.status === "blocked").length}`,
              note: "Intake items with unresolved compliance or context issues",
            },
            {
              label: "Avg. file depth",
              value: `${(briefs.reduce((sum, brief) => sum + brief.pages, 0) / briefs.length).toFixed(1)}p`,
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
                const file = event.dataTransfer.files[0];
                if (file) {
                  setUploadModalOpen(true);
                  pushToast("File captured", `${file.name} is ready for intake mapping.`);
                }
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
                <Button
                  variant="accent"
                  className="rounded-full"
                  onClick={() => setUploadModalOpen(true)}
                >
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
                {briefs.map((brief) => (
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
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="subtle" onClick={() => setSelectedBrief(brief)}>
                          View
                        </Button>
                        {brief.status !== "ready" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => advanceBrief(brief.id)}
                          >
                            Advance
                          </Button>
                        ) : null}
                        {brief.status === "ready" ? (
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => createCampaignFromBrief(brief.id)}
                          >
                            Create campaign
                          </Button>
                        ) : null}
                      </div>
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
      <Modal
        open={Boolean(selectedBrief)}
        onClose={() => setSelectedBrief(null)}
        title={selectedBrief?.title ?? "Brief"}
        description={selectedBrief ? `${selectedBrief.client} · ${selectedBrief.channel}` : ""}
        footer={
          selectedBrief ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedBrief(null)}>
                Close
              </Button>
              {selectedBrief.status === "ready" ? (
                <Button
                  variant="accent"
                  onClick={() => {
                    createCampaignFromBrief(selectedBrief.id);
                    setSelectedBrief(null);
                  }}
                >
                  Launch campaign
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={() => {
                    advanceBrief(selectedBrief.id);
                    setSelectedBrief(null);
                  }}
                >
                  Advance intake
                </Button>
              )}
            </>
          ) : null
        }
      >
        {selectedBrief ? (
          <div className="space-y-4 text-sm text-[var(--foreground-muted)]">
            <div className="rounded-[22px] border border-[var(--border)] p-4">
              Uploaded {selectedBrief.uploaded} by {selectedBrief.owner}
            </div>
            <div className="rounded-[22px] border border-[var(--border)] p-4">
              {selectedBrief.pages} pages · Next step: {selectedBrief.nextAction}
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
