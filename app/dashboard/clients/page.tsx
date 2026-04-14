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
import { clients as clientsApi } from "@/lib/api/endpoints";
import type { Client } from "@/lib/api/client";

type ClientHealth = "strong" | "watch" | "risk";

function formatMrr(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function mapApiClient(c: Client) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    lead: c.lead_email,
    health: c.health as ClientHealth,
    notes: c.notes,
    mrr: formatMrr(c.mrr_cents),
    mrrCents: c.mrr_cents,
    openApprovals: c.open_approvals_count,
    lastTouchpoint: c.latest_touchpoint ?? "No activity",
    lastTouchpointAt: c.last_touchpoint_at,
  };
}

export default function ClientsPage() {
  const { accessToken } = useAuth();
  const [clients, setClients] = useState<ReturnType<typeof mapApiClient>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ReturnType<typeof mapApiClient> | null>(null);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    leadEmail: "",
    health: "strong" as ClientHealth,
    notes: "",
    mrr: "",
  });

  const fetchClients = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await clientsApi.list(accessToken);
      setClients(data.map(mapApiClient));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSaveClient = async () => {
    if (!accessToken || !selectedClient) return;

    try {
      await clientsApi.update(
        selectedClient.id,
        {
          health: selectedClient.health,
          notes: selectedClient.notes,
          touchpoint_note: note.trim() || undefined,
        },
        accessToken,
      );
      setSelectedClient(null);
      setNote("");
      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client");
    }
  };

  const handleCreateClient = async () => {
    if (!accessToken || !draft.name.trim() || !draft.leadEmail.trim()) return;

    try {
      const mrr = parseInt(draft.mrr.replace(/[^0-9]/g, ""), 10);
      await clientsApi.create(
        {
          name: draft.name.trim(),
          lead_email: draft.leadEmail.trim(),
          health: draft.health,
          notes: draft.notes.trim(),
          mrr_cents: Number.isNaN(mrr) ? 0 : mrr * 100,
        },
        accessToken,
      );

      setCreateOpen(false);
      setDraft({
        name: "",
        leadEmail: "",
        health: "strong",
        notes: "",
        mrr: "",
      });
      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    }
  };

  const healthyCount = clients.filter((c) => c.health === "strong").length;
  const watchCount = clients.filter((c) => c.health !== "strong").length;
  const totalApprovals = clients.reduce((sum, c) => sum + c.openApprovals, 0);
  const totalMrr = clients.reduce((sum, c) => sum + c.mrrCents, 0);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Clients"
        title="Client accounts"
        description="Monitor relationship health, active delivery load, and approval pressure across accounts."
        tone="from-cyan-300/20 to-transparent"
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
              label: "Healthy accounts",
              value: String(healthyCount),
              note: "Accounts currently moving without delivery friction",
            },
            {
              label: "Watchlist",
              value: String(watchCount),
              note: "Accounts requiring tighter operational follow-up",
            },
            {
              label: "Open approvals",
              value: String(totalApprovals),
              note: "Active client-side decisions still outstanding",
            },
            {
              label: "Retainer value",
              value: formatMrr(totalMrr),
              note: "Monthly recurring revenue represented on this board",
            },
          ]}
        />
        <div className="flex justify-end">
          <Button variant="accent" className="rounded-full" onClick={() => setCreateOpen(true)}>
            New client
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{client.name}</CardTitle>
                    <CardDescription>Lead {client.lead}</CardDescription>
                  </div>
                  <StatusPill
                    label={client.health}
                    tone={
                      client.health === "strong"
                        ? "success"
                        : client.health === "watch"
                          ? "warning"
                          : "danger"
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[20px] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                      MRR
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{client.mrr}</p>
                  </div>
                  <div className="rounded-[20px] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                      Approvals
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{client.openApprovals}</p>
                  </div>
                  <div className="rounded-[20px] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                      Notes
                    </p>
                    <p className="mt-2 text-sm truncate">{client.notes || "None"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                    Last touchpoint
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    {client.lastTouchpoint}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="subtle" onClick={() => setSelectedClient(client)}>
                    Manage
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
        title="Create client account"
        description="Add a new client profile to the operations workspace."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleCreateClient}
              disabled={!draft.name.trim() || !draft.leadEmail.trim()}
            >
              Create client
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Client name</label>
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Lead email</label>
            <Input
              type="email"
              value={draft.leadEmail}
              onChange={(event) =>
                setDraft((current) => ({ ...current, leadEmail: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Health</label>
            <select
              value={draft.health}
              onChange={(event) =>
                setDraft((current) => ({ ...current, health: event.target.value as ClientHealth }))
              }
              className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
            >
              <option value="strong">strong</option>
              <option value="watch">watch</option>
              <option value="risk">risk</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">MRR (USD)</label>
            <Input
              inputMode="numeric"
              value={draft.mrr}
              onChange={(event) =>
                setDraft((current) => ({ ...current, mrr: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Operating note</label>
            <Input
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>
        </div>
      </Modal>
      <Modal
        open={Boolean(selectedClient)}
        onClose={() => {
          setSelectedClient(null);
          setNote("");
        }}
        title={selectedClient?.name ?? "Client"}
        description={selectedClient ? `Lead ${selectedClient.lead}` : ""}
        footer={
          selectedClient ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedClient(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                onClick={handleSaveClient}
              >
                Save account
              </Button>
            </>
          ) : null
        }
      >
        {selectedClient ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Health</label>
              <select
                value={selectedClient.health}
                onChange={(event) =>
                  setSelectedClient((current) =>
                    current
                      ? { ...current, health: event.target.value as ClientHealth }
                      : current,
                  )
                }
                className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
              >
                <option value="strong">strong</option>
                <option value="watch">watch</option>
                <option value="risk">risk</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Operating note</label>
              <Input
                value={selectedClient.notes}
                onChange={(event) =>
                  setSelectedClient((current) =>
                    current ? { ...current, notes: event.target.value } : current,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">New touchpoint</label>
              <Input value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
