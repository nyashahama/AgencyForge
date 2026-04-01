import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CAMPAIGNS } from "../components/data";

export default function CampaignsPage() {
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
              value: `${CAMPAIGNS.filter((campaign) => campaign.status === "review").length}`,
              note: "Client-facing approvals in motion",
            },
            {
              label: "Generating",
              value: `${CAMPAIGNS.filter((campaign) => campaign.status === "generating").length}`,
              note: "Campaign packages still assembling",
            },
            {
              label: "High risk",
              value: `${CAMPAIGNS.filter((campaign) => campaign.risk === "High").length}`,
              note: "Projects with a delivery or scope concern",
            },
            {
              label: "Deliverables",
              value: `${CAMPAIGNS.reduce((sum, campaign) => sum + campaign.deliverableCount, 0)}`,
              note: "Outputs currently under active management",
            },
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Campaign board</CardTitle>
            <CardDescription>
              Review each campaign by state, ownership, budget, and risk profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {CAMPAIGNS.map((campaign) => (
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
    </DashboardShell>
  );
}
