"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShowcase from "@/components/AuthShowcase";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function passwordStrength(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

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
  const strength = passwordStrength(password);

  const shake = (el: HTMLInputElement | null) => {
    if (!el) return;
    el.classList.remove("animate-[shake_0.35s_ease-in-out]");
    void el.offsetWidth;
    el.classList.add("animate-[shake_0.35s_ease-in-out]");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!name) {
      shake(nameRef.current);
      return;
    }
    if (!email) {
      shake(emailRef.current);
      return;
    }
    if (!password || strength < 2) {
      shake(passwordRef.current);
      setError("Choose a stronger password before continuing.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <AuthShowcase
          eyebrow="Free 14-day trial"
          title="Build your operating system."
          description="Launch with every specialist enabled: campaign generation, white-label delivery, approvals, and legal workflow included."
          stats={[
            { value: "840+", label: "Agencies onboarded" },
            { value: "14 days", label: "Full access, cancel anytime" },
            { value: "6", label: "Parallel specialist agents" },
          ]}
        />
        <AuthCard
          eyebrow="Start for free"
          title="Create account"
          description="Get the full platform for 14 days with no credit card required."
          topText="Already have an account?"
          topLinkHref="/login"
          topLinkLabel="Sign in"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>
              <Input
                ref={nameRef}
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex Chen"
                autoComplete="name"
                className="data-[shake=true]:animate-[shake_0.35s_ease-in-out]"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Work email
              </label>
              <Input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@agency.com"
                autoComplete="email"
                className="data-[shake=true]:animate-[shake_0.35s_ease-in-out]"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                className="data-[shake=true]:animate-[shake_0.35s_ease-in-out]"
              />
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4].map((segment) => (
                  <div
                    key={segment}
                    className={`h-2 flex-1 rounded-full ${
                      strength >= segment
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--surface-muted)]"
                    }`}
                  />
                ))}
              </div>
            </div>
            {error ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </div>
            ) : null}
            <Button
              type="submit"
              variant="accent"
              className="w-full rounded-full"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}
