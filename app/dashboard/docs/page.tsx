"use client";

import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { type Playbook } from "../components/data";
import { useMockDashboard } from "../components/mock-state";

export default function DocsPage() {
  const { playbooks, savePlaybook, user } = useMockDashboard();
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    category: "Operations",
  });

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
              value: `${playbooks.filter((playbook) => playbook.status === "published").length}`,
              note: "Playbooks available to the team today",
            },
            {
              label: "Drafting",
              value: `${playbooks.filter((playbook) => playbook.status === "draft").length}`,
              note: "Docs still in progress or under review",
            },
            {
              label: "Owners",
              value: `${new Set(playbooks.map((playbook) => playbook.owner)).size}`,
              note: "People responsible for operating knowledge",
            },
            {
              label: "Coverage",
              value: "4",
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
        description="Create a mock operating document record."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                if (!draft.name) return;
                savePlaybook({
                  id: "new",
                  name: draft.name,
                  category: draft.category,
                  owner: user.name,
                  updated: "Just now",
                  status: "draft",
                });
                setCreateOpen(false);
                setDraft({ name: "", category: "Operations" });
              }}
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
        description="Edit the mock system playbook metadata."
        footer={
          selectedPlaybook ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedPlaybook(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                onClick={() => {
                  savePlaybook(selectedPlaybook);
                  setSelectedPlaybook(null);
                }}
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
                      ? { ...current, status: event.target.value as Playbook["status"] }
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
