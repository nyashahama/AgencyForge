"use client";

import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { USER, AGENTS, CAMPAIGNS } from "../components/data";

type Status = "review" | "generating" | "approved";

const STATUS_MAP: Record<Status, { dot: string; label: string }> = {
  review: { dot: "s-yellow", label: "Pending review" },
  generating: { dot: "s-blue", label: "Generating" },
  approved: { dot: "s-green", label: "Approved" },
};

export default function CampaignsPage() {
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");

  const FILTERS = ["all", "review", "generating", "approved"];

  const visible = CAMPAIGNS.filter(
    (c) => filter === "all" || c.status === filter,
  ).filter(
    (c) =>
      search === "" ||
      c.client.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

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
                Active work
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
                Campaigns
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setView("table")}
                style={{
                  padding: "7px 12px",
                  borderRadius: 5,
                  border: "1px solid var(--faint2)",
                  background: view === "table" ? "var(--ink)" : "transparent",
                  color: view === "table" ? "var(--white)" : "var(--muted)",
                  fontSize: "0.775rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                List
              </button>
              <button
                onClick={() => setView("grid")}
                style={{
                  padding: "7px 12px",
                  borderRadius: 5,
                  border: "1px solid var(--faint2)",
                  background: view === "grid" ? "var(--ink)" : "transparent",
                  color: view === "grid" ? "var(--white)" : "var(--muted)",
                  fontSize: "0.775rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Grid
              </button>
              <button className="db-new-btn">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M5.5 1v9M1 5.5h9"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                New campaign
              </button>
            </div>
          </div>

          {/* Filters + Search */}
          <div className="db-card" style={{ flexShrink: 0 }}>
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                borderBottom: "1px solid var(--faint2)",
              }}
            >
              <div style={{ display: "flex", gap: 4 }}>
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    className={`db-filter-btn ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all"
                      ? "All campaigns"
                      : STATUS_MAP[f as Status]?.label}
                  </button>
                ))}
              </div>
              <div
                style={{
                  marginLeft: "auto",
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
                  placeholder="Search campaigns…"
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

            {/* Summary pills */}
            <div
              style={{
                padding: "10px 20px",
                display: "flex",
                gap: 8,
                alignItems: "center",
                borderBottom: "1px solid var(--faint2)",
                background: "var(--bg)",
              }}
            >
              {(["review", "generating", "approved"] as Status[]).map((s) => {
                const count = CAMPAIGNS.filter((c) => c.status === s).length;
                return (
                  <span
                    key={s}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontFamily: "var(--mono)",
                      fontSize: "0.62rem",
                      color: "var(--muted)",
                      padding: "3px 8px",
                      background: "var(--white)",
                      border: "1px solid var(--faint2)",
                      borderRadius: 99,
                    }}
                  >
                    <span className={`db-dot ${STATUS_MAP[s].dot}`} />
                    {count} {STATUS_MAP[s].label}
                  </span>
                );
              })}
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.62rem",
                  color: "var(--muted)",
                  marginLeft: "auto",
                }}
              >
                {visible.length} shown
              </span>
            </div>

            {/* Table view */}
            {view === "table" && (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Client / Campaign</th>
                      <th>Status</th>
                      <th>Agents</th>
                      <th>Progress</th>
                      <th>Due</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((c) => (
                      <tr
                        key={c.id}
                        className={`db-row ${c.urgent ? "urgent" : ""}`}
                      >
                        <td>
                          <div className="db-client-name">{c.client}</div>
                          <div className="db-campaign-name">{c.name}</div>
                        </td>
                        <td>
                          <span className="db-status-pill">
                            <span
                              className={`db-dot ${STATUS_MAP[c.status].dot}`}
                            />
                            {STATUS_MAP[c.status].label}
                          </span>
                        </td>
                        <td>
                          <div className="db-agent-tags">
                            {c.agents.map((a) => (
                              <span key={a} className="db-agent-tag">
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="db-progress-wrap">
                            <div className="db-progress-bar">
                              <div
                                className={`db-progress-fill ${c.status}`}
                                style={{ width: `${c.progress}%` }}
                              />
                            </div>
                            <span className="db-progress-pct">
                              {c.progress}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`db-due ${c.urgent ? "urgent" : ""}`}
                          >
                            {c.due}
                          </span>
                        </td>
                        <td>
                          <button className="db-row-action">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 13 13"
                              fill="none"
                            >
                              <path
                                d="M2.5 6.5h8M7 3l3.5 3.5L7 10"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visible.length === 0 && (
                  <div className="db-empty">
                    No campaigns match your filters.
                  </div>
                )}
              </div>
            )}

            {/* Grid view */}
            {view === "grid" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 1,
                  background: "var(--faint2)",
                  padding: 1,
                }}
              >
                {visible.map((c) => (
                  <div
                    key={c.id}
                    style={{ background: "var(--white)", padding: 20 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div className="db-client-name">{c.client}</div>
                        <div
                          className="db-campaign-name"
                          style={{ marginTop: 2 }}
                        >
                          {c.name}
                        </div>
                      </div>
                      {c.urgent && (
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "0.58rem",
                            color: "#dc2626",
                            background: "#fef2f2",
                            padding: "2px 6px",
                            borderRadius: 3,
                            border: "1px solid #fecaca",
                          }}
                        >
                          Urgent
                        </span>
                      )}
                    </div>
                    <span
                      className="db-status-pill"
                      style={{ marginBottom: 12, display: "flex" }}
                    >
                      <span className={`db-dot ${STATUS_MAP[c.status].dot}`} />
                      {STATUS_MAP[c.status].label}
                    </span>
                    <div
                      className="db-progress-wrap"
                      style={{ marginBottom: 10 }}
                    >
                      <div className="db-progress-bar">
                        <div
                          className={`db-progress-fill ${c.status}`}
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                      <span className="db-progress-pct">{c.progress}%</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div className="db-agent-tags">
                        {c.agents.map((a) => (
                          <span key={a} className="db-agent-tag">
                            {a}
                          </span>
                        ))}
                      </div>
                      <span className={`db-due ${c.urgent ? "urgent" : ""}`}>
                        {c.due}
                      </span>
                    </div>
                  </div>
                ))}
                {visible.length === 0 && (
                  <div className="db-empty" style={{ gridColumn: "1/-1" }}>
                    No campaigns match your filters.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
