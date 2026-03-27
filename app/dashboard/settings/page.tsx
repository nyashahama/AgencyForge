"use client";

import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { USER, AGENTS } from "../components/data";

const SECTIONS = [
  "Profile",
  "Agency",
  "Billing",
  "Agents",
  "Integrations",
  "Security",
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("Profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="db-root">
      <DashboardSidebar user={USER} agents={AGENTS} />
      <main className="db-main">
        <DashboardHeader user={USER} />
        <div className="db-body">
          {/* Page header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <div>
              <p className="db-card-eyebrow" style={{ marginBottom: "6px" }}>
                Configuration
              </p>
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "1.75rem",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                Settings
              </h1>
            </div>
            <button
              onClick={handleSave}
              className="db-upload-btn"
              style={{ gap: "8px" }}
            >
              {saved ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path
                      d="M2 6.5l3 3 6-6"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Saved
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path
                      d="M2.5 6.5l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Save changes
                </>
              )}
            </button>
          </div>

          {/* Settings layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: "16px",
              flex: 1,
            }}
          >
            {/* Section nav */}
            <div
              className="db-card"
              style={{ padding: "8px", alignSelf: "start" }}
            >
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  className="db-nav-item"
                  style={{
                    width: "100%",
                    color: activeSection === s ? "var(--ink)" : "var(--muted)",
                    background:
                      activeSection === s ? "var(--faint)" : "transparent",
                    fontSize: "0.825rem",
                    borderRadius: "4px",
                    justifyContent: "flex-start",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Panel */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {activeSection === "Profile" && <ProfileSection />}
              {activeSection === "Agency" && <AgencySection />}
              {activeSection === "Billing" && <BillingSection />}
              {activeSection === "Agents" && <AgentsSection />}
              {activeSection === "Integrations" && <IntegrationsSection />}
              {activeSection === "Security" && <SecuritySection />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Section components ── */

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: "24px",
        alignItems: "start",
        padding: "20px 0",
        borderBottom: "1px solid var(--faint)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "0.825rem",
            fontWeight: 500,
            color: "var(--ink)",
            marginBottom: "4px",
          }}
        >
          {label}
        </div>
        {hint && (
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--muted)",
              fontWeight: 300,
              lineHeight: 1.5,
            }}
          >
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsInput({
  defaultValue,
  placeholder,
  type = "text",
}: {
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 12px",
        fontSize: "0.825rem",
        color: "var(--ink)",
        background: "var(--bg)",
        border: "1px solid var(--faint2)",
        borderRadius: "var(--r)",
        outline: "none",
        fontFamily: "var(--sans)",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--muted)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--faint2)")}
    />
  );
}

function Toggle({
  defaultChecked = false,
  label,
}: {
  defaultChecked?: boolean;
  label: string;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
      }}
    >
      <div
        onClick={() => setOn(!on)}
        style={{
          width: "36px",
          height: "20px",
          borderRadius: "99px",
          background: on ? "var(--accent)" : "var(--faint2)",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "3px",
            left: on ? "19px" : "3px",
            width: "14px",
            height: "14px",
            background: on ? "var(--accent-ink)" : "white",
            borderRadius: "50%",
            transition: "left 0.2s",
          }}
        />
      </div>
      <span style={{ fontSize: "0.825rem", color: "var(--ink)" }}>{label}</span>
    </label>
  );
}

function SectionCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="db-card">
      <div className="db-card-header">
        <div>
          <div className="db-card-eyebrow">{eyebrow}</div>
          <h2 className="db-card-title">{title}</h2>
        </div>
      </div>
      <div style={{ padding: "0 20px 4px" }}>{children}</div>
    </div>
  );
}

function ProfileSection() {
  return (
    <SectionCard eyebrow="Account" title="Profile">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "20px 0",
          borderBottom: "1px solid var(--faint)",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "var(--accent)",
            color: "var(--accent-ink)",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          SL
        </div>
        <div>
          <div
            style={{
              fontSize: "0.825rem",
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: "4px",
            }}
          >
            Sophia Lund
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--muted)",
              marginBottom: "10px",
            }}
          >
            sophia@neonandstone.com
          </div>
          <button
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
              border: "1px solid var(--faint2)",
              padding: "4px 10px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Change photo
          </button>
        </div>
      </div>
      <FieldRow
        label="Full name"
        hint="Displayed across your workspace and client portals."
      >
        <SettingsInput defaultValue="Sophia Lund" />
      </FieldRow>
      <FieldRow label="Email address" hint="Used for login and notifications.">
        <SettingsInput defaultValue="sophia@neonandstone.com" type="email" />
      </FieldRow>
      <FieldRow label="Role / Title">
        <SettingsInput defaultValue="Creative Director" />
      </FieldRow>
      <FieldRow label="Time zone">
        <select
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "0.825rem",
            color: "var(--ink)",
            background: "var(--bg)",
            border: "1px solid var(--faint2)",
            borderRadius: "var(--r)",
            fontFamily: "var(--sans)",
          }}
        >
          <option>UTC+02:00 — Johannesburg</option>
          <option>UTC+00:00 — London</option>
          <option>UTC-05:00 — New York</option>
          <option>UTC-08:00 — Los Angeles</option>
        </select>
      </FieldRow>
      <div style={{ paddingTop: "20px", paddingBottom: "20px" }}>
        <Toggle defaultChecked label="Receive brief completion notifications" />
      </div>
    </SectionCard>
  );
}

