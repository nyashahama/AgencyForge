"use client";

import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { USER, AGENTS, CAMPAIGNS } from "../components/data";

const PORTAL_CLIENTS = [
  {
    id: "cl-001",
    name: "Meridian Bank",
    initials: "MB",
    lastActive: "2 min ago",
    portalEnabled: true,
    hasUnread: true,
  },
  {
    id: "cl-002",
    name: "Volta Footwear",
    initials: "VF",
    lastActive: "1h ago",
    portalEnabled: true,
    hasUnread: false,
  },
  {
    id: "cl-003",
    name: "Helix Health",
    initials: "HH",
    lastActive: "3h ago",
    portalEnabled: true,
    hasUnread: true,
  },
  {
    id: "cl-004",
    name: "Crest Foods",
    initials: "CF",
    lastActive: "Yesterday",
    portalEnabled: false,
    hasUnread: false,
  },
  {
    id: "cl-005",
    name: "Drift Mobility",
    initials: "DM",
    lastActive: "2 days ago",
    portalEnabled: true,
    hasUnread: false,
  },
  {
    id: "cl-006",
    name: "Sage Interiors",
    initials: "SI",
    lastActive: "1 week ago",
    portalEnabled: true,
    hasUnread: false,
  },
];

const COMMENTS = [
  {
    id: 1,
    client: "Meridian Bank",
    author: "Jane Holloway",
    text: "The headline copy on slide 3 needs to be more conservative — please avoid the word 'disrupting'.",
    time: "5 min ago",
    resolved: false,
  },
  {
    id: 2,
    client: "Helix Health",
    author: "Priya Nair",
    text: "Can we get a version of the visual brief in landscape format? We need it for the boardroom presentation.",
    time: "2h ago",
    resolved: false,
  },
  {
    id: 3,
    client: "Meridian Bank",
    author: "Jane Holloway",
    text: "The legal disclaimer on page 2 looks good. Approved.",
    time: "Yesterday",
    resolved: true,
  },
  {
    id: 4,
    client: "Volta Footwear",
    author: "Marcus Reid",
    text: "Love the media plan — just need to shift the Instagram spend to TikTok for this campaign.",
    time: "Yesterday",
    resolved: false,
  },
];

