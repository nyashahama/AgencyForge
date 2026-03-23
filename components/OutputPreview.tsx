export default function OutputPreview() {
  return (
    <section className="sec" id="output">
      <div className="container">
        <div className="sec-head reveal">
          <div>
            <div className="sec-label">Deliverables</div>
            <h2 className="sec-h2">
              What ships
              <br />
              <i>with every brief.</i>
            </h2>
          </div>
          <p className="sec-note">
            A complete, client-ready package — not drafts. Every output is
            structured for immediate review and sign-off.
          </p>
        </div>
        <div className="output-grid reveal">
          <div className="output-card">
            <div className="output-type">Output 01</div>
            <div className="output-title">Campaign Copy Suite</div>
            <div className="output-sub">
              24 headline variants, 8 body copy directions, taglines, social
              captions, and email subject lines — all channel-adapted.
            </div>
            <div className="output-meta">
              <span className="output-status">
                <span className="status-dot s-green"></span>
                <span style={{ color: "#15803d" }}>Ready for review</span>
              </span>
              <span className="output-time">~12 min</span>
            </div>
          </div>
          <div className="output-card">
            <div className="output-type">Output 02</div>
            <div className="output-title">Visual Direction Brief</div>
            <div className="output-sub">
              Moodboard references, color palette rationale, typography
              direction, and art direction notes for production partners.
            </div>
            <div className="output-meta">
              <span className="output-status">
                <span className="status-dot s-green"></span>
                <span style={{ color: "#15803d" }}>Ready for review</span>
              </span>
              <span className="output-time">~8 min</span>
            </div>
          </div>
          <div className="output-card">
            <div className="output-type">Output 03</div>
            <div className="output-title">Media Plan</div>
            <div className="output-sub">
              Channel allocation, estimated CPMs, reach and frequency
              projections, flight dates, and budget breakdown by platform.
            </div>
            <div className="output-meta">
              <span className="output-status">
                <span className="status-dot s-green"></span>
                <span style={{ color: "#15803d" }}>Ready for review</span>
              </span>
              <span className="output-time">~6 min</span>
            </div>
          </div>
          <div className="output-card">
            <div className="output-type">Output 04</div>
            <div className="output-title">Legal Documents</div>
            <div className="output-sub">
              NDA, talent and usage rights agreements, platform-specific
              compliance checklist, and regulatory flagging report.
            </div>
            <div className="output-meta">
              <span className="output-status">
                <span className="status-dot s-yellow"></span>
                <span style={{ color: "#92400e" }}>Pending legal review</span>
              </span>
              <span className="output-time">~4 min</span>
            </div>
          </div>
          <div className="output-card">
            <div className="output-type">Output 05</div>
            <div className="output-title">Performance Forecast</div>
            <div className="output-sub">
              Projected CTR, conversion ranges, estimated ROAS by channel, and
              benchmark comparisons from similar campaign categories.
            </div>
            <div className="output-meta">
              <span className="output-status">
                <span className="status-dot s-green"></span>
                <span style={{ color: "#15803d" }}>Ready for review</span>
              </span>
              <span className="output-time">~5 min</span>
            </div>
          </div>
          <div className="output-card">
            <div className="output-type">Output 06</div>
            <div className="output-title">Client Presentation</div>
            <div className="output-sub">
              Structured deck combining all outputs: strategy rationale,
              creative direction, media plan, timeline, and investment summary.
            </div>
            <div className="output-meta">
              <span className="output-status">
                <span className="status-dot s-green"></span>
                <span style={{ color: "#15803d" }}>Ready for review</span>
              </span>
              <span className="output-time">~3 min</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
