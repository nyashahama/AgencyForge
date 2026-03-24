// ─────────────────────────────────────────────
// ActivityFeed.jsx
// Live activity timeline.
// Receives: activity[] from data layer.
// Owns: display + optional "see all" toggle.
// ─────────────────────────────────────────────

const TYPE_COLORS = {
  approved: "var(--accent)",
  generate: "#60a5fa",
  comment: "#f59e0b",
  brief: "#a78bfa",
  legal: "#6ee7b7",
};

type ActivityItem = { id: number; type: string; text: string; time: string; icon: string };

export default function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  return (
    <div className="db-card db-activity-card">
      <div className="db-card-header">
        <div>
          <div className="db-card-eyebrow">Realtime</div>
          <h2 className="db-card-title">Activity</h2>
        </div>
      </div>

      <div className="db-activity-list">
        {activity.map((a: ActivityItem, i: number) => (
          <div key={a.id} className="db-activity-row">
            <div
              className="db-activity-icon"
              style={{ color: TYPE_COLORS[a.type as keyof typeof TYPE_COLORS] }}
            >
              {a.icon}
            </div>
            <div className="db-activity-body">
              <div className="db-activity-text">{a.text}</div>
              <div className="db-activity-time">{a.time}</div>
            </div>
            {i < activity.length - 1 && <div className="db-activity-line" />}
          </div>
        ))}
      </div>

      <button className="db-see-all">View full log →</button>
    </div>
  );
}
