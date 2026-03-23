"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FEATURES = [
  "AI agents generate campaigns from a single brief",
  "White-label portal, your branding everywhere",
  "Ad copy, design direction, media plans in seconds",
  "Legal docs and revision loops, automated",
  "Unlimited client workspaces on every plan",
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (name && email && password) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        router.push("/dashboard");
      } else {
        setError("Please fill in all fields");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* ── Left brand panel ── */}
      <div className="auth-left">
        <div className="auth-noise" />
        <div className="auth-grid-bg" />
        <div className="auth-left-inner">
          <Link href="/" className="auth-left-logo">
            <div className="logo-mark">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L11 4.5V7.5L6 11L1 7.5V4.5L6 1Z" fill="#c8ff00" />
              </svg>
            </div>
            AgencyForge
          </Link>

          <div className="auth-brand-content">
            <div className="auth-brand-kicker">
              <span className="kicker-dot" />
              Free trial · No credit card
            </div>
            <h2 className="auth-brand-h2">
              Your agency,<br />
              <i>fully automated.</i>
            </h2>
            <p className="auth-brand-p">
              Upload a brief and watch AI agents build the entire campaign — copy, creative direction, media plan, and client-ready docs.
            </p>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: "24px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: "14px",
              }}
            >
              What&apos;s included
            </p>
            <ul className="auth-feature-list">
              {FEATURES.map((f) => (
                <li key={f}>
                  <div className="auth-feature-check">
                    <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                      <path d="M1 3.5l2 2L7 1" stroke="#c8ff00" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-stats-row" style={{ marginBottom: 0 }}>
            <div>
              <span className="auth-stat-num">840+</span>
              <span className="auth-stat-label">Agencies<br />onboarded</span>
            </div>
            <div className="auth-stat-divider" />
            <div>
              <span className="auth-stat-num">14 days</span>
              <span className="auth-stat-label">Full trial,<br />no card needed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-right-nav">
          <span className="auth-right-nav-text">Already have an account?</span>
          <Link href="/login" className="btn-sm btn-ghost-sm">
            Sign in
          </Link>
        </div>

        <div className="auth-form-wrap">
          <p className="auth-form-eyebrow">Start for free</p>
          <h1 className="auth-form-h1">Create account</h1>
          <p className="auth-form-sub">14-day trial, no credit card required</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="name" className="auth-label">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                placeholder="Alex Chen"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@agency.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-accent auth-submit">
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Creating account…
                </>
              ) : (
                <>
                  Start free trial
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ display: "block" }}>
                    <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="auth-tos">
            By creating an account you agree to our{" "}
            <Link href="#">Terms of Service</Link> and{" "}
            <Link href="#">Privacy Policy</Link>.
          </p>

          <p className="auth-bottom-link">
            Already have an account?{" "}
            <Link href="/login">Sign in</Link>
          </p>
        </div>

        <div className="auth-right-footer">
          <span>© 2026 AgencyForge</span>
          <div className="auth-foot-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Security</a>
          </div>
        </div>
      </div>
    </div>
  );
}
