"use client";

import { useState } from "react";
import DashboardSidebar from "@/dashboard/DashboardSidebar";
import DashboardHeader from "@/dashboard/DashboardHeader";
import StatsBar from "@/dashboard/StatsBar";
import CampaignTable from "@/dashboard/CampaignTable";
import AgentStatus from "@/dashboard/AgentStatus";
import ActivityFeed from "@/dashboard/ActivityFeed";
import ThroughputChart from "@/dashboard/ThroughputChart";
import {
  USER,
  STATS,
  CAMPAIGNS,
  ACTIVITY,
  AGENTS,
  THROUGHPUT,
} from "@/dashboard/data";

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [campaignFilter, setCampaignFilter] = useState("all");

  return (
    <div className="db-root">
      <DashboardSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        user={USER}
        agents={AGENTS}
      />

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
