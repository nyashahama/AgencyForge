"use client";

import { useState } from "react";
import DashboardShell from "./components/DashboardShell";
import StatsBar from "./components/StatsBar";
import CampaignTable from "./components/CampaignTable";
import AgentStatus from "./components/AgentStatus";
import ActivityFeed from "./components/ActivityFeed";
import ThroughputChart from "./components/ThroughputChart";
import DashboardPageIntro from "./components/DashboardPageIntro";
import { ACTIVITY, AGENTS, CAMPAIGNS, STATS, THROUGHPUT } from "./components/data";

export default function Dashboard() {
  const [campaignFilter, setCampaignFilter] = useState("all");

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Operations"
        title="Delivery overview"
        description="A unified view of briefs, campaign assembly, agent utilization, and client-facing activity."
        tone="from-lime-300/25 to-transparent"
      />
      <div className="space-y-6">
        <StatsBar stats={STATS} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <CampaignTable
              campaigns={CAMPAIGNS}
              filter={campaignFilter}
              setFilter={setCampaignFilter}
            />
            <ThroughputChart throughput={THROUGHPUT} />
          </div>
          <div className="space-y-6">
            <AgentStatus agents={AGENTS} />
            <ActivityFeed activity={ACTIVITY} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
