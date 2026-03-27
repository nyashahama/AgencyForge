"use client";

import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { USER, AGENTS, THROUGHPUT } from "../components/data";

const MONTHLY = [
  { month: "Aug", campaigns: 14, revenue: 38000, approvalRate: 94 },
  { month: "Sep", campaigns: 18, revenue: 47000, approvalRate: 96 },
  { month: "Oct", campaigns: 21, revenue: 55000, approvalRate: 95 },
  { month: "Nov", campaigns: 19, revenue: 51000, approvalRate: 97 },
  { month: "Dec", campaigns: 16, revenue: 42000, approvalRate: 98 },
  { month: "Jan", campaigns: 22, revenue: 59000, approvalRate: 97 },
  { month: "Feb", campaigns: 25, revenue: 67000, approvalRate: 98 },
  { month: "Mar", campaigns: 24, revenue: 64000, approvalRate: 98 },
];

const AGENT_PERF = [
  { name: "Copy", tasksCompleted: 148, avgTime: "1.2h", accuracy: 99 },
  { name: "Design", tasksCompleted: 112, avgTime: "2.1h", accuracy: 97 },
  { name: "Media", tasksCompleted: 98, avgTime: "0.8h", accuracy: 99 },
  { name: "Legal", tasksCompleted: 74, avgTime: "3.4h", accuracy: 100 },
  { name: "Budget", tasksCompleted: 61, avgTime: "0.5h", accuracy: 98 },
  { name: "Portal", tasksCompleted: 132, avgTime: "0.2h", accuracy: 99 },
];

