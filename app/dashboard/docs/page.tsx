import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DocsPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Docs"
        title="System playbooks"
        description="Operational guidance for intake, approvals, legal checks, and team workflows."
        tone="from-violet-300/20 to-transparent"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {["Client onboarding", "Revision policy", "Legal review", "Media planning rubric", "Portal handoff", "Reporting cadence"].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
              <CardDescription>Internal documentation</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--foreground-muted)]">
              Template and guidance available for the team.
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
