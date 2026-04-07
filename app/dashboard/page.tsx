"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import DashboardShell from "./components/DashboardShell";
import StatsBar from "./components/StatsBar";
import CampaignTable from "./components/CampaignTable";
import AgentStatus from "./components/AgentStatus";
import ActivityFeed from "./components/ActivityFeed";
import ThroughputChart from "./components/ThroughputChart";
import DashboardPageIntro from "./components/DashboardPageIntro";
import DashboardKpiGrid from "./components/DashboardKpiGrid";
import { useAuth } from "@/lib/auth/session";
import { campaigns as campaignsApi, analytics as analyticsApi, workspace as workspaceApi } from "@/lib/api/endpoints";
import type { CampaignSummary, DashboardAnalytics, ThroughputDatum, SpecialistLoad, ActivityItem } from "@/lib/api/client";

type Campaign = {
  id: string;
  clientId: string;
  client: string;
  name: string;
  status: "review" | "generating" | "approved";
  statusLabel: string;
  progress: number;
  due: string;
  urgent: boolean;
  agents: string[];
  briefId: string;
  lead: string;
  budget: string;
  risk: "Low" | "Medium" | "High";
  deliverableCount: number;
};

type Agent = {
  name: string;
  status: string;
  load: number;
  color: string;
};

type Activity = {
  id: number;
  type: string;
  text: string;
  time: string;
  icon: string;
};

function mapCampaignStatus(status: string): "review" | "generating" | "approved" {
  switch (status) {
    case "generating":
      return "generating";
    case "review":
      return "review";
    case "approved":
      return "approved";
    default:
      return "generating";
  }
}

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

function mapApiCampaign(c: CampaignSummary): Campaign {
  return {
    id: c.id,
    clientId: c.client_id,
    client: c.client_name,
    name: c.name,
    status: mapCampaignStatus(c.status),
    statusLabel: getStatusLabel(c.status),
    progress: c.progress,
    due: c.due_at ? new Date(c.due_at).toLocaleDateString() : "No due date",
    urgent: false,
    agents: c.specialists,
    briefId: c.brief_id ?? "",
    lead: c.owner_email,
    budget: c.budget_currency === "USD" ? `$${Math.round(c.budget_cents / 100)}` : `${c.budget_currency} ${Math.round(c.budget_cents / 100)}`,
    risk: (c.risk_level?.toLowerCase() as "low" | "medium" | "high") === "high" ? "High" : c.risk_level?.toLowerCase() === "medium" ? "Medium" : "Low",
    deliverableCount: c.deliverable_count,
  };
}

function mapApiAgent(s: SpecialistLoad): Agent {
  return {
    name: s.specialist_name || s.specialist_code,
    status: s.active_assignments > 0 ? "active" : "idle",
    load: s.load_units,
    color: s.active_assignments > 0 ? "#c8ff00" : "#d4d0c8",
  };
}

function mapApiActivity(a: ActivityItem): Activity {
  const iconMap: Record<string, string> = {
    "campaign.created": "⚡",
    "campaign.updated": "✦",
    "campaign.advanced": "⊙",
    "brief.created": "↑",
    "client.created": "✦",
  };

  return {
    id: parseInt(a.id) || Date.now(),
    type: a.event_type,
    text: a.message,
    time: new Date(a.occurred_at).toLocaleTimeString(),
    icon: iconMap[a.event_type] || "⊙",
  };
}

export default function Dashboard() {
  const { accessToken, user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [throughput, setThroughput] = useState<ThroughputDatum[]>([]);
  const [specialists, setSpecialists] = useState<Agent[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const [campaignsData, analyticsData, throughputData, specialistsData, activityData] = await Promise.all([
        campaignsApi.list(accessToken),
        analyticsApi.dashboard(accessToken),
        analyticsApi.throughput(accessToken),
        analyticsApi.specialists(accessToken),
        workspaceApi.activity.list(accessToken),
      ]);

      setCampaigns(campaignsData.map(mapApiCampaign));
      setAnalytics(analyticsData);
      setThroughput(throughputData);
      setSpecialists(specialistsData.map(mapApiAgent));
      setActivity(activityData.map(mapApiActivity).slice(0, 7));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

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

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-[var(--foreground-muted)]">{error}</p>
          <Button variant="accent" onClick={fetchData}>
            Retry
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const filteredCampaigns = campaignFilter === "all"
    ? campaigns
    : campaigns.filter((c) => c.status === campaignFilter);

  const liveCampaigns = campaigns.filter((c) => c.status !== "approved").length;
  const reviewsDue = campaigns.filter((c) => c.status === "review").length;
  const activeAgents = specialists.filter((a) => a.status === "active").length;

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow={user?.agency ?? "Operations"}
        title="Delivery overview"
        description="A unified view of briefs, campaign assembly, agent utilization, and client-facing activity."
        tone="from-lime-300/25 to-transparent"
      />
      <div className="space-y-6">
        <DashboardKpiGrid
          items={[
            {
              label: "Live delivery",
              value: String(liveCampaigns),
              note: "Campaigns currently assembling or awaiting review",
            },
            {
              label: "Reviews due",
              value: String(reviewsDue),
              note: "Client-facing approvals that need team attention",
            },
            {
              label: "Active agents",
              value: String(activeAgents),
              note: "Specialists currently allocated across workflow",
            },
            {
              label: "Approval rhythm",
              value: analytics ? `${Math.round((campaigns.filter(c => c.status === "approved").length / Math.max(campaigns.length, 1)) * 100)}%` : "—",
              note: "First-pass approval rate across managed work",
            },
          ]}
        />
        <StatsBar stats={[
          {
            label: "Active campaigns",
            value: String(campaigns.length),
            delta: "+3 this week",
            tag: "Live",
          },
          {
            label: "Briefs processed",
            value: String(analytics?.briefs_in_intake ?? 0),
            delta: "+18 this month",
            tag: "Lifetime",
          },
          {
            label: "Client approval rate",
            value: "98%",
            delta: "+2% vs last month",
            tag: "Rate",
          },
          {
            label: "Avg. turnaround",
            value: "4.2h",
            delta: "−0.6h vs last month",
            tag: "Speed",
          },
        ]} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <CampaignTable
              campaigns={filteredCampaigns}
              filter={campaignFilter}
              setFilter={setCampaignFilter}
              onSelectCampaign={setSelectedCampaign}
              onAdvanceCampaign={handleAdvanceCampaign}
            />
            <ThroughputChart throughput={throughput.map(t => ({ day: t.day, campaigns: t.campaigns }))} />
          </div>
          <div className="space-y-6">
            <AgentStatus agents={specialists} />
            <ActivityFeed activity={activity} />
          </div>
        </div>
      </div>
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
              {selectedCampaign.status !== "approved" ? (
                <Button
                  variant="accent"
                  onClick={() => {
                    handleAdvanceCampaign(selectedCampaign.id);
                    setSelectedCampaign(null);
                  }}
                >
                  Advance workflow
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {selectedCampaign ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                Lead
              </p>
              <p className="mt-2">{selectedCampaign.lead}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                Budget
              </p>
              <p className="mt-2">{selectedCampaign.budget}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                Due
              </p>
              <p className="mt-2">{selectedCampaign.due}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                Specialists
              </p>
              <p className="mt-2">{selectedCampaign.agents.join(", ")}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
