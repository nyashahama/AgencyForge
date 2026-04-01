import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { AGENTS, USER } from "./data";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 sm:px-6">
        <DashboardSidebar user={USER} agents={AGENTS} />
        <div className="min-w-0 flex-1 rounded-[32px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur">
          <DashboardHeader user={USER} />
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
