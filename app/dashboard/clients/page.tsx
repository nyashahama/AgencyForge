import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const clients = [
  ["Meridian Bank", "Q3 refresh in review", "4 open approvals"],
  ["Volta Footwear", "Launch assembly in progress", "2 active agents"],
  ["Helix Health", "Delivered campaign package", "Awaiting sign-off"],
];

export default function ClientsPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Clients"
        title="Client accounts"
        description="A concise view of active relationships, package status, and open approvals."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {clients.map(([name, status, note]) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle>{name}</CardTitle>
              <CardDescription>{status}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--foreground-muted)]">
              {note}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