const TOP_CLIENTS = [
  { name: "Meridian Bank", campaigns: 7, revenue: "$48,200", growth: "+12%" },
  { name: "Sage Interiors", campaigns: 6, revenue: "$38,100", growth: "+8%" },
  { name: "Helix Health", campaigns: 3, revenue: "$31,000", growth: "+22%" },
  { name: "Volta Footwear", campaigns: 4, revenue: "$23,750", growth: "+34%" },
  { name: "Drift Mobility", campaigns: 5, revenue: "$17,600", growth: "+5%" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  const maxCampaigns = Math.max(...MONTHLY.map((d) => d.campaigns));
  const maxRevenue = Math.max(...MONTHLY.map((d) => d.revenue));
  const H = 80;
  const BAR_W = 28;
  const GAP = 10;

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
                Insights
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
                Analytics
              </h1>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["week", "month", "year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 5,
                    border: "1px solid var(--faint2)",
                    background: period === p ? "var(--ink)" : "transparent",
                    color: period === p ? "var(--white)" : "var(--muted)",
                    fontSize: "0.775rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textTransform: "capitalize",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* KPI strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 1,
              background: "var(--faint2)",
              borderRadius: 6,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {[
              {
                tag: "Revenue",
                value: "$64k",
                label: "This month",
                delta: "+14% vs last",
                up: true,
              },
              {
                tag: "Throughput",
                value: "24",
                label: "Campaigns delivered",
                delta: "+3 vs last",
                up: true,
              },
              {
                tag: "Approval",
                value: "98%",
                label: "Client approval rate",
                delta: "+2% vs last",
                up: true,
              },
              {
                tag: "Speed",
                value: "4.2h",
                label: "Avg. turnaround",
                delta: "−0.6h vs last",
                up: true,
              },
            ].map((s) => (
              <div
                key={s.tag}
                style={{ background: "var(--white)", padding: "18px 20px" }}
              >
                <div className="db-stat-tag">{s.tag}</div>
                <div className="db-stat-num">{s.value}</div>
                <div className="db-stat-label">{s.label}</div>
                <div className={`db-stat-delta ${s.up ? "up" : "down"}`}>
                  <span>↑</span> {s.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              flexShrink: 0,
            }}
          >
            {/* Campaign volume chart */}
            <div className="db-card">
              <div className="db-card-header">
                <div>
                  <div className="db-card-eyebrow">8 months</div>
                  <h2 className="db-card-title">Campaign volume</h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "1.5rem",
                      fontWeight: 400,
                      display: "block",
                      lineHeight: 1,
                      color: "var(--ink)",
                    }}
                  >
                    159
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--muted)",
                      fontWeight: 300,
                    }}
                  >
                    total campaigns
                  </span>
                </div>
              </div>
              <div style={{ padding: "16px 20px 12px" }}>
                <svg
                  width="100%"
                  viewBox={`0 0 ${MONTHLY.length * (BAR_W + GAP) - GAP} ${H + 28}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {MONTHLY.map((d, i) => {
                    const barH = (d.campaigns / maxCampaigns) * H;
                    const x = i * (BAR_W + GAP);
                    const y = H - barH;
                    return (
                      <g key={d.month}>
                        <rect
                          x={x}
                          y={0}
                          width={BAR_W}
                          height={H}
                          rx="3"
                          fill="var(--faint2)"
                          opacity="0.4"
                        />
                        <rect
                          x={x}
                          y={y}
                          width={BAR_W}
                          height={barH}
                          rx="3"
                          fill="var(--accent)"
                        />
                        <text
                          x={x + BAR_W / 2}
                          y={y - 5}
                          textAnchor="middle"
                          fontSize="8"
                          fill="var(--muted)"
                          fontFamily="var(--mono)"
                        >
                          {d.campaigns}
                        </text>
                        <text
                          x={x + BAR_W / 2}
                          y={H + 16}
                          textAnchor="middle"
                          fontSize="8"
                          fill="var(--muted)"
                          fontFamily="var(--mono)"
                        >
                          {d.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Revenue chart */}
            <div className="db-card">
              <div className="db-card-header">
                <div>
                  <div className="db-card-eyebrow">8 months</div>
                  <h2 className="db-card-title">Revenue</h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "1.5rem",
                      fontWeight: 400,
                      display: "block",
                      lineHeight: 1,
                      color: "var(--ink)",
                    }}
                  >
                    $423k
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--muted)",
                      fontWeight: 300,
                    }}
                  >
                    total revenue
                  </span>
                </div>
              </div>
              <div style={{ padding: "16px 20px 12px" }}>
                <svg
                  width="100%"
                  viewBox={`0 0 ${MONTHLY.length * (BAR_W + GAP) - GAP} ${H + 28}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {MONTHLY.map((d, i) => {
                    const barH = (d.revenue / maxRevenue) * H;
                    const x = i * (BAR_W + GAP);
                    const y = H - barH;
                    return (
                      <g key={d.month}>
                        <rect
                          x={x}
                          y={0}
                          width={BAR_W}
                          height={H}
                          rx="3"
                          fill="var(--faint2)"
                          opacity="0.4"
                        />
                        <rect
                          x={x}
                          y={y}
                          width={BAR_W}
                          height={barH}
                          rx="3"
                          fill="#60a5fa"
                        />
                        <text
                          x={x + BAR_W / 2}
                          y={y - 5}
                          textAnchor="middle"
                          fontSize="7"
                          fill="var(--muted)"
                          fontFamily="var(--mono)"
                        >
                          ${Math.round(d.revenue / 1000)}k
                        </text>
                        <text
                          x={x + BAR_W / 2}
                          y={H + 16}
                          textAnchor="middle"
                          fontSize="8"
                          fill="var(--muted)"
                          fontFamily="var(--mono)"
                        >
                          {d.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              flexShrink: 0,
            }}
          >
            {/* Agent performance */}
            <div className="db-card">
              <div className="db-card-header">
                <div>
                  <div className="db-card-eyebrow">Performance</div>
                  <h2 className="db-card-title">Agent breakdown</h2>
                </div>
              </div>
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Tasks</th>
                      <th>Avg time</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AGENT_PERF.map((a) => (
                      <tr key={a.name} className="db-row">
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span className="db-dot s-green" />
                            <span
                              style={{
                                fontSize: "0.825rem",
                                fontWeight: 500,
                                color: "var(--ink)",
                              }}
                            >
                              {a.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.72rem",
                              color: "var(--ink)",
                              fontWeight: 600,
                            }}
                          >
                            {a.tasksCompleted}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.72rem",
                              color: "var(--muted)",
                            }}
                          >
                            {a.avgTime}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div
                              className="db-progress-bar"
                              style={{ width: 50 }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  borderRadius: 99,
                                  background:
                                    a.accuracy === 100
                                      ? "var(--accent)"
                                      : "#60a5fa",
                                  width: `${a.accuracy}%`,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: "var(--mono)",
                                fontSize: "0.6rem",
                                color: "var(--muted)",
                              }}
                            >
                              {a.accuracy}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top clients */}
            <div className="db-card">
              <div className="db-card-header">
                <div>
                  <div className="db-card-eyebrow">By revenue</div>
                  <h2 className="db-card-title">Top clients</h2>
                </div>
              </div>
              <div style={{ padding: "8px 0" }}>
                {TOP_CLIENTS.map((c, i) => (
                  <div
                    key={c.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 20px",
                      borderBottom:
                        i < TOP_CLIENTS.length - 1
                          ? "1px solid var(--faint)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        fontFamily: "var(--mono)",
                        fontSize: "0.65rem",
                        color: "var(--faint2)",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.825rem",
                          fontWeight: 500,
                          color: "var(--ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--muted)",
                          marginTop: 1,
                        }}
                      >
                        {c.campaigns} campaigns
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: "0.825rem",
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {c.revenue}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "0.6rem",
                          color: "#15803d",
                          marginTop: 1,
                        }}
                      >
                        {c.growth}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
