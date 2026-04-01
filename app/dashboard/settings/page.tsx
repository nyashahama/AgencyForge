import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Settings"
        title="Workspace controls"
        description="Configure brand defaults, notifications, and governance for the team."
        tone="from-rose-300/20 to-transparent"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {["Brand tokens", "Notification rules", "Team permissions"].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
              <CardDescription>Configuration area</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--foreground-muted)]">
              Settings are structured for controlled changes and auditability.
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
