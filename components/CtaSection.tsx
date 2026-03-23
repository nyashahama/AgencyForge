export default function CtaSection() {
  return (
    <section className="cta-section">
      <div className="cta-bg"></div>
      <div className="cta-lines"></div>
      <div className="container">
        <h2 className="cta-h2">
          Your agency,
          <br />
          <i>reimagined.</i>
        </h2>
        <p className="cta-sub">
          No onboarding calls. Upload your first brief and see a finished
          campaign in under an hour.
        </p>
        <div className="cta-actions">
          <a href="#" className="btn-accent-lg">
            Start free — no card needed{" "}
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
          <a href="#" className="btn-ghost-dark">
            Book a live demo
          </a>
        </div>
      </div>
    </section>
  );
}