function AgencySection() {
  return (
    <SectionCard eyebrow="Workspace" title="Agency">
      <FieldRow
        label="Agency name"
        hint="Shown in your white-label client portal."
      >
        <SettingsInput defaultValue="Neon & Stone" />
      </FieldRow>
      <FieldRow label="Portal subdomain">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            border: "1px solid var(--faint2)",
            borderRadius: "var(--r)",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              padding: "8px 12px",
              fontSize: "0.825rem",
              background: "var(--faint)",
              color: "var(--muted)",
              borderRight: "1px solid var(--faint2)",
              whiteSpace: "nowrap",
            }}
          >
            portal.
          </span>
          <input
            defaultValue="neonandstone"
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "0.825rem",
              color: "var(--ink)",
              background: "var(--bg)",
              border: "none",
              outline: "none",
              fontFamily: "var(--sans)",
            }}
          />
          <span
            style={{
              padding: "8px 12px",
              fontSize: "0.825rem",
              background: "var(--faint)",
              color: "var(--muted)",
              borderLeft: "1px solid var(--faint2)",
              whiteSpace: "nowrap",
            }}
          >
            .agencyforge.io
          </span>
        </div>
      </FieldRow>
      <FieldRow label="Default client language">
        <select
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "0.825rem",
            color: "var(--ink)",
            background: "var(--bg)",
            border: "1px solid var(--faint2)",
            borderRadius: "var(--r)",
            fontFamily: "var(--sans)",
          }}
        >
          <option>English (US)</option>
          <option>English (UK)</option>
          <option>French</option>
          <option>German</option>
          <option>Spanish</option>
        </select>
      </FieldRow>
      <div
        style={{
          paddingTop: "20px",
          paddingBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <Toggle
          defaultChecked
          label="Show AgencyForge branding in portal footer"
        />
        <Toggle label="Allow clients to upload revision briefs directly" />
        <Toggle
          defaultChecked
          label="Auto-send deliverables when all agents complete"
        />
      </div>
    </SectionCard>
  );
}

function BillingSection() {
  return (
    <>
      <div className="db-card">
        <div className="db-card-header">
          <div>
            <div className="db-card-eyebrow">Subscription</div>
            <h2 className="db-card-title">Billing</h2>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(200,255,0,0.1)",
              border: "1px solid rgba(200,255,0,0.2)",
              color: "var(--accent)",
              padding: "4px 10px",
              borderRadius: "99px",
              fontSize: "0.7rem",
              fontFamily: "var(--mono)",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                background: "var(--accent)",
                borderRadius: "50%",
              }}
            />
            Agency plan
          </span>
        </div>
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1px",
              background: "var(--faint2)",
              borderRadius: "var(--r)",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >
            {[
              { label: "Plan", value: "Agency" },
              { label: "Billing cycle", value: "Monthly" },
              { label: "Next invoice", value: "Apr 27, 2026" },
            ].map((item) => (
              <div
                key={item.label}
                style={{ background: "var(--bg)", padding: "16px" }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontFamily: "var(--mono)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: "6px",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              border: "1px solid var(--faint2)",
              borderRadius: "var(--r)",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "24px",
                  background: "var(--faint)",
                  borderRadius: "4px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.62rem",
                  fontFamily: "var(--mono)",
                  color: "var(--muted)",
                }}
              >
                VISA
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.825rem",
                    color: "var(--ink)",
                    fontWeight: 500,
                  }}
                >
                  •••• •••• •••• 4242
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                  Expires 09/28
                </div>
              </div>
            </div>
            <button
              style={{
                fontSize: "0.75rem",
                color: "var(--muted)",
                border: "1px solid var(--faint2)",
                padding: "5px 10px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Update
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="db-detail-btn">Download invoices</button>
            <button
              className="db-detail-btn"
              style={{ color: "#dc2626", borderColor: "rgba(220,38,38,0.2)" }}
            >
              Cancel subscription
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AgentsSection() {
  const agents = [
    {
      name: "Copy",
      desc: "Generates campaign copy, taglines, and messaging frameworks.",
      on: true,
    },
    {
      name: "Design",
      desc: "Produces visual direction briefs, mood boards, and art direction.",
      on: true,
    },
    {
      name: "Media",
      desc: "Builds media plans, channel mix recommendations, and budgets.",
      on: true,
    },
    {
      name: "Legal",
      desc: "Drafts licensing, release forms, and compliance documents.",
      on: false,
    },
    {
      name: "Budget",
      desc: "Manages campaign cost modelling and spend forecasting.",
      on: true,
    },
    {
      name: "Portal",
      desc: "Packages and delivers deliverables to the client portal.",
      on: true,
    },
  ];
  return (
    <SectionCard eyebrow="AI Agents" title="Agent configuration">
      {agents.map((a) => (
        <div
          key={a.name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
            borderBottom: "1px solid var(--faint)",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: a.on ? "var(--accent)" : "var(--faint2)",
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "0.825rem",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: "3px",
                }}
              >
                {a.name} agent
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--muted)",
                  fontWeight: 300,
                }}
              >
                {a.desc}
              </div>
            </div>
          </div>
          <Toggle defaultChecked={a.on} label="" />
        </div>
      ))}
    </SectionCard>
  );
}

