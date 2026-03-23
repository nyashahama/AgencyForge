"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FEATURES = [
  "AI agents generate campaigns from a single brief",
  "White-label portal — your branding everywhere",
  "Ad copy, design direction, media plans in seconds",
  "Legal docs and revision loops, automated",
  "Unlimited client workspaces on every plan",
];

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string };

function getStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map: Record<number, Strength> = {
    1: { score: 1, label: "Weak", color: "#ef4444" },
    2: { score: 2, label: "Fair", color: "#f97316" },
    3: { score: 3, label: "Good", color: "#eab308" },
    4: { score: 4, label: "Strong", color: "#22c55e" },
  };
  return map[score] ?? { score: 0, label: "", color: "" };
}

// Each filled bar gets the class matching the current strength level (all bars same color)
const LEVEL_CLASS: Record<number, string> = { 1: "weak", 2: "fair", 3: "good", 4: "strong" };

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const strength = getStrength(password);

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
    if (!name)     { shake(nameRef.current);     return; }
    if (!email)    { shake(emailRef.current);    return; }
    if (!password) { shake(passwordRef.current); return; }
    if (strength.score < 2) {
      shake(passwordRef.current);
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
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
              Free 14-day trial · No card needed
            </div>
            <h2 className="auth-brand-h2">
              Your agency,<br />
              <i>fully automated.</i>
            </h2>
            <p className="auth-brand-p">
              Upload a brief and watch AI agents build the entire campaign — copy, creative direction, media plan, and client-ready docs.
            </p>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "24px", marginBottom: "24px" }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "14px" }}>
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
              <span className="auth-stat-label">Full access,<br />cancel anytime</span>
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
          <div className="auth-live">
            <span className="auth-live-dot" />
            <span className="auth-live-text">
              <strong>3 agencies</strong> signed up in the last hour
            </span>
          </div>

          <p className="auth-form-eyebrow">Start for free</p>
          <h1 className="auth-form-h1">Create account</h1>
          <p className="auth-form-sub">14-day trial, no credit card required</p>

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
              <label htmlFor="name" className="auth-label">Full name</label>
              <input
                ref={nameRef}
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                placeholder="Alex Chen"
                autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Work email</label>
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
              <label htmlFor="password" className="auth-label">Password</label>
              <input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              {/* Strength meter */}
              {password.length > 0 && (
                <>
                  <div className="auth-strength" role="progressbar" aria-label={`Password strength: ${strength.label}`}>
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`auth-strength-bar${strength.score >= n ? ` ${LEVEL_CLASS[strength.score]}` : ""}`}
                      />
                    ))}
                  </div>
                  <p className="auth-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </>
              )}
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
