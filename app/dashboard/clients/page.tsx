import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CLIENTS } from "../components/data";

export default function ClientsPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Clients"
        title="Client accounts"
        description="Monitor relationship health, active delivery load, and approval pressure across accounts."
        tone="from-cyan-300/20 to-transparent"
      />
      <div className="space-y-6">
        <DashboardKpiGrid
          items={[
            {
              label: "Healthy accounts",
              value: `${CLIENTS.filter((client) => client.health === "strong").length}`,
              note: "Accounts currently moving without delivery friction",
            },
            {
              label: "Watchlist",
              value: `${CLIENTS.filter((client) => client.health !== "strong").length}`,
              note: "Accounts requiring tighter operational follow-up",
            },
            {
              label: "Open approvals",
              value: `${CLIENTS.reduce((sum, client) => sum + client.openApprovals, 0)}`,
              note: "Active client-side decisions still outstanding",
            },
            {
              label: "Retainer value",
              value: "$125k",
              note: "Monthly recurring revenue represented on this board",
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {CLIENTS.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{client.name}</CardTitle>
                    <CardDescription>Lead {client.lead}</CardDescription>
                  </div>
                  <StatusPill
                    label={client.health}
                    tone={
                      client.health === "strong"
                        ? "success"
                        : client.health === "watch"
                          ? "warning"
                          : "danger"
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[20px] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                      Campaigns
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{client.activeCampaigns}</p>
                  </div>
                  <div className="rounded-[20px] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                      Approvals
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{client.openApprovals}</p>
                  </div>
                  <div className="rounded-[20px] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                      MRR
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{client.mrr}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                    Last touchpoint
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    {client.lastTouchpoint}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                    Operating note
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    {client.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
