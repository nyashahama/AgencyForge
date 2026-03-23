"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const shake = (el: HTMLInputElement | null) => {
    if (!el) return;
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { shake(emailRef.current); return; }
    if (!password) { shake(passwordRef.current); return; }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
      shake(emailRef.current);
      shake(passwordRef.current);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* ── Mobile brand header ── */}
      <div className="auth-mobile-header">
        <div className="auth-mobile-header-inner">
          <Link href="/" className="auth-left-logo">
            <div className="logo-mark">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L11 4.5V7.5L6 11L1 7.5V4.5L6 1Z" fill="#c8ff00" />
              </svg>
            </div>
            AgencyForge
          </Link>
          <span className="auth-mobile-tagline">The agency that runs <i>itself.</i></span>
        </div>
      </div>

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
          <div className="auth-live">
            <span className="auth-live-dot" />
            <span className="auth-live-text">
              <strong>12 agencies</strong> active right now
            </span>
          </div>

          <p className="auth-form-eyebrow">Account access</p>
          <h1 className="auth-form-h1">Sign in</h1>
          <p className="auth-form-sub">Enter your credentials to continue</p>

          {error && <div className="auth-error">{error}</div>}

          {/* Google */}
          <button type="button" className="auth-social-btn" style={{ marginBottom: "6px" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.612 14.013 17.64 11.806 17.64 9.2z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-or">
            <div className="auth-or-line" />
            <span className="auth-or-text">or</span>
            <div className="auth-or-line" />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email address</label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@agency.com"
                autoComplete="email"
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
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                autoComplete="current-password"
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
