// ─────────────────────────────────────────────
// StatsBar.jsx
// Top-of-page KPI strip.
// Receives: stats[] from data layer.
// Owns: nothing beyond display.
// ─────────────────────────────────────────────

type Stat = { label: string; value: string; delta: string; up: boolean; tag: string };

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="db-stats-bar">
      {stats.map((s, i) => (
        <div key={i} className="db-stat">
          <div className="db-stat-tag">{s.tag}</div>
          <div className="db-stat-num">{s.value}</div>
          <div className="db-stat-label">{s.label}</div>
          <div className={`db-stat-delta ${s.up ? "up" : "down"}`}>
            <span>{s.up ? "↑" : "↓"}</span> {s.delta}
          </div>
        </div>
      ))}
    </div>
  );
}
