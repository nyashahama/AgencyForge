"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { useAuth } from "@/lib/auth/session";
import { briefs as briefsApi } from "@/lib/api/endpoints";
import type { Brief } from "@/lib/api/client";

type BriefStatus = "new" | "processing" | "ready" | "blocked" | "launched";

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function mapApiBrief(b: Brief) {
  return {
    id: b.id,
    clientId: b.client_id,
    client: b.client_name,
    title: b.title,
    channel: b.channel,
    status: b.status as BriefStatus,
    pages: b.pages,
    nextAction: b.next_action,
    owner: b.owner_email,
    uploaded: formatTimeAgo(b.created_at),
    createdAt: b.created_at,
  };
}

export default function BriefsPage() {
  const { accessToken } = useAuth();
  const [briefs, setBriefs] = useState<ReturnType<typeof mapApiBrief>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<ReturnType<typeof mapApiBrief> | null>(null);

  const fetchBriefs = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await briefsApi.list(accessToken);
      setBriefs(data.map(mapApiBrief));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load briefs");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  const handleLaunchBrief = async (briefId: string) => {
    if (!accessToken) return;
    const brief = briefs.find((b) => b.id === briefId);
    if (!brief) return;
    try {
      await briefsApi.launch(briefId, { campaign_name: brief.title }, accessToken);
      await fetchBriefs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch brief");
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  const newCount = briefs.filter((b) => b.status === "new").length;
  const launchedCount = briefs.filter((b) => b.status === "launched").length;
  const activeCount = briefs.length - launchedCount;
  const avgPages = briefs.length > 0 ? (briefs.reduce((sum, b) => sum + b.pages, 0) / briefs.length).toFixed(1) : "0";

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Input queue"
        title="Brief intake"
        description="Collect source material, validate intake, and hand work directly into the delivery pipeline."
        tone="from-sky-400/20 to-transparent"
      />
      <div className="space-y-6">
        {error ? (
          <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : null}
        <DashboardKpiGrid
          items={[
            {
              label: "New intake",
              value: String(newCount),
              note: "Briefs still waiting for normalization",
            },
            {
              label: "In queue",
              value: String(activeCount),
              note: "Briefs still moving through intake and preparation",
            },
            {
              label: "Launched",
              value: String(launchedCount),
              note: "Briefs already converted into active campaign execution",
            },
            {
              label: "Avg. file depth",
              value: `${avgPages}p`,
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
                          brief.status === "launched"
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
                        {brief.status !== "launched" ? (
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => handleLaunchBrief(brief.id)}
                          >
                            Launch campaign
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
              {selectedBrief.status !== "launched" ? (
                <Button
                  variant="accent"
                  onClick={() => {
                    handleLaunchBrief(selectedBrief.id);
                    setSelectedBrief(null);
                  }}
                >
                  Launch campaign
                </Button>
              ) : null}
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
