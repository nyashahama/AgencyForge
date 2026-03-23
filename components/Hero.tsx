import React from "react";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-noise"></div>
      <div className="hero-grid"></div>
      <div className="hero-content">
        <div className="hero-kicker">
          <span className="kicker-dot"></span>
          Beta — Now open &nbsp;·&nbsp; v1.4.0
        </div>
        <h1 className="hero-h1">
          The agency
          <br />
          that runs <i>itself.</i>
        </h1>
      </div>
      <div className="hero-bottom">
        <p className="hero-desc">
          Upload a client brief. <b>AI agents</b> generate finished campaigns,
          ad copy, design direction, media plans, and legal docs — delivered
          through your white-label portal.
        </p>
        <div className="hero-actions">
          <a href="#" className="btn-accent">
            Start free trial{" "}
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              style={{ display: "block" }}
            >
              <path
                d="M2.5 6.5h8M7 3l3.5 3.5L7 10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a href="#how" className="btn-outline">
            See how it works
          </a>
        </div>
      </div>
      <div className="hero-ticker">
        <div className="ticker-track">
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="ticker-item">
                <span>01</span> Brief intake
              </div>
              <div className="ticker-item">
                <span>02</span> AI analysis
              </div>
              <div className="ticker-item">
                <span>03</span> Copy generation
              </div>
              <div className="ticker-item">
                <span>04</span> Design direction
              </div>
              <div className="ticker-item">
                <span>05</span> Media planning
              </div>
              <div className="ticker-item">
                <span>06</span> Legal review
              </div>
              <div className="ticker-item">
                <span>07</span> Client delivery
              </div>
              <div className="ticker-item">
                <span>08</span> Revision loop
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
