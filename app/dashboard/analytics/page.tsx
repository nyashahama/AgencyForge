import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import ThroughputChart from "../components/ThroughputChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AGENTS, CAMPAIGNS, THROUGHPUT } from "../components/data";

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Analytics"
        title="Delivery analytics"
        description="Monitor pipeline performance, specialist allocation, and approval velocity across the operating layer."
        tone="from-amber-300/25 to-transparent"
      />
      <div className="space-y-6">
        <DashboardKpiGrid
          items={[
            {
              label: "Weekly output",
              value: `${THROUGHPUT.reduce((sum, item) => sum + item.campaigns, 0)}`,
              note: "Campaign packages produced across the last seven days",
            },
            {
              label: "Avg. completion",
              value: `${Math.round(CAMPAIGNS.reduce((sum, campaign) => sum + campaign.progress, 0) / CAMPAIGNS.length)}%`,
              note: "Mean progress across active and approved campaigns",
            },
            {
              label: "Active specialists",
              value: `${AGENTS.filter((agent) => agent.status === "active").length}`,
              note: "Parallel specialist lanes currently live",
            },
            {
              label: "Approval latency",
              value: "1.3d",
              note: "Average time from package ready to client approval",
            },
          ]}
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ThroughputChart throughput={THROUGHPUT} />
          <Card>
            <CardHeader>
              <CardTitle>Observed trends</CardTitle>
              <CardDescription>
                Current week highlights for leadership review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[var(--foreground-muted)]">
              <div className="rounded-[22px] border border-[var(--border)] p-4">
                Approval latency decreased by 18% week over week.
              </div>
              <div className="rounded-[22px] border border-[var(--border)] p-4">
                Copy and design remain the highest-utilization specialists.
              </div>
              <div className="rounded-[22px] border border-[var(--border)] p-4">
                Same-day delivery is now the default for mid-size briefs.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
