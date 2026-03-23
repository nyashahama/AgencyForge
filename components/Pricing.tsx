export default function Pricing() {
  return (
    <section className="sec" id="pricing">
      <div className="container">
        <div className="sec-head reveal">
          <div>
            <div className="sec-label">Pricing</div>
            <h2 className="sec-h2">
              Simple, honest
              <br />
              <i>pricing.</i>
            </h2>
          </div>
          <p className="sec-note">
            No per-seat traps. No usage surprises. One price covers your whole
            team and every campaign you run.
          </p>
        </div>
        <div className="pricing-grid reveal">
          <div className="price-card">
            <div className="plan-label">Studio</div>
            <div className="plan-name">Studio</div>
            <div className="plan-blurb">
              Solo operators and boutique shops testing the model before
              scaling.
            </div>
            <div className="plan-price-row">
              <div className="plan-dollar">$149</div>
              <div className="plan-mo">/month</div>
            </div>
            <ul className="plan-features">
              <li>Up to 8 active campaigns</li>
              <li>All six AI agents</li>
              <li>Client portal — 1 workspace</li>
              <li>Legal document templates</li>
              <li>Email support</li>
            </ul>
            <a href="#" className="plan-cta cta-border">
              Get started
            </a>
          </div>
          <div className="price-card featured">
            <div className="pop-badge">Most popular</div>
            <div className="plan-label">Agency</div>
            <div className="plan-name">Agency</div>
            <div className="plan-blurb">
              Growing agencies running multiple clients and campaigns in
              parallel.
            </div>
            <div className="plan-price-row">
              <div className="plan-dollar">$499</div>
              <div className="plan-mo">/month</div>
            </div>
            <ul className="plan-features">
              <li>Unlimited campaigns</li>
              <li>Everything in Studio</li>
              <li>Unlimited client portals</li>
              <li>White-label branding</li>
              <li>Custom voice training</li>
              <li>Priority support</li>
            </ul>
            <a href="#" className="plan-cta cta-lime">
              Start free trial
            </a>
          </div>
          <div className="price-card">
            <div className="plan-label">Enterprise</div>
            <div className="plan-name">Enterprise</div>
            <div className="plan-blurb">
              Large agencies and holding groups with bespoke infrastructure
              needs.
            </div>
            <div className="plan-price-row">
              <div
                className="plan-dollar"
                style={{ fontSize: "2rem", paddingTop: "8px" }}
              >
                Custom
              </div>
            </div>
            <ul className="plan-features">
              <li>Everything in Agency</li>
              <li>SSO + custom auth</li>
              <li>VPC / on-prem deployment</li>
              <li>Custom model fine-tuning</li>
              <li>Dedicated CSM + SLA</li>
            </ul>
            <a href="#" className="plan-cta cta-border">
              Talk to sales →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
