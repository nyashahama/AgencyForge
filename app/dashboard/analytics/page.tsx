import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import ThroughputChart from "../components/ThroughputChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { THROUGHPUT } from "../components/data";

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Analytics"
        title="Delivery analytics"
        description="Top-level throughput and performance signals for the operating model."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ThroughputChart throughput={THROUGHPUT} />
        <Card>
          <CardHeader>
            <CardTitle>Observed trends</CardTitle>
            <CardDescription>
              Current week highlights for leadership review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--foreground-muted)]">
            <p>Approval latency decreased by 18% week over week.</p>
            <p>Copy and design remain the highest-utilization specialists.</p>
            <p>Same-day delivery is now the default for mid-size briefs.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
