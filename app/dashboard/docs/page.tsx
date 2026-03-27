"use client";

import { useState } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { USER, AGENTS } from "../components/data";

const DOCS = [
  {
    category: "Getting started",
    articles: [
      {
        id: "gs-1",
        title: "What is AgencyForge?",
        desc: "An overview of how the platform works and what AI agents do.",
        time: "3 min read",
        tag: "Intro",
      },
      {
        id: "gs-2",
        title: "Uploading your first brief",
        desc: "Step-by-step guide to formatting and uploading a client brief.",
        time: "5 min read",
        tag: "Tutorial",
      },
      {
        id: "gs-3",
        title: "Understanding agent roles",
        desc: "What Copy, Design, Media, Legal, Budget and Portal agents each do.",
        time: "4 min read",
        tag: "Reference",
      },
    ],
  },
  {
    category: "Campaigns",
    articles: [
      {
        id: "c-1",
        title: "Campaign lifecycle",
        desc: "How a brief moves from upload to approved deliverable.",
        time: "6 min read",
        tag: "Guide",
      },
      {
        id: "c-2",
        title: "Requesting revisions",
        desc: "How to loop agents back to regenerate specific deliverables.",
        time: "3 min read",
        tag: "How-to",
      },
      {
        id: "c-3",
        title: "Filtering and managing the table",
        desc: "Sort, filter, and triage campaigns in the main dashboard view.",
        time: "2 min read",
        tag: "How-to",
      },
    ],
  },
  {
    category: "Client portal",
    articles: [
      {
        id: "cp-1",
        title: "Setting up your white-label portal",
        desc: "Configure your subdomain, logo, and client-facing branding.",
        time: "5 min read",
        tag: "Setup",
      },
      {
        id: "cp-2",
        title: "Sharing deliverables with clients",
        desc: "How to send campaigns via the portal and track client views.",
        time: "4 min read",
        tag: "Guide",
      },
      {
        id: "cp-3",
        title: "Client approval workflows",
        desc: "Enable clients to approve, comment, or request changes inline.",
        time: "5 min read",
        tag: "Guide",
      },
    ],
  },
  {
    category: "Integrations",
    articles: [
      {
        id: "i-1",
        title: "Connecting Slack",
        desc: "Get real-time notifications when campaigns are ready for review.",
        time: "3 min read",
        tag: "Integration",
      },
      {
        id: "i-2",
        title: "Google Drive sync",
        desc: "Auto-export approved deliverables to a Drive folder of your choice.",
        time: "3 min read",
        tag: "Integration",
      },
      {
        id: "i-3",
        title: "Using the API",
        desc: "Trigger brief uploads and read campaign status programmatically.",
        time: "8 min read",
        tag: "Developer",
      },
    ],
  },
];

const TAG_COLORS: Record<string, string> = {
  Intro: "#a78bfa",
  Tutorial: "#60a5fa",
  Reference: "var(--muted)",
  Guide: "#f59e0b",
  "How-to": "#6ee7b7",
  Setup: "#f97316",
  Integration: "var(--accent)",
  Developer: "#f472b6",
};

