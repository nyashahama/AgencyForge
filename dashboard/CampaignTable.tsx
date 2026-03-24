"use client";

import { useState } from "react";

type Status = "review" | "generating" | "approved";
type Campaign = {
  id: string; client: string; name: string; status: Status;
  statusLabel: string; agents: string[]; progress: number;
  due: string; urgent: boolean;
};

const STATUS_MAP: Record<Status, { dot: string; label: string }> = {
  review:     { dot: "s-yellow", label: "Pending review" },
  generating: { dot: "s-blue",   label: "Generating" },
  approved:   { dot: "s-green",  label: "Approved" },
};

export default function CampaignTable({
  campaigns, filter, setFilter,
}: {
  campaigns: Campaign[];
  filter: string;
  setFilter: (f: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const FILTERS = ["all", "review", "generating", "approved"];

  const visible =
    filter === "all" ? campaigns : campaigns.filter((c) => c.status === (filter as Status));

  return (
    <div className="db-card db-campaign-card">
      {/* Header */}
      <div className="db-card-header">
        <div>
          <div className="db-card-eyebrow">Active work</div>
          <h2 className="db-card-title">Campaigns</h2>
        </div>
        <div className="db-filter-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`db-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : STATUS_MAP[f as Status]?.label}
            </button>
          ))}
          <button className="db-new-btn">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M5.5 1v9M1 5.5h9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            New brief
          </button>
        </div>
      </div>

      {/* Table */}
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
          {visible.map((c) => (
              <tbody key={c.id}>
                <tr
                  className={`db-row ${c.urgent ? "urgent" : ""} ${expanded === c.id ? "expanded" : ""}`}
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                >
                  <td>
                    <div className="db-client-name">{c.client}</div>
                    <div className="db-campaign-name">{c.name}</div>
                  </td>
                  <td>
                    <span className="db-status-pill">
                      <span className={`db-dot ${STATUS_MAP[c.status].dot}`} />
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
                      <span className="db-progress-pct">{c.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`db-due ${c.urgent ? "urgent" : ""}`}>
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
                {expanded === c.id && (
                  <tr className="db-row-expanded">
                    <td colSpan={6}>
                      <div className="db-row-detail">
                        <div className="db-detail-col">
                          <div className="db-detail-label">Deliverables</div>
                          <div className="db-detail-items">
                            {[
                              "Campaign Copy Suite",
                              "Visual Direction Brief",
                              "Media Plan",
                              "Legal Documents",
                            ].map((d) => (
                              <span key={d} className="db-detail-item">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="db-detail-actions">
                          <button className="db-detail-btn primary">
                            Open campaign →
                          </button>
                          <button className="db-detail-btn">
                            Share portal
                          </button>
                          <button className="db-detail-btn">
                            Request revision
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
          <div className="db-empty">No campaigns with this status.</div>
        )}
      </div>
    </div>
  );
}
