import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SETTINGS_GROUPS } from "../components/data";

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
        {SETTINGS_GROUPS.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--foreground-muted)]">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[18px] bg-[var(--surface-muted)] px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
