"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusPill from "./StatusPill";
import type { Campaign } from "./data";

export default function CampaignTable({
  campaigns,
  filter,
  setFilter,
  onSelectCampaign,
  onAdvanceCampaign,
}: {
  campaigns: Campaign[];
  filter: string;
  setFilter: (value: string) => void;
  onSelectCampaign: (campaign: Campaign) => void;
  onAdvanceCampaign: (campaignId: string) => void;
}) {
  const filters = ["all", "review", "generating", "approved"];
  const visible =
    filter === "all"
      ? campaigns
      : campaigns.filter((campaign) => campaign.status === filter);

  return (
    <Card>
      <CardHeader className="gap-4 border-b border-[var(--border)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
            Live pipeline
          </p>
          <CardTitle className="mt-2">Campaigns in motion</CardTitle>
          <CardDescription>
            Review current work, active specialists, and delivery windows.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item}
              variant={filter === item ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setFilter(item)}
            >
              {item === "all" ? "All" : item}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
              <tr>
                <th className="px-6 py-4 font-medium">Campaign</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Agents</th>
                <th className="px-6 py-4 font-medium">Progress</th>
                <th className="px-6 py-4 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((campaign) => (
                <tr key={campaign.id} className="border-t border-[var(--border)]">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-2 rounded-full ${
                          campaign.urgent ? "bg-rose-500" : "bg-[var(--accent)]"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-[var(--foreground-muted)]">
                          {campaign.client}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="subtle"
                            onClick={() => onSelectCampaign(campaign)}
                          >
                            Open
                          </Button>
                          {campaign.status !== "approved" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAdvanceCampaign(campaign.id)}
                            >
                              Advance
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
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
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      {campaign.agents.map((agent) => (
                        <span
                          key={agent}
                          className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs"
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="w-40 rounded-full bg-[var(--surface-muted)]">
                      <div
                        className="h-2 rounded-full bg-[var(--accent)]"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                      {campaign.progress}% complete
                    </p>
                  </td>
                  <td className="px-6 py-5 text-[var(--foreground-muted)]">{campaign.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
