"use client";

type Datum = { day: string; campaigns: number };

export default function ThroughputChart({
  throughput,
}: {
  throughput: Datum[];
}) {
  const max = Math.max(...throughput.map((d) => d.campaigns));
  const H = 64;
  const BAR_W = 24;
  const GAP = 10;
  const total = throughput.reduce((s, d) => s + d.campaigns, 0);

  return (
    <div className="db-card db-chart-card">
      <div className="db-card-header">
        <div>
          <div className="db-card-eyebrow">This week</div>
          <h2 className="db-card-title">Throughput</h2>
        </div>
        <div className="db-chart-meta">
          <span className="db-chart-total">{total}</span>
          <span className="db-chart-total-label">campaigns</span>
        </div>
      </div>

      <div className="db-chart-area">
        <svg
          width="100%"
          viewBox={`0 0 ${throughput.length * (BAR_W + GAP) - GAP} ${H + 24}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {throughput.map((d, i) => {
            const barH = (d.campaigns / max) * H;
            const x = i * (BAR_W + GAP);
            const y = H - barH;
            return (
              <g key={d.day}>
                {/* Track */}
                <rect
                  x={x}
                  y={0}
                  width={BAR_W}
                  height={H}
                  rx="3"
                  fill="var(--faint2)"
                  opacity="0.4"
                />
                {/* Fill */}
                <rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={barH}
                  rx="3"
                  fill="var(--accent)"
                />
                {/* Count */}
                <text
                  x={x + BAR_W / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--muted)"
                  fontFamily="var(--mono)"
                >
                  {d.campaigns}
                </text>
                {/* Day label */}
                <text
                  x={x + BAR_W / 2}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--muted)"
                  fontFamily="var(--mono)"
                >
                  {d.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
