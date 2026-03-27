"use client";

import { useState } from "react";
import DashboardSidebar from "./components/DashboardSidebar";
import DashboardHeader from "./components/DashboardHeader";
import StatsBar from "./components/StatsBar";
import CampaignTable from "./components/CampaignTable";
import AgentStatus from "./components/AgentStatus";
import ActivityFeed from "./components/ActivityFeed";
import ThroughputChart from "./components/ThroughputChart";
import {
  USER,
  STATS,
  CAMPAIGNS,
  ACTIVITY,
  AGENTS,
  THROUGHPUT,
} from "./components/data";

export default function Dashboard() {
  const [campaignFilter, setCampaignFilter] = useState("all");

  return (
    <div className="db-root">
      <DashboardSidebar user={USER} agents={AGENTS} />

      <main className="db-main">
        <DashboardHeader user={USER} />

        <div className="db-body">
          <StatsBar stats={STATS} />

          <div className="db-grid">
            <div className="db-col-main">
              <CampaignTable
                campaigns={CAMPAIGNS}
                filter={campaignFilter}
                setFilter={setCampaignFilter}
              />
              <ThroughputChart throughput={THROUGHPUT} />
            </div>

            <div className="db-col-side">
              <AgentStatus agents={AGENTS} />
              <ActivityFeed activity={ACTIVITY} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
