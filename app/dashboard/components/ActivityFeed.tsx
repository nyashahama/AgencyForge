import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityFeed({
  activity,
}: {
  activity: { id: number; text: string; time: string; icon: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
          Signal
        </p>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Approval, generation, and comment events from the client layer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-[22px] border border-[var(--border)] p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-sm">
              {item.icon}
            </div>
            <div>
              <p className="text-sm leading-6">{item.text}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
