"use client";

import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardHeader({ user }: { user: { name: string } }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="db-topbar">
      <div className="db-topbar-left">
        <p className="db-greeting">
          {greeting}, {user.name.split(" ")[0]}.
        </p>
        <p className="db-greeting-sub">You have 2 campaigns pending review.</p>
      </div>
      <div className="db-topbar-right">
        <ThemeToggle />
        <div className="db-search">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle
              cx="5.5"
              cy="5.5"
              r="3.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M8.5 8.5L11 11"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <input placeholder="Search campaigns, clients…" />
        </div>
        <button className="db-upload-btn">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M6.5 9V1M6.5 1L3.5 4M6.5 1l3 3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M1.5 10v1.5a1 1 0 001 1h8a1 1 0 001-1V10"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          Upload brief
        </button>
      </div>
    </div>
  );
}
