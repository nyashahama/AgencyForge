"use client";

import { useState } from "react";
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
import { STATS, type Campaign } from "./components/data";
import { useMockDashboard } from "./components/mock-state";

export default function Dashboard() {
  const { activity, agents, campaigns, throughput, advanceCampaign } = useMockDashboard();
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Operations"
        title="Delivery overview"
        description="A unified view of briefs, campaign assembly, agent utilization, and client-facing activity."
        tone="from-lime-300/25 to-transparent"
      />
      <div className="space-y-6">
        <DashboardKpiGrid
          items={[
            {
              label: "Live delivery",
              value: `${campaigns.filter((campaign) => campaign.status !== "approved").length}`,
              note: "Campaigns currently assembling or awaiting review",
            },
            {
              label: "Reviews due",
              value: `${campaigns.filter((campaign) => campaign.status === "review").length}`,
              note: "Client-facing approvals that need team attention",
            },
            {
              label: "Active agents",
              value: `${agents.filter((agent) => agent.status === "active").length}`,
              note: "Specialists currently allocated across workflow",
            },
            {
              label: "Approval rhythm",
              value: "98%",
              note: "First-pass approval rate across managed work",
            },
          ]}
        />
        <StatsBar stats={STATS} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <CampaignTable
              campaigns={campaigns}
              filter={campaignFilter}
              setFilter={setCampaignFilter}
              onSelectCampaign={setSelectedCampaign}
              onAdvanceCampaign={advanceCampaign}
            />
            <ThroughputChart throughput={throughput} />
          </div>
          <div className="space-y-6">
            <AgentStatus agents={agents} />
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
                    advanceCampaign(selectedCampaign.id);
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
