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
import { type Campaign } from "../components/data";
import { useMockDashboard } from "../components/mock-state";

export default function CampaignsPage() {
  const { campaigns, clients, createCampaign, advanceCampaign, saveCampaign } = useMockDashboard();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    clientId: clients[0]?.id ?? "",
    name: "",
    budget: "$75k",
    due: "In 5 days",
    briefId: "manual",
  });

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Campaigns"
        title="Execution board"
        description="Track live work by client, review status, delivery readiness, and operating risk."
        tone="from-fuchsia-400/20 to-transparent"
      />
      <div className="space-y-6">
        <DashboardKpiGrid
          items={[
            {
              label: "Pending review",
              value: `${campaigns.filter((campaign) => campaign.status === "review").length}`,
              note: "Client-facing approvals in motion",
            },
            {
              label: "Generating",
              value: `${campaigns.filter((campaign) => campaign.status === "generating").length}`,
              note: "Campaign packages still assembling",
            },
            {
              label: "High risk",
              value: `${campaigns.filter((campaign) => campaign.risk === "High").length}`,
              note: "Projects with a delivery or scope concern",
            },
            {
              label: "Deliverables",
              value: `${campaigns.reduce((sum, campaign) => sum + campaign.deliverableCount, 0)}`,
              note: "Outputs currently under active management",
            },
          ]}
        />
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Campaign board</CardTitle>
              <CardDescription>
                Review each campaign by state, ownership, budget, and risk profile.
              </CardDescription>
            </div>
            <Button variant="accent" className="rounded-full" onClick={() => setCreateOpen(true)}>
              New campaign
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="grid gap-4 rounded-[24px] border border-[var(--border)] p-5 xl:grid-cols-[minmax(0,1fr)_220px_220px]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold tracking-[-0.03em]">
                      {campaign.name}
                    </p>
                    <StatusPill
                      label={campaign.statusLabel}
                      tone={
                        campaign.status === "approved"
                          ? "success"
                          : campaign.status === "review"
                            ? "warning"
                            : "info"
                      }
                    />
                  </div>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    {campaign.client} · Lead {campaign.lead} · Budget {campaign.budget}
                  </p>
                  <div className="mt-4 rounded-full bg-[var(--surface-muted)]">
                    <div
                      className="h-2 rounded-full bg-[var(--accent)]"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    {campaign.progress}% complete · {campaign.deliverableCount} deliverables
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="subtle" onClick={() => setSelectedCampaign(campaign)}>
                      Open
                    </Button>
                    {campaign.status !== "approved" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => advanceCampaign(campaign.id)}
                      >
                        Advance
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                    Operating detail
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--foreground-muted)]">
                    <p>Due: {campaign.due}</p>
                    <p>Brief link: {campaign.briefId}</p>
                    <p>Risk: {campaign.risk}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                    Specialist mix
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {campaign.agents.map((agent) => (
                      <span
                        key={agent}
                        className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create campaign"
        description="Seed a new delivery workflow using mock data."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                if (!draft.name) return;
                createCampaign(draft);
                setCreateOpen(false);
              }}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">Campaign name</label>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
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
            <label className="mb-2 block text-sm font-medium">Budget</label>
            <Input
              value={draft.budget}
              onChange={(event) =>
                setDraft((current) => ({ ...current, budget: event.target.value }))
              }
            />
          </div>
        </div>
      </Modal>
      <Modal
        open={Boolean(selectedCampaign)}
        onClose={() => setSelectedCampaign(null)}
        title={selectedCampaign?.name ?? "Campaign"}
        description={selectedCampaign ? `${selectedCampaign.client} · ${selectedCampaign.statusLabel}` : ""}
        footer={
          selectedCampaign ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedCampaign(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                onClick={() => {
                  saveCampaign(selectedCampaign.id, selectedCampaign);
                  setSelectedCampaign(null);
                }}
              >
                Save changes
              </Button>
            </>
          ) : null
        }
      >
        {selectedCampaign ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Campaign name</label>
              <Input
                value={selectedCampaign.name}
                onChange={(event) =>
                  setSelectedCampaign((current) =>
                    current ? { ...current, name: event.target.value } : current,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Budget</label>
              <Input
                value={selectedCampaign.budget}
                onChange={(event) =>
                  setSelectedCampaign((current) =>
                    current ? { ...current, budget: event.target.value } : current,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Due</label>
              <Input
                value={selectedCampaign.due}
                onChange={(event) =>
                  setSelectedCampaign((current) =>
                    current ? { ...current, due: event.target.value } : current,
                  )
                }
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
