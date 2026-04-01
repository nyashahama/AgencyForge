"use client";

import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { useMockDashboard } from "./mock-state";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { agents, user } = useMockDashboard();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex max-w-[1600px] gap-4 px-4 py-4 sm:px-6">
        <DashboardSidebar user={user} agents={agents} />
        <div className="min-w-0 flex-1 rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur sm:rounded-[32px]">
          <DashboardHeader user={user} />
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
