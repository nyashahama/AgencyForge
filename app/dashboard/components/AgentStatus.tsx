import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentStatus({
  agents,
}: {
  agents: { name: string; status: string; load: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
          Specialist pool
        </p>
        <CardTitle>Agent status</CardTitle>
        <CardDescription>
          Live load distribution across the workflow graph.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.name} className="rounded-[22px] border border-[var(--border)] p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{agent.name}</p>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-soft)]">
                {agent.status}
              </span>
            </div>
            <div className="mt-3 rounded-full bg-[var(--surface-muted)]">
              <div
                className="h-2 rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.max(agent.load, 1) * 20}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              {agent.load} active tasks
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
