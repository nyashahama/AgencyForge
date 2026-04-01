"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const items = [
    ["/dashboard", "Overview"],
    ["/dashboard/briefs", "Briefs"],
    ["/dashboard/campaigns", "Campaigns"],
    ["/dashboard/analytics", "Analytics"],
    ["/dashboard/clients", "Clients"],
    ["/dashboard/portal", "Portal"],
    ["/dashboard/docs", "Docs"],
    ["/dashboard/settings", "Settings"],
  ];

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
        {items.map(([href, label]) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/6 hover:text-white",
              )}
            >
              <span>{label}</span>
              {href === "/dashboard/briefs" ? (
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
      </div>
    </aside>
  );
}