function IntegrationsSection() {
  const integrations = [
    {
      name: "Slack",
      desc: "Get notified when campaigns are ready for review.",
      connected: true,
    },
    {
      name: "Google Drive",
      desc: "Auto-export deliverables to a Drive folder.",
      connected: true,
    },
    {
      name: "Notion",
      desc: "Sync brief intake forms with your Notion workspace.",
      connected: false,
    },
    {
      name: "HubSpot",
      desc: "Push approved campaigns directly to HubSpot.",
      connected: false,
    },
    {
      name: "Zapier",
      desc: "Connect AgencyForge to 5,000+ apps.",
      connected: false,
    },
  ];
  return (
    <SectionCard eyebrow="Connected apps" title="Integrations">
      {integrations.map((i) => (
        <div
          key={i.name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
            borderBottom: "1px solid var(--faint)",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "var(--faint)",
                border: "1px solid var(--faint2)",
                borderRadius: "6px",
                display: "grid",
                placeItems: "center",
                fontSize: "0.62rem",
                fontFamily: "var(--mono)",
                color: "var(--muted)",
                flexShrink: 0,
              }}
            >
              {i.name[0]}
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.825rem",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: "3px",
                }}
              >
                {i.name}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--muted)",
                  fontWeight: 300,
                }}
              >
                {i.desc}
              </div>
            </div>
          </div>
          <button
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              padding: "5px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              border: i.connected
                ? "1px solid var(--faint2)"
                : "1px solid rgba(200,255,0,0.3)",
              background: i.connected ? "transparent" : "rgba(200,255,0,0.06)",
              color: i.connected ? "var(--muted)" : "var(--accent)",
            }}
          >
            {i.connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      ))}
    </SectionCard>
  );
}

function SecuritySection() {
  return (
    <>
      <SectionCard eyebrow="Access" title="Security">
        <FieldRow label="Current password">
          <SettingsInput type="password" placeholder="••••••••" />
        </FieldRow>
        <FieldRow
          label="New password"
          hint="Minimum 8 characters. Use a mix of letters, numbers, and symbols."
        >
          <SettingsInput type="password" placeholder="New password" />
        </FieldRow>
        <FieldRow label="Confirm new password">
          <SettingsInput type="password" placeholder="Confirm password" />
        </FieldRow>
        <div
          style={{
            paddingTop: "20px",
            paddingBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <Toggle defaultChecked label="Two-factor authentication (2FA)" />
          <Toggle
            defaultChecked
            label="Log me out after 7 days of inactivity"
          />
          <Toggle label="Require 2FA for all team members" />
        </div>
      </SectionCard>

      <div className="db-card">
        <div className="db-card-header">
          <div>
            <div className="db-card-eyebrow">Sessions</div>
            <h2 className="db-card-title">Active sessions</h2>
          </div>
        </div>
        <div style={{ padding: "4px 0" }}>
          {[
            {
              device: "Chrome on macOS",
              location: "Johannesburg, ZA",
              current: true,
              time: "Now",
            },
            {
              device: "Safari on iPhone",
              location: "Johannesburg, ZA",
              current: false,
              time: "2 days ago",
            },
            {
              device: "Chrome on Windows",
              location: "Cape Town, ZA",
              current: false,
              time: "5 days ago",
            },
          ].map((s) => (
            <div
              key={s.device + s.time}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: "1px solid var(--faint)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: s.current ? "#22c55e" : "var(--faint2)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "0.825rem",
                      fontWeight: 500,
                      color: "var(--ink)",
                    }}
                  >
                    {s.device}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    {s.location} · {s.time}
                  </div>
                </div>
              </div>
              {s.current ? (
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontFamily: "var(--mono)",
                    color: "#22c55e",
                  }}
                >
                  Current
                </span>
              ) : (
                <button
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--muted)",
                    cursor: "pointer",
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
