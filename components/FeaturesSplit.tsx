export default function FeaturesSplit() {
  return (
    <section className="sec" id="features">
      <div className="container">
        <div className="sec-head reveal">
          <div>
            <div className="sec-label">Platform</div>
            <h2 className="sec-h2">
              Everything your
              <br />
              <i>team doesn't have</i>
              <br />
              time to do.
            </h2>
          </div>
          <p className="sec-note">
            Six specialized agents running in parallel. Each one built for a
            specific agency function — not a generic assistant.
          </p>
        </div>
        <div className="feature-split reveal">
          <div className="feat-left">
            <div className="feat-tag">Copy + Content</div>
            <h3 className="feat-h3">
              On-brand copy,
              <br />
              <i>at scale.</i>
            </h3>
            <p className="feat-p">
              The copy agent trains on your client's voice from their existing
              materials, then generates ad copy, scripts, long-form content, and
              email sequences — all in that voice, first draft.
            </p>
            <ul className="feat-list">
              <li>24 variants per brief, ranked by predicted performance</li>
              <li>Multi-channel: social, OOH, digital, broadcast, email</li>
              <li>Brand voice memory across all campaigns</li>
              <li>Localization and tone-switching built in</li>
            </ul>
          </div>
          <div className="feat-right">
            <div className="feat-row">
              <div className="feat-row-left">
                <div className="feat-row-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="2"
                      y="4"
                      width="12"
                      height="8"
                      rx="1.5"
                      stroke="#0e0e0e"
                      strokeWidth="1.1"
                    />
                    <path
                      d="M5 8h6M5 10.5h4"
                      stroke="#0e0e0e"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="feat-row-title">Design Direction</div>
                  <div className="feat-row-sub">
                    Moodboards, style guides, art direction
                  </div>
                </div>
              </div>
              <span className="feat-row-badge">Agent 02</span>
            </div>
            <div className="feat-row">
              <div className="feat-row-left">
                <div className="feat-row-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 11l4-5 3 3 2-3 3 5"
                      stroke="#0e0e0e"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="feat-row-title">Media Planning</div>
                  <div className="feat-row-sub">
                    Channel mix, CPMs, reach projections
                  </div>
                </div>
              </div>
              <span className="feat-row-badge">Agent 03</span>
            </div>
            <div className="feat-row">
              <div className="feat-row-left">
                <div className="feat-row-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 2v12M4 5.5C4 4.1 5.3 3 8 3s4 1.1 4 2.5c0 3-8 3-8 6 0 1.4 1.3 2.5 4 2.5s4-1.1 4-2.5"
                      stroke="#0e0e0e"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="feat-row-title">Budget Optimization</div>
                  <div className="feat-row-sub">
                    Spend allocation with ROI modeling
                  </div>
                </div>
              </div>
              <span className="feat-row-badge">Agent 04</span>
            </div>
            <div className="feat-row">
              <div className="feat-row-left">
                <div className="feat-row-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 8h8M7 5l-3 3 3 3"
                      stroke="#0e0e0e"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="feat-row-title">Legal Documents</div>
                  <div className="feat-row-sub">
                    NDAs, usage rights, compliance review
                  </div>
                </div>
              </div>
              <span className="feat-row-badge">Agent 05</span>
            </div>
            <div className="feat-row">
              <div className="feat-row-left">
                <div className="feat-row-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle
                      cx="8"
                      cy="8"
                      r="5.5"
                      stroke="#0e0e0e"
                      strokeWidth="1.1"
                    />
                    <path
                      d="M6 8l1.5 1.5L10 6"
                      stroke="#0e0e0e"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="feat-row-title">Client Portal</div>
                  <div className="feat-row-sub">
                    White-label delivery and approvals
                  </div>
                </div>
              </div>
              <span className="feat-row-badge">Agent 06</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
