"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { useAuth } from "@/lib/auth/session";
import { briefs as briefsApi, clients as clientsApi } from "@/lib/api/endpoints";
import type { Brief, Client } from "@/lib/api/client";

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

function mapApiClient(c: Client) {
  return {
    id: c.id,
    name: c.name,
  };
}

function fileTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function storageKeyForFile(file: File, index: number): string {
  const normalizedName = file.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `uploads/${Date.now()}-${index}-${normalizedName || "brief-file"}`;
}

export default function BriefsPage() {
  const { accessToken } = useAuth();
  const [briefs, setBriefs] = useState<ReturnType<typeof mapApiBrief>[]>([]);
  const [clients, setClients] = useState<ReturnType<typeof mapApiClient>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<ReturnType<typeof mapApiBrief> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState({
    clientId: "",
    title: "",
    channel: "paid-social",
    pages: "0",
    ownerEmail: "",
    sourceType: "upload",
  });

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [briefsData, clientsData] = await Promise.all([
        briefsApi.list(accessToken),
        clientsApi.list(accessToken),
      ]);
      setBriefs(briefsData.map(mapApiBrief));
      const mappedClients = clientsData.map(mapApiClient);
      setClients(mappedClients);
      setDraft((current) =>
        current.clientId || mappedClients.length === 0
          ? current
          : { ...current, clientId: mappedClients[0].id },
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load briefs");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLaunchBrief = async (briefId: string) => {
    if (!accessToken) return;
    const brief = briefs.find((b) => b.id === briefId);
    if (!brief) return;
    try {
      await briefsApi.launch(briefId, { campaign_name: brief.title }, accessToken);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch brief");
    }
  };

  const handlePrepareIntake = (files: File[]) => {
    if (files.length === 0) return;
    setSelectedFiles(files);
    setDraft((current) => ({
      ...current,
      title: current.title || fileTitle(files[0].name),
      sourceType: "upload",
    }));
    setCreateOpen(true);
  };

  const handleCreateBrief = async () => {
    if (!accessToken || !draft.clientId || selectedFiles.length === 0) return;

    const title = draft.title.trim() || fileTitle(selectedFiles[0].name);
    if (!title) return;

    const parsedPages = Number.parseInt(draft.pages, 10);
    try {
      await briefsApi.create(
        {
          client_id: draft.clientId,
          title,
          channel: draft.channel.trim() || "paid-social",
          pages: Number.isNaN(parsedPages) ? 0 : Math.max(parsedPages, 0),
          owner_email: draft.ownerEmail.trim() || undefined,
          source_type: draft.sourceType,
          documents: selectedFiles.map((file, index) => ({
            storage_key: storageKeyForFile(file, index),
            original_filename: file.name,
            media_type: file.type || "application/octet-stream",
            byte_size: file.size,
            page_count: 0,
          })),
        },
        accessToken,
      );
      setCreateOpen(false);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setDraft((current) => ({
        ...current,
        clientId: clients[0]?.id ?? "",
        title: "",
        channel: "paid-social",
        pages: "0",
        ownerEmail: "",
        sourceType: "upload",
      }));
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create brief");
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                handlePrepareIntake(files);
              }}
            />
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const files = Array.from(event.dataTransfer.files ?? []);
                handlePrepareIntake(files);
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
                    content metadata, preserve source file details, and route the
                    brief directly into the delivery queue.
                  </p>
                </div>
                <Button
                  variant="accent"
                  className="rounded-full"
                  onClick={() => fileInputRef.current?.click()}
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
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create intake brief"
        description={`${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleCreateBrief}
              disabled={!draft.clientId || selectedFiles.length === 0}
            >
              Create brief
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[var(--border)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
              Attached files
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--foreground-muted)]">
              {selectedFiles.map((file) => (
                <li key={file.name}>
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Client</label>
            <select
              value={draft.clientId}
              onChange={(event) =>
                setDraft((current) => ({ ...current, clientId: event.target.value }))
              }
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Brief title</label>
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Channel</label>
              <Input
                value={draft.channel}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, channel: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Estimated pages</label>
              <Input
                inputMode="numeric"
                value={draft.pages}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, pages: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Owner email</label>
              <Input
                type="email"
                value={draft.ownerEmail}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, ownerEmail: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Source type</label>
              <select
                value={draft.sourceType}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, sourceType: event.target.value }))
                }
                className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
              >
                <option value="upload">upload</option>
                <option value="email">email</option>
                <option value="api">api</option>
                <option value="manual">manual</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
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
