"use client";
type Agent = { name: string; status: string; load: number; color: string };

export default function AgentStatus({ agents }: { agents: Agent[] }) {
  return (
    <div className="db-card db-agent-card">
      <div className="db-card-header">
        <div>
          <div className="db-card-eyebrow">System</div>
          <h2 className="db-card-title">Agent status</h2>
        </div>
        <span className="db-all-live">
          <span className="db-dot s-green" />
          All systems go
        </span>
      </div>

      <div className="db-agents-list">
        {agents.map((a) => (
          <div key={a.name} className="db-agent-row">
            <div className="db-agent-left">
              <div className={`db-agent-indicator ${a.status}`} />
              <span className="db-agent-name">{a.name}</span>
            </div>
            <div className="db-agent-bar-wrap">
              <div className="db-agent-bar">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`db-agent-pip ${i < a.load ? "filled" : ""}`}
                  />
                ))}
              </div>
              <span className="db-agent-load">
                {a.status === "idle"
                  ? "Idle"
                  : `${a.load} task${a.load !== 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
