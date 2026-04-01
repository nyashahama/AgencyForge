"use client";

import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import ThroughputChart from "../components/ThroughputChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMockDashboard } from "../components/mock-state";

export default function AnalyticsPage() {
  const { agents, campaigns, throughput, simulateAnalytics } = useMockDashboard();
  const [mode, setMode] = useState<"throughput" | "utilization">("throughput");
  const chartData =
    mode === "throughput"
      ? throughput
      : agents.slice(0, 7).map((agent) => ({ day: agent.name.slice(0, 3), campaigns: agent.load }));

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
              value: `${throughput.reduce((sum, item) => sum + item.campaigns, 0)}`,
              note: "Campaign packages produced across the last seven days",
            },
            {
              label: "Avg. completion",
              value: `${Math.round(campaigns.reduce((sum, campaign) => sum + campaign.progress, 0) / campaigns.length)}%`,
              note: "Mean progress across active and approved campaigns",
            },
            {
              label: "Active specialists",
              value: `${agents.filter((agent) => agent.status === "active").length}`,
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
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={mode === "throughput" ? "default" : "ghost"}
                onClick={() => setMode("throughput")}
              >
                Throughput
              </Button>
              <Button
                size="sm"
                variant={mode === "utilization" ? "default" : "ghost"}
                onClick={() => setMode("utilization")}
              >
                Utilization
              </Button>
              <Button size="sm" variant="accent" onClick={simulateAnalytics}>
                Refresh forecast
              </Button>
            </div>
            <ThroughputChart throughput={chartData} />
          </div>
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
                {agents
                  .slice()
                  .sort((a, b) => b.load - a.load)
                  .slice(0, 2)
                  .map((agent) => agent.name)
                  .join(" and ")}{" "}
                remain the highest-utilization specialists.
              </div>
              <div className="rounded-[22px] border border-[var(--border)] p-4">
                Same-day delivery is now the default for {campaigns.filter((campaign) => campaign.progress > 70).length} campaigns.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
