import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ThroughputChart({
  throughput,
}: {
  throughput: { day: string; campaigns: number }[];
}) {
  const max = Math.max(...throughput.map((item) => item.campaigns));

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
          Throughput
        </p>
        <CardTitle>Weekly output</CardTitle>
        <CardDescription>
          Campaign package volume over the past seven days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-56 items-end gap-3">
          {throughput.map((item) => (
            <div key={item.day} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-44 w-full items-end rounded-[20px] bg-[var(--surface-muted)] p-2">
                <div
                  className="w-full rounded-[14px] bg-[linear-gradient(180deg,var(--accent),#7c9b13)]"
                  style={{ height: `${(item.campaigns / max) * 100}%` }}
                />
              </div>
              <div className="text-center">
                <p className="font-medium">{item.campaigns}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                  {item.day}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
