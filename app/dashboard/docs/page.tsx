import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import StatusPill from "../components/StatusPill";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PLAYBOOKS } from "../components/data";

export default function DocsPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Docs"
        title="System playbooks"
        description="Operational guidance for intake, approvals, legal checks, and team workflows."
        tone="from-violet-300/20 to-transparent"
      />
      <div className="space-y-6">
        <DashboardKpiGrid
          items={[
            {
              label: "Published",
              value: `${PLAYBOOKS.filter((playbook) => playbook.status === "published").length}`,
              note: "Playbooks available to the team today",
            },
            {
              label: "Drafting",
              value: `${PLAYBOOKS.filter((playbook) => playbook.status === "draft").length}`,
              note: "Docs still in progress or under review",
            },
            {
              label: "Owners",
              value: `${new Set(PLAYBOOKS.map((playbook) => playbook.owner)).size}`,
              note: "People responsible for operating knowledge",
            },
            {
              label: "Coverage",
              value: "4",
              note: "Distinct operating categories represented",
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {PLAYBOOKS.map((playbook) => (
            <Card key={playbook.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{playbook.name}</CardTitle>
                    <CardDescription>{playbook.category}</CardDescription>
                  </div>
                  <StatusPill
                    label={playbook.status}
                    tone={playbook.status === "published" ? "success" : "warning"}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--foreground-muted)]">
                <p>Owner: {playbook.owner}</p>
                <p>Updated: {playbook.updated}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
