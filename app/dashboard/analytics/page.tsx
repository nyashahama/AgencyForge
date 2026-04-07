"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import ThroughputChart from "../components/ThroughputChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/session";
import { analytics as analyticsApi } from "@/lib/api/endpoints";
import type { ThroughputDatum, SpecialistLoad, DashboardAnalytics } from "@/lib/api/client";

type Agent = {
  name: string;
  status: string;
  load: number;
  color: string;
};

function mapApiAgent(s: SpecialistLoad): Agent {
  return {
    name: s.specialist_name || s.specialist_code,
    status: s.active_assignments > 0 ? "active" : "idle",
    load: s.load_units,
    color: s.active_assignments > 0 ? "#c8ff00" : "#d4d0c8",
  };
}

export default function AnalyticsPage() {
  const { accessToken } = useAuth();
  const [campaigns, setCampaigns] = useState<{ progress: number; status: string }[]>([]);
  const [throughput, setThroughput] = useState<ThroughputDatum[]>([]);
  const [specialists, setSpecialists] = useState<Agent[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"throughput" | "utilization">("throughput");

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [dashboardData, throughputData, specialistsData] = await Promise.all([
        analyticsApi.dashboard(accessToken),
        analyticsApi.throughput(accessToken),
        analyticsApi.specialists(accessToken),
      ]);
      setAnalytics(dashboardData);
      setThroughput(throughputData);
      setSpecialists(specialistsData.map(mapApiAgent));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  const chartData =
    mode === "throughput"
      ? throughput
      : specialists.slice(0, 7).map((agent) => ({ day: agent.name.slice(0, 3), campaigns: agent.load }));

  const weeklyOutput = throughput.reduce((sum, item) => sum + item.campaigns, 0);
  const avgCompletion = campaigns.length > 0 ? Math.round(campaigns.reduce((sum, c) => sum + c.progress, 0) / campaigns.length) : 0;
  const activeSpecialists = specialists.filter((a) => a.status === "active").length;

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
              value: String(weeklyOutput),
              note: "Campaign packages produced across the last seven days",
            },
            {
              label: "Avg. completion",
              value: `${avgCompletion}%`,
              note: "Mean progress across active and approved campaigns",
            },
            {
              label: "Active specialists",
              value: String(activeSpecialists),
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
              <Button size="sm" variant="accent" onClick={fetchData}>
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
                {specialists
                  .slice()
                  .sort((a, b) => b.load - a.load)
                  .slice(0, 2)
                  .map((agent) => agent.name)
                  .join(" and ")}{" "}
                remain the highest-utilization specialists.
              </div>
              <div className="rounded-[22px] border border-[var(--border)] p-4">
                Same-day delivery is now the default for {campaigns.filter((c) => c.progress > 70).length} campaigns.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