export default function PortalPage() {
  const [activeClient, setActiveClient] = useState("cl-001");
  const [tab, setTab] = useState<"deliverables" | "comments" | "approvals">(
    "deliverables",
  );

  const client = PORTAL_CLIENTS.find((c) => c.id === activeClient)!;
  const campaigns = CAMPAIGNS.filter((c) => c.client === client.name);
  const comments = COMMENTS.filter((c) => c.client === client.name);

  return (
    <div className="db-root">
      <DashboardSidebar user={USER} agents={AGENTS} />
      <main className="db-main">
        <DashboardHeader user={USER} />
        <div
          className="db-body"
          style={{ padding: 0, overflow: "hidden", flexDirection: "row" }}
        >
          {/* Client list */}
          <div
            style={{
              width: 220,
              flexShrink: 0,
              borderRight: "1px solid var(--faint2)",
              height: "100%",
              overflowY: "auto",
              padding: "16px 0",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div
              style={{
                padding: "0 16px 12px",
                fontFamily: "var(--mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              Portals
            </div>
            {PORTAL_CLIENTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveClient(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  background:
                    activeClient === c.id ? "var(--faint)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                  borderRadius: 0,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background:
                      activeClient === c.id ? "var(--ink)" : "var(--faint2)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--mono)",
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    color:
                      activeClient === c.id ? "var(--white)" : "var(--muted)",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  {c.initials}
                  {c.hasUnread && (
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        border: "1.5px solid var(--bg)",
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.78rem",
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
                      fontSize: "0.65rem",
                      color: "var(--muted)",
                      marginTop: 1,
                    }}
                  >
                    {c.lastActive}
                  </div>
                </div>
                {!c.portalEnabled && (
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.55rem",
                      color: "var(--faint2)",
                      background: "var(--faint)",
                      padding: "1px 4px",
                      borderRadius: 3,
                    }}
                  >
                    Off
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Portal detail */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              padding: "24px 28px",
              gap: 20,
            }}
          >
            {/* Client header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--ink)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--mono)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "var(--accent)",
                  }}
                >
                  {client.initials}
                </div>
                <div>
                  <h1
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "1.4rem",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                      color: "var(--ink)",
                    }}
                  >
                    {client.name}
                  </h1>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    Last active {client.lastActive}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="db-detail-btn">Copy portal link</button>
                <button className="db-detail-btn primary">
                  {client.portalEnabled
                    ? "Open live portal →"
                    : "Enable portal"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 0,
                borderBottom: "1px solid var(--faint2)",
              }}
            >
              {(["deliverables", "comments", "approvals"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.8rem",
                    fontWeight: tab === t ? 500 : 400,
                    color: tab === t ? "var(--ink)" : "var(--muted)",
                    borderBottom: `2px solid ${tab === t ? "var(--ink)" : "transparent"}`,
                    marginBottom: -1,
                    background: "transparent",
                    border: "none",
                    borderBottomStyle: "solid",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                  {t === "comments" &&
                    comments.filter((c) => !c.resolved).length > 0 && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontFamily: "var(--mono)",
                          fontSize: "0.58rem",
                          background: "var(--accent)",
                          color: "var(--accent-ink)",
                          padding: "1px 5px",
                          borderRadius: 99,
                          fontWeight: 600,
                        }}
                      >
                        {comments.filter((c) => !c.resolved).length}
                      </span>
                    )}
                </button>
              ))}
            </div>

            {/* Deliverables tab */}
            {tab === "deliverables" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {campaigns.length === 0 && (
                  <div
                    className="db-empty"
                    style={{
                      border: "1px solid var(--faint2)",
                      borderRadius: 6,
                    }}
                  >
                    No active campaigns for this client.
                  </div>
                )}
                {campaigns.map((camp) => (
                  <div key={camp.id} className="db-card">
                    <div className="db-card-header">
                      <div>
                        <div className="db-card-eyebrow">{camp.client}</div>
                        <h2 className="db-card-title">{camp.name}</h2>
                      </div>
                      <span className="db-status-pill">
                        <span
                          className={`db-dot ${{ review: "s-yellow", generating: "s-blue", approved: "s-green" }[camp.status]}`}
                        />
                        {camp.status === "review"
                          ? "Pending review"
                          : camp.status === "generating"
                            ? "Generating"
                            : "Approved"}
                      </span>
                    </div>
                    <div
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div className="db-progress-wrap">
                        <div className="db-progress-bar" style={{ flex: 1 }}>
                          <div
                            className={`db-progress-fill ${camp.status}`}
                            style={{ width: `${camp.progress}%` }}
                          />
                        </div>
                        <span className="db-progress-pct">
                          {camp.progress}%
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[
                          "Copy Suite",
                          "Visual Brief",
                          "Media Plan",
                          "Legal Docs",
                        ].map((d, i) => (
                          <div
                            key={d}
                            style={{
                              flex: 1,
                              padding: "10px 12px",
                              background: "var(--bg)",
                              border: "1px solid var(--faint2)",
                              borderRadius: 5,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color:
                                  camp.progress >= (i + 1) * 25
                                    ? "var(--ink)"
                                    : "var(--faint2)",
                                marginBottom: 3,
                              }}
                            >
                              {d}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--mono)",
                                fontSize: "0.58rem",
                                color:
                                  camp.progress >= (i + 1) * 25
                                    ? "#15803d"
                                    : "var(--faint2)",
                              }}
                            >
                              {camp.progress >= (i + 1) * 25
                                ? "Ready"
                                : "Pending"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comments tab */}
            {tab === "comments" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {comments.length === 0 && (
                  <div
                    className="db-empty"
                    style={{
                      border: "1px solid var(--faint2)",
                      borderRadius: 6,
                    }}
                  >
                    No comments yet.
                  </div>
                )}
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="db-card"
                    style={{ opacity: c.resolved ? 0.5 : 1 }}
                  >
                    <div
                      style={{ padding: "14px 18px", display: "flex", gap: 12 }}
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
                        {c.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              color: "var(--ink)",
                            }}
                          >
                            {c.author}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.6rem",
                              color: "var(--muted)",
                            }}
                          >
                            {c.time}
                          </span>
                          {c.resolved && (
                            <span
                              style={{
                                fontFamily: "var(--mono)",
                                fontSize: "0.58rem",
                                color: "#15803d",
                                background: "#f0fdf4",
                                padding: "1px 6px",
                                borderRadius: 3,
                                border: "1px solid #bbf7d0",
                              }}
                            >
                              Resolved
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--ink)",
                            lineHeight: 1.5,
                          }}
                        >
                          {c.text}
                        </div>
                        {!c.resolved && (
                          <div
                            style={{ display: "flex", gap: 8, marginTop: 10 }}
                          >
                            <button
                              className="db-detail-btn"
                              style={{
                                fontSize: "0.72rem",
                                padding: "4px 10px",
                              }}
                            >
                              Reply
                            </button>
                            <button
                              className="db-detail-btn"
                              style={{
                                fontSize: "0.72rem",
                                padding: "4px 10px",
                              }}
                            >
                              Mark resolved
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approvals tab */}
            {tab === "approvals" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {campaigns.map((camp) => (
                  <div key={camp.id} className="db-card">
                    <div style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div className="db-client-name">{camp.name}</div>
                          <div className="db-campaign-name">
                            Due: {camp.due}
                          </div>
                        </div>
                        {camp.status === "approved" ? (
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.62rem",
                              color: "#15803d",
                              background: "#f0fdf4",
                              padding: "4px 10px",
                              borderRadius: 4,
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            ✓ Fully approved
                          </span>
                        ) : camp.status === "review" ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="db-detail-btn"
                              style={{
                                color: "#dc2626",
                                borderColor: "#fecaca",
                              }}
                            >
                              Request changes
                            </button>
                            <button className="db-detail-btn primary">
                              Approve all →
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.62rem",
                              color: "var(--muted)",
                            }}
                          >
                            Awaiting generation
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {camp.agents.map((a) => (
                          <div
                            key={a}
                            style={{
                              flex: 1,
                              padding: "8px 10px",
                              background: "var(--bg)",
                              border: "1px solid var(--faint2)",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--ink)",
                              }}
                            >
                              {a}
                            </span>
                            {camp.status === "approved" && (
                              <span
                                style={{
                                  color: "#22c55e",
                                  fontSize: "0.65rem",
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
