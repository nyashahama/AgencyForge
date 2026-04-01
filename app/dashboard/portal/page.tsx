import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PORTAL_WORKSPACES } from "../components/data";

export default function PortalPage() {
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
              value: `${PORTAL_WORKSPACES.filter((workspace) => workspace.shareState === "Published").length}`,
              note: "Client workspaces currently live",
            },
            {
              label: "Draft portals",
              value: `${PORTAL_WORKSPACES.filter((workspace) => workspace.shareState === "Draft").length}`,
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
          {PORTAL_WORKSPACES.map((workspace) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
