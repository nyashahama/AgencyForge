"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (email && password) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        router.push("/dashboard");
      } else {
        setError("Please fill in all fields");
      }
    } catch {
      setError("Invalid email or password");
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
              Your agency never sleeps
            </div>
            <h2 className="auth-brand-h2">
              Welcome back.<br />
              The work kept <i>running.</i>
            </h2>
            <p className="auth-brand-p">
              Every brief you uploaded is still processing. Every client still receiving. Pick up exactly where you left off.
            </p>
          </div>

          <div className="auth-stats-row">
            <div>
              <span className="auth-stat-num">2.4K</span>
              <span className="auth-stat-label">Campaigns<br />generated today</span>
            </div>
            <div className="auth-stat-divider" />
            <div>
              <span className="auth-stat-num">99.9%</span>
              <span className="auth-stat-label">Platform<br />uptime this month</span>
            </div>
            <div className="auth-stat-divider" />
            <div>
              <span className="auth-stat-num">4.3s</span>
              <span className="auth-stat-label">Avg. brief<br />turnaround</span>
            </div>
          </div>

          <div className="auth-quote">
            <p className="auth-quote-text">
              "We delivered 3× more campaigns last quarter without hiring a single person."
            </p>
            <div className="auth-quote-who">
              <div className="auth-quote-av">SR</div>
              <div>
                <div className="auth-quote-name">Sarah R.</div>
                <div className="auth-quote-role">Creative Director, Meld Studio</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-right-nav">
          <span className="auth-right-nav-text">No account yet?</span>
          <Link href="/signup" className="btn-sm btn-dark">
            Get started{" "}
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ display: "block" }}>
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="auth-form-wrap">
          <p className="auth-form-eyebrow">Account access</p>
          <h1 className="auth-form-h1">Sign in</h1>
          <p className="auth-form-sub">Enter your credentials to continue</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Email address
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
              <div className="auth-label-row">
                <label htmlFor="password" className="auth-label" style={{ margin: 0 }}>
                  Password
                </label>
                <a href="#" className="auth-forgot">Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-accent auth-submit">
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ display: "block" }}>
                    <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="auth-bottom-link">
            Don&apos;t have an account?{" "}
            <Link href="/signup">Create one free</Link>
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
