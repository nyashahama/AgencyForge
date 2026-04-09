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
import { campaigns as campaignsApi, clients as clientsApi } from "@/lib/api/endpoints";
import type { CampaignSummary, Client } from "@/lib/api/client";

type CampaignStatus = "review" | "generating" | "approved" | "draft" | "paused" | "cancelled";
type RiskLevel = "Low" | "Medium" | "High";

function getStatusLabel(status: string): string {
  switch (status) {
    case "generating":
      return "Generating";
    case "review":
      return "Pending review";
    case "approved":
      return "Approved";
    case "draft":
      return "Draft";
    case "paused":
      return "Paused";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function formatCurrency(cents: number, currency: string): string {
  if (currency === "USD") return `$${Math.round(cents / 100)}`;
  return `${currency} ${Math.round(cents / 100)}`;
}

function formatDue(dueAt: string | undefined): string {
  if (!dueAt) return "No due date";
  const date = new Date(dueAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  return date.toLocaleDateString();
}

function mapApiCampaign(c: CampaignSummary) {
  return {
    id: c.id,
    clientId: c.client_id,
    client: c.client_name,
    name: c.name,
    status: c.status as CampaignStatus,
    statusLabel: getStatusLabel(c.status),
    progress: c.progress,
    due: formatDue(c.due_at),
    dueAt: c.due_at,
    dueInput: c.due_at ? c.due_at.slice(0, 10) : "",
    briefId: c.brief_id ?? "",
    lead: c.owner_email,
    budget: formatCurrency(c.budget_cents, c.budget_currency),
    budgetCents: c.budget_cents,
    budgetCurrency: c.budget_currency,
    risk: (c.risk_level?.toLowerCase() as "low" | "medium" | "high") === "high" ? "High" as RiskLevel : c.risk_level?.toLowerCase() === "medium" ? "Medium" as RiskLevel : "Low" as RiskLevel,
    deliverableCount: c.deliverable_count,
    agents: c.specialists,
  };
}

function mapApiClient(c: Client) {
  return {
    id: c.id,
    name: c.name,
  };
}

export default function CampaignsPage() {
  const { accessToken } = useAuth();
  const [campaigns, setCampaigns] = useState<ReturnType<typeof mapApiCampaign>[]>([]);
  const [clients, setClients] = useState<ReturnType<typeof mapApiClient>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<ReturnType<typeof mapApiCampaign> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    clientId: "",
    name: "",
    budget: "",
    due: "",
    briefId: "",
  });

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [campaignsData, clientsData] = await Promise.all([
        campaignsApi.list(accessToken),
        clientsApi.list(accessToken),
      ]);
      setCampaigns(campaignsData.map(mapApiCampaign));
      setClients(clientsData.map(mapApiClient));
      if (clientsData.length > 0 && !draft.clientId) {
        setDraft((d) => ({ ...d, clientId: clientsData[0].id }));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [accessToken, draft.clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdvanceCampaign = async (campaignId: string) => {
    if (!accessToken) return;
    try {
      await campaignsApi.advance(campaignId, {}, accessToken);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to advance campaign");
    }
  };

  const handleCreateCampaign = async () => {
    if (!accessToken || !draft.name || !draft.clientId) return;
    try {
      const budgetStr = draft.budget.replace(/[^0-9]/g, "");
      const budgetCents = budgetStr ? parseInt(budgetStr, 10) * 100 : 0;
      await campaignsApi.create({
        client_id: draft.clientId,
        name: draft.name,
        budget_cents: budgetCents,
        due_at: draft.due ? new Date(draft.due).toISOString() : undefined,
      }, accessToken);
      setCreateOpen(false);
      setDraft({ clientId: clients[0]?.id ?? "", name: "", budget: "", due: "", briefId: "" });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    }
  };

  const handleSaveCampaign = async () => {
    if (!accessToken || !selectedCampaign) return;

    try {
      const budgetValue = selectedCampaign.budget.replace(/[^0-9]/g, "");
      await campaignsApi.update(
        selectedCampaign.id,
        {
          name: selectedCampaign.name,
          budget_cents: budgetValue ? parseInt(budgetValue, 10) * 100 : 0,
          due_at: selectedCampaign.dueInput
            ? new Date(`${selectedCampaign.dueInput}T00:00:00.000Z`).toISOString()
            : "",
        },
        accessToken,
      );
      setSelectedCampaign(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save campaign");
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

  const reviewCount = campaigns.filter((c) => c.status === "review").length;
  const generatingCount = campaigns.filter((c) => c.status === "generating").length;
  const highRiskCount = campaigns.filter((c) => c.risk === "High").length;
  const totalDeliverables = campaigns.reduce((sum, c) => sum + c.deliverableCount, 0);

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Campaigns"
        title="Execution board"
        description="Track live work by client, review status, delivery readiness, and operating risk."
        tone="from-fuchsia-400/20 to-transparent"
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
              label: "Pending review",
              value: String(reviewCount),
              note: "Client-facing approvals in motion",
            },
            {
              label: "Generating",
              value: String(generatingCount),
              note: "Campaign packages still assembling",
            },
            {
              label: "High risk",
              value: String(highRiskCount),
              note: "Projects with a delivery or scope concern",
            },
            {
              label: "Deliverables",
              value: String(totalDeliverables),
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
                        onClick={() => handleAdvanceCampaign(campaign.id)}
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
                    <p>Brief: {campaign.briefId || "Manual"}</p>
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
        description="Seed a new delivery workflow."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleCreateCampaign}
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
                onClick={handleSaveCampaign}
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
                type="date"
                value={selectedCampaign.dueInput}
                onChange={(event) =>
                  setSelectedCampaign((current) =>
                    current ? { ...current, dueInput: event.target.value } : current,
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
