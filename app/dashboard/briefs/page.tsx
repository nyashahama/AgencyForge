"use client";

import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { USER, AGENTS } from "../components/data";

type BriefStatus = "processing" | "ready" | "in-progress" | "complete";

const BRIEFS: {
  id: string;
  client: string;
  title: string;
  uploaded: string;
  status: BriefStatus;
  agents: string[];
  pages: number;
  deliverables: string[];
}[] = [
  {
    id: "b-001",
    client: "Meridian Bank",
    title: "Q3 Brand Refresh — Full Brief",
    uploaded: "Today, 9:14 AM",
    status: "in-progress",
    agents: ["Copy", "Design", "Media"],
    pages: 12,
    deliverables: [
      "Campaign Copy Suite",
      "Visual Direction Brief",
      "Media Plan",
      "Legal Docs",
    ],
  },
  {
    id: "b-002",
    client: "Volta Footwear",
    title: "Summer Launch 2026 Brief",
    uploaded: "Yesterday, 3:40 PM",
    status: "in-progress",
    agents: ["Copy", "Media", "Legal"],
    pages: 8,
    deliverables: ["Campaign Copy", "Media Plan", "Legal Documents"],
  },
  {
    id: "b-003",
    client: "Crest Foods",
    title: "Oat Series — Product Launch Brief",
    uploaded: "Yesterday, 10:02 AM",
    status: "processing",
    agents: ["Copy", "Design"],
    pages: 6,
    deliverables: ["Campaign Copy", "Visual Direction"],
  },
  {
    id: "b-004",
    client: "Helix Health",
    title: "Awareness Campaign Brief",
    uploaded: "3 days ago",
    status: "complete",
    agents: ["Copy", "Design", "Media", "Legal"],
    pages: 15,
    deliverables: [
      "Campaign Copy Suite",
      "Visual Direction Brief",
      "Media Plan",
      "Legal Docs",
    ],
  },
  {
    id: "b-005",
    client: "Drift Mobility",
    title: "Performance OOH Brief",
    uploaded: "2 days ago",
    status: "ready",
    agents: [],
    pages: 5,
    deliverables: ["Campaign Copy", "Visual Direction", "Media Plan"],
  },
  {
    id: "b-006",
    client: "Sage Interiors",
    title: "Brand Identity Brief",
    uploaded: "1 week ago",
    status: "complete",
    agents: ["Copy", "Design"],
    pages: 10,
    deliverables: ["Campaign Copy Suite", "Visual Direction Brief"],
  },
];

const STATUS_MAP: Record<
  BriefStatus,
  { dot: string; label: string; color: string }
> = {
  processing: { dot: "s-blue", label: "Processing", color: "#60a5fa" },
  ready: { dot: "s-yellow", label: "Ready to run", color: "#eab308" },
  "in-progress": { dot: "s-blue", label: "In progress", color: "#a78bfa" },
  complete: { dot: "s-green", label: "Complete", color: "#22c55e" },
};

export default function BriefsPage() {
  const [filter, setFilter] = useState<"all" | BriefStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const visible = BRIEFS.filter((b) => filter === "all" || b.status === filter);

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
                Input queue
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
                Briefs
              </h1>
            </div>
          </div>

          {/* Upload drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            style={{
              border: `2px dashed ${dragging ? "var(--accent)" : "var(--faint2)"}`,
              borderRadius: 8,
              padding: "32px 24px",
              textAlign: "center",
              background: dragging ? "rgba(200,255,0,0.04)" : "var(--bg)",
              transition: "all 0.2s",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: "1.1rem",
                color: "var(--ink)",
                marginBottom: 6,
                fontWeight: 400,
              }}
            >
              Drop your brief here
            </div>
            <div
              style={{
                fontSize: "0.775rem",
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              PDF, DOCX, or TXT — agents will start processing immediately
            </div>
            <button className="db-upload-btn" style={{ margin: "0 auto" }}>
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
              Choose file
            </button>
          </div>

          {/* Briefs list */}
          <div className="db-card" style={{ flexShrink: 0 }}>
            <div className="db-card-header">
              <div>
                <div className="db-card-eyebrow">All briefs</div>
                <h2 className="db-card-title">Brief queue</h2>
              </div>
              <div className="db-filter-row">
                {(
                  [
                    "all",
                    "processing",
                    "ready",
                    "in-progress",
                    "complete",
                  ] as const
                ).map((f) => (
                  <button
                    key={f}
                    className={`db-filter-btn ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All" : STATUS_MAP[f]?.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Brief</th>
                    <th>Status</th>
                    <th>Agents assigned</th>
                    <th>Pages</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                {visible.map((b) => (
                  <tbody key={b.id}>
                    <tr
                      className={`db-row ${expanded === b.id ? "expanded" : ""}`}
                      onClick={() =>
                        setExpanded(expanded === b.id ? null : b.id)
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
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              background: "var(--faint)",
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <rect
                                x="2.5"
                                y="1.5"
                                width="9"
                                height="11"
                                rx="1.5"
                                stroke="var(--muted)"
                                strokeWidth="1.1"
                              />
                              <path
                                d="M4.5 5h5M4.5 7.5h5M4.5 10h3"
                                stroke="var(--muted)"
                                strokeWidth="1.1"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="db-client-name">{b.title}</div>
                            <div className="db-campaign-name">{b.client}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="db-status-pill">
                          <span
                            className={`db-dot ${STATUS_MAP[b.status].dot}`}
                          />
                          {STATUS_MAP[b.status].label}
                        </span>
                      </td>
                      <td>
                        {b.agents.length > 0 ? (
                          <div className="db-agent-tags">
                            {b.agents.map((a) => (
                              <span key={a} className="db-agent-tag">
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--faint2)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "0.72rem",
                            color: "var(--muted)",
                          }}
                        >
                          {b.pages}p
                        </span>
                      </td>
                      <td>
                        <span className="db-due">{b.uploaded}</span>
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
                    {expanded === b.id && (
                      <tr className="db-row-expanded">
                        <td colSpan={6}>
                          <div className="db-row-detail">
                            <div className="db-detail-col">
                              <div className="db-detail-label">
                                Expected deliverables
                              </div>
                              <div className="db-detail-items">
                                {b.deliverables.map((d) => (
                                  <span key={d} className="db-detail-item">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="db-detail-actions">
                              {b.status === "ready" && (
                                <button className="db-detail-btn primary">
                                  Run agents →
                                </button>
                              )}
                              <button className="db-detail-btn">
                                View brief
                              </button>
                              <button className="db-detail-btn">
                                Re-assign agents
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))}
              </table>
              {visible.length === 0 && (
                <div className="db-empty">No briefs with this status.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