export default function DocsPage() {
  const [search, setSearch] = useState("");
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const filtered = DOCS.map((section) => ({
    ...section,
    articles: section.articles.filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.desc.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((s) => s.articles.length > 0);

  const allArticle = DOCS.flatMap((s) => s.articles).find(
    (a) => a.id === openArticle,
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
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <div>
              <p className="db-card-eyebrow" style={{ marginBottom: "6px" }}>
                Help & reference
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
                Documentation
              </h1>
            </div>
            <a
              href="https://docs.agencyforge.io"
              target="_blank"
              rel="noreferrer"
              className="db-detail-btn"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Full docs site
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M2 9L9 2M9 2H4.5M9 2V6.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            >
              <circle
                cx="6"
                cy="6"
                r="4"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M9.5 9.5L12 12"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documentation…"
              style={{
                width: "100%",
                padding: "11px 14px 11px 38px",
                fontSize: "0.875rem",
                color: "var(--ink)",
                background: "var(--white)",
                border: "1px solid var(--faint2)",
                borderRadius: "var(--r)",
                fontFamily: "var(--sans)",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--muted)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--faint2)")}
            />
          </div>

          {/* Article reader */}
          {openArticle && allArticle ? (
            <div className="db-card" style={{ flex: 1 }}>
              <div className="db-card-header">
                <button
                  onClick={() => setOpenArticle(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.775rem",
                    color: "var(--muted)",
                    cursor: "pointer",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M9 5.5H2M2 5.5L5 2.5M2 5.5L5 8.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Back to docs
                </button>
              </div>
              <div style={{ padding: "32px 40px", maxWidth: "680px" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: "var(--mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.08em",
                    background: "rgba(0,0,0,0.04)",
                    color: TAG_COLORS[allArticle.tag] ?? "var(--muted)",
                    padding: "3px 8px",
                    borderRadius: "3px",
                    marginBottom: "16px",
                  }}
                >
                  {allArticle.tag}
                </span>
                <h2
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "1.75rem",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "var(--ink)",
                    marginBottom: "10px",
                    lineHeight: 1.25,
                  }}
                >
                  {allArticle.title}
                </h2>
                <p
                  style={{
                    fontSize: "0.825rem",
                    color: "var(--muted)",
                    marginBottom: "32px",
                  }}
                >
                  {allArticle.time}
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--ink)",
                    lineHeight: 1.75,
                    marginBottom: "20px",
                  }}
                >
                  {allArticle.desc} This article covers everything you need to
                  know to get the most out of this feature.
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--ink)",
                    lineHeight: 1.75,
                    marginBottom: "20px",
                  }}
                >
                  AgencyForge is built around the idea that great creative work
                  shouldn't be bottlenecked by manual process. Once you
                  understand how each agent operates, you can configure the
                  platform to match your existing workflow — or let it reshape
                  the way you work entirely.
                </p>
                <div
                  style={{
                    background: "var(--faint)",
                    borderLeft: "3px solid var(--accent)",
                    padding: "16px 20px",
                    borderRadius: "0 var(--r) var(--r) 0",
                    marginBottom: "20px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.825rem",
                      color: "var(--ink)",
                      lineHeight: 1.6,
                      fontWeight: 400,
                    }}
                  >
                    <strong>Pro tip:</strong> You can pause or restart any
                    individual agent mid-campaign from the Agent Status panel
                    without losing progress on other deliverables.
                  </p>
                </div>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--ink)",
                    lineHeight: 1.75,
                  }}
                >
                  For further reading, visit the full documentation site or
                  reach out via the in-app chat. Our team typically responds
                  within 2 hours.
                </p>
              </div>
            </div>
          ) : (
            /* Article grid */
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {filtered.length === 0 && (
                <div className="db-empty" style={{ padding: "48px" }}>
                  No articles found for "{search}".
                </div>
              )}
              {filtered.map((section) => (
                <div key={section.category} className="db-card">
                  <div className="db-card-header">
                    <div>
                      <div className="db-card-eyebrow">Section</div>
                      <h2 className="db-card-title">{section.category}</h2>
                    </div>
                  </div>
                  <div>
                    {section.articles.map((a, i) => (
                      <button
                        key={a.id}
                        onClick={() => setOpenArticle(a.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "16px 20px",
                          gap: "16px",
                          borderBottom:
                            i < section.articles.length - 1
                              ? "1px solid var(--faint)"
                              : "none",
                          cursor: "pointer",
                          textAlign: "left",
                          background: "transparent",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              background: "var(--faint)",
                              border: "1px solid var(--faint2)",
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                            }}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 13 13"
                              fill="none"
                            >
                              <rect
                                x="2"
                                y="1.5"
                                width="9"
                                height="10"
                                rx="1.5"
                                stroke="var(--muted)"
                                strokeWidth="1.1"
                              />
                              <path
                                d="M4.5 5h4M4.5 7h4M4.5 9h2"
                                stroke="var(--muted)"
                                strokeWidth="1.1"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 500,
                                color: "var(--ink)",
                                marginBottom: "3px",
                              }}
                            >
                              {a.title}
                            </div>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--muted)",
                                fontWeight: 300,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {a.desc}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.6rem",
                              color: TAG_COLORS[a.tag] ?? "var(--muted)",
                            }}
                          >
                            {a.tag}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.6rem",
                              color: "var(--faint2)",
                            }}
                          >
                            {a.time}
                          </span>
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 11 11"
                            fill="none"
                            style={{ color: "var(--faint2)" }}
                          >
                            <path
                              d="M2.5 5.5h6M6 3l2.5 2.5L6 8"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quick links */}
              <div className="db-card">
                <div className="db-card-header">
                  <div>
                    <div className="db-card-eyebrow">Support</div>
                    <h2 className="db-card-title">Need more help?</h2>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1px",
                    background: "var(--faint2)",
                  }}
                >
                  {[
                    {
                      icon: "✦",
                      title: "Live chat",
                      desc: "Talk to a human. Usually <2h reply.",
                      cta: "Start chat",
                    },
                    {
                      icon: "⊙",
                      title: "Status page",
                      desc: "Check platform uptime and incidents.",
                      cta: "View status",
                    },
                    {
                      icon: "↑",
                      title: "Feature requests",
                      desc: "Vote on what we build next.",
                      cta: "Submit idea",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      style={{ background: "var(--white)", padding: "20px" }}
                    >
                      <div
                        style={{
                          fontSize: "1rem",
                          marginBottom: "10px",
                          color: "var(--accent)",
                        }}
                      >
                        {item.icon}
                      </div>
                      <div
                        style={{
                          fontSize: "0.825rem",
                          fontWeight: 500,
                          color: "var(--ink)",
                          marginBottom: "4px",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--muted)",
                          marginBottom: "14px",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.desc}
                      </div>
                      <button
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "var(--ink)",
                          border: "1px solid var(--faint2)",
                          padding: "5px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        {item.cta} →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
