import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PortalPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Portal"
        title="White-label delivery"
        description="Manage branded workspaces, review flow, and client-facing presentation quality."
      />
      <Card>
        <CardHeader>
          <CardTitle>Portal configuration</CardTitle>
          <CardDescription>
            Brand tokens, approval gates, and delivery defaults are ready to tune.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {["Branding", "Approval rules", "Share settings"].map((item) => (
            <div
              key={item}
              className="rounded-[22px] border border-[var(--border)] p-5 text-sm text-[var(--foreground-muted)]"
            >
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
