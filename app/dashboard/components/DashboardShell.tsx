"use client";

import { useState, useEffect } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import { useAuth } from "@/lib/auth/session";
import { analytics as analyticsApi } from "@/lib/api/endpoints";
import type { SpecialistLoad } from "@/lib/api/client";

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

function mapApiAgent(s: SpecialistLoad): Agent {
  return {
    name: s.name || s.code,
    status: s.status,
    load: s.load,
  };
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    analyticsApi.specialists(accessToken)
      .then((data) => {
        setAgents(data.map(mapApiAgent));
      })
      .catch(() => undefined);
  }, [accessToken]);

  const mappedUser: User = {
    name: user?.name ?? "User",
    initials: user?.name
      ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U",
    role: user?.role ?? "Member",
    agency: user?.agency ?? "Agency",
    plan: "Agency",
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex max-w-[1600px] gap-4 px-4 py-4 sm:px-6">
        <DashboardSidebar user={mappedUser} agents={agents} />
        <div className="min-w-0 flex-1 rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur sm:rounded-[32px]">
          <DashboardHeader user={mappedUser} />
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
