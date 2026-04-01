"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS } from "./navigation";

type User = {
  name: string;
  initials: string;
  role: string;
  agency: string;
  plan: string;
};

type Agent = {
  name: string;
  status: string;
  load: number;
};

export default function DashboardSidebar({
  user,
  agents,
}: {
  user: User;
  agents: Agent[];
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[280px] shrink-0 rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 text-[var(--card-strong-foreground)] xl:block">
      <Link href="/" className="flex items-center gap-3">
        <BrandMark />
        <div>
          <p className="text-sm font-semibold tracking-[-0.03em]">AgencyForge</p>
          <p className="text-xs text-white/55">{user.agency}</p>
        </div>
      </Link>

      <Badge variant="accent" className="mt-6 w-fit bg-white/8 text-[var(--accent)]">
        {agents.filter((agent) => agent.status === "active").length} active agents
      </Badge>

      <nav className="mt-8 space-y-1">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                active
                  ? "bg-white text-[var(--card-strong)] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                  : "text-white/60 hover:bg-white/6 hover:text-white",
              )}
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className={cn("text-[11px]", active ? "text-[var(--card-strong)]/55" : "text-white/35")}>
                  {item.eyebrow}
                </p>
              </div>
              {item.href === "/dashboard/briefs" ? (
                <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-foreground)]">
                  New
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-[24px] border border-white/8 bg-white/5 p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/45">
          Current plan
        </p>
        <p className="mt-3 text-xl font-semibold">{user.plan}</p>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Throughput tuned for multi-client delivery with white-label sharing.
        </p>
      </div>

      <div className="mt-8 border-t border-white/8 pt-5">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-[var(--accent)] font-mono text-sm text-[var(--accent-foreground)]">
            {user.initials}
          </div>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-white/50">{user.role}</p>
          </div>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/35">
          Team load: {agents.reduce((sum, agent) => sum + agent.load, 0)} live tasks
        </p>
      </div>
    </aside>
  );
}
