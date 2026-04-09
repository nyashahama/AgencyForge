export const DASHBOARD_NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    eyebrow: "Operations",
    short: "Overview",
    tone: "from-lime-300/25 to-transparent",
  },
  {
    href: "/dashboard/briefs",
    label: "Briefs",
    eyebrow: "Input queue",
    short: "Briefs",
    tone: "from-sky-400/20 to-transparent",
  },
  {
    href: "/dashboard/campaigns",
    label: "Campaigns",
    eyebrow: "Execution",
    short: "Campaigns",
    tone: "from-fuchsia-400/20 to-transparent",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    eyebrow: "Performance",
    short: "Analytics",
    tone: "from-amber-300/25 to-transparent",
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
    eyebrow: "Accounts",
    short: "Clients",
    tone: "from-cyan-300/20 to-transparent",
  },
  {
    href: "/dashboard/team",
    label: "Team",
    eyebrow: "Operators",
    short: "Team",
    tone: "from-orange-300/20 to-transparent",
  },
  {
    href: "/dashboard/portal",
    label: "Portal",
    eyebrow: "Delivery",
    short: "Portal",
    tone: "from-emerald-300/20 to-transparent",
  },
  {
    href: "/dashboard/docs",
    label: "Docs",
    eyebrow: "Knowledge",
    short: "Docs",
    tone: "from-violet-300/20 to-transparent",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    eyebrow: "Workspace",
    short: "Settings",
    tone: "from-rose-300/20 to-transparent",
  },
] as const;

export function getDashboardNavItem(pathname: string) {
  return (
    DASHBOARD_NAV_ITEMS.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href)),
    ) ?? DASHBOARD_NAV_ITEMS[0]
  );
}
