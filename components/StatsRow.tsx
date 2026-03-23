export default function StatsRow() {
  return (
    <div className="stats-row reveal">
      <div className="stat-cell">
        <div className="stat-tag">Avg</div>
        <div className="stat-num">
          4.2<sup>h</sup>
        </div>
        <div className="stat-label">
          Brief to first
          <br />
          campaign delivery
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-tag">Lifetime</div>
        <div className="stat-num">
          3,400<sup>+</sup>
        </div>
        <div className="stat-label">
          Campaigns
          <br />
          generated
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-tag">Rate</div>
        <div className="stat-num">
          98<sup>%</sup>
        </div>
        <div className="stat-label">
          First-round client
          <br />
          approval rate
        </div>
      </div>
      <div className="stat-cell">
        <div className="stat-tag">Managed</div>
        <div className="stat-num">
          $2.1<sup>B</sup>
        </div>
        <div className="stat-label">
          In client billing
          <br />
          across agencies
        </div>
      </div>
    </div>
  );
}
