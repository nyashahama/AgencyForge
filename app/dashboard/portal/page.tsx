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
import { portals as portalsApi } from "@/lib/api/endpoints";
import type { Portal } from "@/lib/api/client";

function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "Never";
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

function mapApiPortal(p: Portal) {
  return {
    id: p.id,
    clientId: p.client_id,
    name: p.name,
    theme: p.theme,
    reviewMode: p.review_mode,
    shareState: p.share_state === "published" ? "Published" : "Draft",
    lastPublished: formatTimeAgo(p.last_published_at ?? p.published_at),
    description: p.description,
  };
}

export default function PortalPage() {
  const { accessToken } = useAuth();
  const [portals, setPortals] = useState<ReturnType<typeof mapApiPortal>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortal, setSelectedPortal] = useState<ReturnType<typeof mapApiPortal> | null>(null);

  const fetchPortals = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await portalsApi.list(accessToken);
      setPortals(data.map(mapApiPortal));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portals");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPortals();
  }, [fetchPortals]);

  const handleToggleShare = async (portalId: string, currentState: string) => {
    if (!accessToken) return;
    try {
      if (currentState === "Published") {
        await portalsApi.update(portalId, { share_state: "draft" }, accessToken);
      } else {
        await portalsApi.publish(portalId, {}, accessToken);
      }
      await fetchPortals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update portal");
    }
  };

  const handleSavePortal = async () => {
    if (!accessToken || !selectedPortal) return;
    try {
      await portalsApi.update(
        selectedPortal.id,
        {
          theme: selectedPortal.theme,
          review_mode: selectedPortal.reviewMode,
        },
        accessToken,
      );
      setSelectedPortal(null);
      await fetchPortals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save portal");
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

  const publishedCount = portals.filter((p) => p.shareState === "Published").length;
  const draftCount = portals.filter((p) => p.shareState === "Draft").length;

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Portal"
        title="White-label delivery"
        description="Manage client-facing workspaces, review modes, and publish state for delivery presentation."
        tone="from-emerald-300/20 to-transparent"
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
              label: "Published portals",
              value: String(publishedCount),
              note: "Client workspaces currently live",
            },
            {
              label: "Draft portals",
              value: String(draftCount),
              note: "Spaces still being prepared for sharing",
            },
            {
              label: "Review patterns",
              value: String(portals.length),
              note: "Distinct approval flows configured across clients",
            },
            {
              label: "Last publish",
              value: portals[0]?.lastPublished ?? "—",
              note: "Most recent portal publish timestamp today",
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {portals.map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{workspace.name}</CardTitle>
                    <CardDescription>{workspace.theme}</CardDescription>
                  </div>
                  <StatusPill
                    label={workspace.shareState}
                    tone={workspace.shareState === "Published" ? "success" : "warning"}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--foreground-muted)]">
                <p>Review mode: {workspace.reviewMode}</p>
                <p>Last published: {workspace.lastPublished}</p>
                <p>Delivery state: ready for branded presentation and approvals.</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="subtle" onClick={() => setSelectedPortal(workspace)}>
                    Configure
                  </Button>
                  <Button
                    size="sm"
                    variant={workspace.shareState === "Published" ? "ghost" : "accent"}
                    onClick={() => handleToggleShare(workspace.id, workspace.shareState)}
                  >
                    {workspace.shareState === "Published" ? "Revert to draft" : "Publish"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Modal
        open={Boolean(selectedPortal)}
        onClose={() => setSelectedPortal(null)}
        title={selectedPortal?.name ?? "Portal"}
        description="Adjust white-label delivery settings."
        footer={
          selectedPortal ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedPortal(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                onClick={handleSavePortal}
              >
                Save portal
              </Button>
            </>
          ) : null
        }
      >
        {selectedPortal ? (
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Theme</label>
              <Input
                value={selectedPortal.theme}
                onChange={(event) =>
                  setSelectedPortal((current) =>
                    current ? { ...current, theme: event.target.value } : current,
                  )
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Review mode</label>
              <Input
                value={selectedPortal.reviewMode}
                onChange={(event) =>
                  setSelectedPortal((current) =>
                    current ? { ...current, reviewMode: event.target.value } : current,
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
