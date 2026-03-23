export default function HowItWorks() {
  return (
    <section className="sec" id="how">
      <div className="container">
        <div className="sec-head reveal">
          <div>
            <div className="sec-label">Process</div>
            <h2 className="sec-h2">
              Four steps.
              <br />
              <i>One input.</i>
            </h2>
          </div>
          <p className="sec-note">
            Drop in a brief — plain text, PDF, or structured form. Every
            deliverable flows from that single source of truth.
          </p>
        </div>
        <div className="steps reveal">
          <div className="step">
            <div className="step-bar"></div>
            <span className="step-n">01 / 04</span>
            <div className="step-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect
                  x="3"
                  y="2"
                  width="12"
                  height="14"
                  rx="2"
                  stroke="#0e0e0e"
                  strokeWidth="1.2"
                />
                <path
                  d="M6 6h6M6 9h6M6 12h4"
                  stroke="#0e0e0e"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="step-title">Upload Brief</div>
            <p className="step-desc">
              PDF, doc, or paste. AI extracts tone, audience, budget, channels,
              timeline, and objectives in seconds.
            </p>
          </div>
          <div className="step">
            <div className="step-bar"></div>
            <span className="step-n">02 / 04</span>
            <div className="step-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle
                  cx="9"
                  cy="9"
                  r="6.5"
                  stroke="#0e0e0e"
                  strokeWidth="1.2"
                />
                <path
                  d="M9 5.5v3.5l2.5 2"
                  stroke="#0e0e0e"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="step-title">Agents Activate</div>
            <p className="step-desc">
              Parallel agents handle copy, design direction, media mix, legal
              docs, and performance forecasting simultaneously.
            </p>
          </div>
          <div className="step">
            <div className="step-bar"></div>
            <span className="step-n">03 / 04</span>
            <div className="step-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 9h12M9 4l5 5-5 5"
                  stroke="#0e0e0e"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="step-title">Packaged & Delivered</div>
            <p className="step-desc">
              Complete campaign — scripts, variants, media plan, legal docs —
              lands in your white-label portal, ready to share.
            </p>
          </div>
          <div className="step">
            <div className="step-bar"></div>
            <span className="step-n">04 / 04</span>
            <div className="step-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M15 9A6 6 0 1 1 3 9"
                  stroke="#0e0e0e"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M15 5v4h-4"
                  stroke="#0e0e0e"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="step-title">Revise & Approve</div>
            <p className="step-desc">
              Clients comment in plain language. AI applies revisions across all
              assets and flags conflicts — no email threads.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
