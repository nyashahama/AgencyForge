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
import { type PortalWorkspace } from "../components/data";
import { useMockDashboard } from "../components/mock-state";

export default function PortalPage() {
  const { portals, savePortal, togglePortalShare } = useMockDashboard();
  const [selectedPortal, setSelectedPortal] = useState<PortalWorkspace | null>(null);

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Portal"
        title="White-label delivery"
        description="Manage client-facing workspaces, review modes, and publish state for delivery presentation."
        tone="from-emerald-300/20 to-transparent"
      />
      <div className="space-y-6">
        <DashboardKpiGrid
          items={[
            {
              label: "Published portals",
              value: `${portals.filter((workspace) => workspace.shareState === "Published").length}`,
              note: "Client workspaces currently live",
            },
            {
              label: "Draft portals",
              value: `${portals.filter((workspace) => workspace.shareState === "Draft").length}`,
              note: "Spaces still being prepared for sharing",
            },
            {
              label: "Review patterns",
              value: "3",
              note: "Distinct approval flows configured across clients",
            },
            {
              label: "Last publish",
              value: "10:22",
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
                    onClick={() => togglePortalShare(workspace.id)}
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
        description="Adjust the mock white-label delivery settings."
        footer={
          selectedPortal ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedPortal(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                onClick={() => {
                  savePortal(selectedPortal.id, selectedPortal);
                  setSelectedPortal(null);
                }}
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
