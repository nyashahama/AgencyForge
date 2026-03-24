"use client";

type Agent = { name: string; status: string; load: number };
type User  = { name: string; initials: string; agency: string; plan: string };

export default function DashboardSidebar({
  activeNav,
  setActiveNav,
  user,
  agents,
}: {
  activeNav: string;
  setActiveNav: (id: string) => void;
  user: User;
  agents: Agent[];
}) {
  const NAV = [
    { id: "overview", label: "Overview", icon: IconGrid },
    { id: "campaigns", label: "Campaigns", icon: IconCampaign },
    { id: "clients", label: "Clients", icon: IconClients },
    { id: "briefs", label: "Briefs", icon: IconBriefs },
    { id: "portal", label: "Client Portal", icon: IconPortal },
    { id: "analytics", label: "Analytics", icon: IconAnalytics },
  ];

  const BOTTOM = [
    { id: "settings", label: "Settings", icon: IconSettings },
    { id: "docs", label: "Docs", icon: IconDocs },
  ];

  const activeAgents = agents.filter((a: Agent) => a.status === "active").length;

  return (
    <aside className="db-sidebar">
      {/* Logo */}
      <div className="db-sidebar-logo">
        <div className="db-logo-mark">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L11 4.5V7.5L6 11L1 7.5V4.5L6 1Z" fill="#c8ff00" />
          </svg>
        </div>
        <span>AgencyForge</span>
      </div>

      {/* Agent pulse */}
      <div className="db-agent-pill">
        <span className="db-agent-dot" />
        <span>{activeAgents} agents running</span>
      </div>

      {/* Primary nav */}
      <nav className="db-nav">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`db-nav-item ${activeNav === id ? "active" : ""}`}
            onClick={() => setActiveNav(id)}
          >
            <Icon />
            <span>{label}</span>
            {id === "campaigns" && <span className="db-nav-badge">24</span>}
          </button>
        ))}
      </nav>

      <div className="db-nav-divider" />

      {/* Bottom nav */}
      <nav className="db-nav db-nav-bottom">
        {BOTTOM.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`db-nav-item ${activeNav === id ? "active" : ""}`}
            onClick={() => setActiveNav(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="db-sidebar-user">
        <div className="db-user-av">{user.initials}</div>
        <div className="db-user-info">
          <div className="db-user-name">{user.name}</div>
          <div className="db-user-role">
            {user.agency} · {user.plan}
          </div>
        </div>
        <button className="db-user-menu">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="3.5" r="1" fill="currentColor" />
            <circle cx="7" cy="7" r="1" fill="currentColor" />
            <circle cx="7" cy="10.5" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

// ── Icons ──
function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect
        x="1.5"
        y="1.5"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <rect
        x="8.5"
        y="1.5"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <rect
        x="1.5"
        y="8.5"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <rect
        x="8.5"
        y="8.5"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}
function IconCampaign() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M2 11l3.5-4.5 3 3 2-2.5 2.5 4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconClients() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M10 4.5c1.4 0 2.5 1 2.5 2.5C12.5 9 11 10 10 10"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M10.5 11c1.5.3 2.5 1.5 2.5 3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconBriefs() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect
        x="2.5"
        y="1.5"
        width="10"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M5 5.5h5M5 8h5M5 10.5h3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconPortal() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect
        x="1.5"
        y="1.5"
        width="12"
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M5 13.5h5M7.5 10.5v3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconAnalytics() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M2 12l3-4 2.5 2.5L10 6l3 3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.04 3.04l1.06 1.06M10.9 10.9l1.06 1.06M10.9 4.1l1.06-1.06M3.04 11.96l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconDocs() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle
        cx="7.5"
        cy="7.5"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M7.5 5v3.5M7.5 10.5v.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
