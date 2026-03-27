"use client";

import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { USER, AGENTS, CAMPAIGNS } from "../components/data";

const CLIENTS = [
  {
    id: "cl-001",
    name: "Meridian Bank",
    industry: "Finance",
    contact: "Jane Holloway",
    email: "j.holloway@meridian.com",
    activeCampaigns: 1,
    totalCampaigns: 7,
    spend: "$48,200",
    joined: "Jan 2024",
    status: "active",
  },
  {
    id: "cl-002",
    name: "Volta Footwear",
    industry: "Retail",
    contact: "Marcus Reid",
    email: "m.reid@volta.co",
    activeCampaigns: 1,
    totalCampaigns: 4,
    spend: "$23,750",
    joined: "Mar 2024",
    status: "active",
  },
  {
    id: "cl-003",
    name: "Helix Health",
    industry: "Healthcare",
    contact: "Priya Nair",
    email: "p.nair@helixhealth.io",
    activeCampaigns: 0,
    totalCampaigns: 3,
    spend: "$31,000",
    joined: "Feb 2024",
    status: "active",
  },
  {
    id: "cl-004",
    name: "Crest Foods",
    industry: "FMCG",
    contact: "Tom Erikson",
    email: "t.erikson@crestfoods.com",
    activeCampaigns: 1,
    totalCampaigns: 2,
    spend: "$9,400",
    joined: "Jun 2024",
    status: "active",
  },
  {
    id: "cl-005",
    name: "Drift Mobility",
    industry: "Transport",
    contact: "Anya Szabo",
    email: "anya@driftmobility.com",
    activeCampaigns: 1,
    totalCampaigns: 5,
    spend: "$17,600",
    joined: "Apr 2024",
    status: "active",
  },
  {
    id: "cl-006",
    name: "Sage Interiors",
    industry: "Design",
    contact: "Lena Markov",
    email: "lena@sageinteriors.co",
    activeCampaigns: 0,
    totalCampaigns: 6,
    spend: "$38,100",
    joined: "Dec 2023",
    status: "inactive",
  },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const visible = CLIENTS.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedClient = CLIENTS.find((c) => c.id === selected);
  const clientCampaigns = selectedClient
    ? CAMPAIGNS.filter((camp) => camp.client === selectedClient.name)
    : [];

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
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Relationships
              </div>
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "1.6rem",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                Clients
              </h1>
            </div>
            <button className="db-new-btn">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M5.5 1v9M1 5.5h9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
              Add client
            </button>
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 1,
              background: "var(--faint2)",
              borderRadius: 6,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {[
              {
                label: "Total clients",
                value: CLIENTS.length,
                tag: "All time",
              },
              {
                label: "Active clients",
                value: CLIENTS.filter((c) => c.status === "active").length,
                tag: "Now",
              },
              { label: "Total billed", value: "$168,050", tag: "Lifetime" },
            ].map((s) => (
              <div
                key={s.label}
                style={{ background: "var(--white)", padding: "16px 20px" }}
              >
                <div className="db-stat-tag">{s.tag}</div>
                <div className="db-stat-num">{s.value}</div>
                <div className="db-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Main card */}
          <div className="db-card" style={{ flexShrink: 0 }}>
            <div className="db-card-header">
              <div>
                <div className="db-card-eyebrow">Directory</div>
                <h2 className="db-card-title">All clients</h2>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--bg)",
                  border: "1px solid var(--faint2)",
                  borderRadius: 5,
                  padding: "7px 12px",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle
                    cx="5.5"
                    cy="5.5"
                    r="3.5"
                    stroke="var(--muted)"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M8.5 8.5L11 11"
                    stroke="var(--muted)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients…"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--ink)",
                    width: 180,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Industry</th>
                    <th>Contact</th>
                    <th>Campaigns</th>
                    <th>Total spend</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr
                      key={c.id}
                      className={`db-row ${selected === c.id ? "expanded" : ""}`}
                      onClick={() =>
                        setSelected(selected === c.id ? null : c.id)
                      }
                    >
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "var(--faint2)",
                              display: "grid",
                              placeItems: "center",
                              fontFamily: "var(--mono)",
                              fontSize: "0.58rem",
                              fontWeight: 600,
                              color: "var(--muted)",
                              flexShrink: 0,
                            }}
                          >
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="db-client-name">{c.name}</div>
                            <div className="db-campaign-name">
                              {c.activeCampaigns} active
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "0.62rem",
                            color: "var(--muted)",
                            background: "var(--faint)",
                            padding: "2px 7px",
                            borderRadius: 3,
                          }}
                        >
                          {c.industry}
                        </span>
                      </td>
                      <td>
                        <div
                          className="db-client-name"
                          style={{ fontWeight: 400 }}
                        >
                          {c.contact}
                        </div>
                        <div className="db-campaign-name">{c.email}</div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            className="db-progress-bar"
                            style={{ width: 60 }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 99,
                                background: "var(--accent)",
                                width: `${(c.activeCampaigns / 3) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="db-progress-pct">
                            {c.totalCampaigns} total
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.825rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                          }}
                        >
                          {c.spend}
                        </span>
                      </td>
                      <td>
                        <span className="db-due">{c.joined}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontFamily: "var(--mono)",
                              fontSize: "0.58rem",
                              color:
                                c.status === "active"
                                  ? "#15803d"
                                  : "var(--muted)",
                              background:
                                c.status === "active"
                                  ? "#f0fdf4"
                                  : "var(--faint)",
                              padding: "2px 6px",
                              borderRadius: 99,
                              border: `1px solid ${c.status === "active" ? "#bbf7d0" : "var(--faint2)"}`,
                            }}
                          >
                            <span
                              className="db-dot"
                              style={{
                                background:
                                  c.status === "active"
                                    ? "#22c55e"
                                    : "var(--faint2)",
                              }}
                            />
                            {c.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expanded detail */}
            {selectedClient && (
              <div
                style={{
                  borderTop: "1px solid var(--faint2)",
                  background: "var(--bg)",
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="db-detail-label">Recent campaigns</div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      {clientCampaigns.length > 0 ? (
                        clientCampaigns.map((camp) => (
                          <div
                            key={camp.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 12px",
                              background: "var(--white)",
                              borderRadius: 5,
                              border: "1px solid var(--faint2)",
                            }}
                          >
                            <span
                              className={`db-dot ${{ review: "s-yellow", generating: "s-blue", approved: "s-green" }[camp.status]}`}
                            />
                            <span
                              style={{
                                fontSize: "0.775rem",
                                color: "var(--ink)",
                              }}
                            >
                              {camp.name}
                            </span>
                            <span
                              style={{
                                marginLeft: "auto",
                                fontFamily: "var(--mono)",
                                fontSize: "0.6rem",
                                color: "var(--muted)",
                              }}
                            >
                              {camp.progress}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            fontSize: "0.775rem",
                            color: "var(--muted)",
                          }}
                        >
                          No current campaigns.
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <div className="db-detail-label">Actions</div>
                    <button className="db-detail-btn primary">
                      Open client →
                    </button>
                    <button className="db-detail-btn">New campaign</button>
                    <button className="db-detail-btn">
                      Send portal invite
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
