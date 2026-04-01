import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CAMPAIGNS } from "../components/data";

export default function CampaignsPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Campaigns"
        title="Execution board"
        description="Track live work by client, review status, and delivery readiness."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {CAMPAIGNS.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription>{campaign.client}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--foreground-muted)]">
              <p>Status: {campaign.statusLabel}</p>
              <p>Due: {campaign.due}</p>
              <p>Agents: {campaign.agents.join(", ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
