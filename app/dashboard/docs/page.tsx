"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { useAuth } from "@/lib/auth/session";
import { workspace } from "@/lib/api/endpoints";
import type { Playbook } from "@/lib/api/client";

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function mapApiPlaybook(p: Playbook) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    owner: p.owner_name,
    status: p.status as "published" | "draft",
    updated: formatTimeAgo(p.updated_at),
  };
}

export default function DocsPage() {
  const { accessToken, user } = useAuth();
  const [playbooks, setPlaybooks] = useState<ReturnType<typeof mapApiPlaybook>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaybook, setSelectedPlaybook] = useState<ReturnType<typeof mapApiPlaybook> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    category: "Operations",
  });

  const fetchPlaybooks = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await workspace.playbooks.list(accessToken);
      setPlaybooks(data.map(mapApiPlaybook));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playbooks");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

  const handleCreatePlaybook = async () => {
    if (!accessToken || !draft.name) return;
    try {
      await workspace.playbooks.create({
        name: draft.name,
        category: draft.category,
        status: "draft",
      }, accessToken);
      setCreateOpen(false);
      setDraft({ name: "", category: "Operations" });
      await fetchPlaybooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create playbook");
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

  const publishedCount = playbooks.filter((p) => p.status === "published").length;
  const draftCount = playbooks.filter((p) => p.status === "draft").length;
  const ownerCount = new Set(playbooks.map((p) => p.owner)).size;

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Docs"
        title="System playbooks"
        description="Operational guidance for intake, approvals, legal checks, and team workflows."
        tone="from-violet-300/20 to-transparent"
      />
      <div className="space-y-6">
        <DashboardKpiGrid
          items={[
            {
              label: "Published",
              value: String(publishedCount),
              note: "Playbooks available to the team today",
            },
            {
              label: "Drafting",
              value: String(draftCount),
              note: "Docs still in progress or under review",
            },
            {
              label: "Owners",
              value: String(ownerCount),
              note: "People responsible for operating knowledge",
            },
            {
              label: "Coverage",
              value: String(playbooks.length),
              note: "Distinct operating categories represented",
            },
          ]}
        />
        <div className="flex justify-end">
          <Button variant="accent" className="rounded-full" onClick={() => setCreateOpen(true)}>
            New playbook
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {playbooks.map((playbook) => (
            <Card key={playbook.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{playbook.name}</CardTitle>
                    <CardDescription>{playbook.category}</CardDescription>
                  </div>
                  <StatusPill
                    label={playbook.status}
                    tone={playbook.status === "published" ? "success" : "warning"}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--foreground-muted)]">
                <p>Owner: {playbook.owner}</p>
                <p>Updated: {playbook.updated}</p>
                <div className="pt-2">
                  <Button size="sm" variant="subtle" onClick={() => setSelectedPlaybook(playbook)}>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New playbook"
        description="Create a new operating document."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleCreatePlaybook}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Name</label>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <Input
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({ ...current, category: event.target.value }))
              }
            />
          </div>
        </div>
      </Modal>
      <Modal
        open={Boolean(selectedPlaybook)}
        onClose={() => setSelectedPlaybook(null)}
        title={selectedPlaybook?.name ?? "Playbook"}
        description="Edit the playbook metadata."
        footer={
          selectedPlaybook ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedPlaybook(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                onClick={() => setSelectedPlaybook(null)}
              >
                Save playbook
              </Button>
            </>
          ) : null
        }
      >
        {selectedPlaybook ? (
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <Input
                value={selectedPlaybook.name}
                onChange={(event) =>
                  setSelectedPlaybook((current) =>
                    current ? { ...current, name: event.target.value } : current,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <select
                value={selectedPlaybook.status}
                onChange={(event) =>
                  setSelectedPlaybook((current) =>
                    current
                      ? { ...current, status: event.target.value as "published" | "draft" }
                      : current,
                  )
                }
                className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
              >
                <option value="published">published</option>
                <option value="draft">draft</option>
              </select>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
