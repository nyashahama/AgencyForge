"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/session";
import AuthShowcase from "@/components/AuthShowcase";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const shake = (el: HTMLInputElement | null) => {
    if (!el) return;
    el.classList.remove("animate-[shake_0.35s_ease-in-out]");
    void el.offsetWidth;
    el.classList.add("animate-[shake_0.35s_ease-in-out]");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email) {
      shake(emailRef.current);
      return;
    }
    if (!password) {
      shake(passwordRef.current);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <AuthShowcase
          eyebrow="Your agency never sleeps"
          title="Welcome back."
          description="Every brief, review, and approval thread kept moving. Step back into the operating layer without context switching."
          stats={[
            { value: "2.4K", label: "Campaigns generated today" },
            { value: "99.9%", label: "Platform uptime this month" },
            { value: "4.3h", label: "Average brief turnaround" },
          ]}
        />
        <AuthCard
          eyebrow="Account access"
          title="Sign in"
          description="Use your workspace credentials to continue into the delivery console."
          topText="No account yet?"
          topLinkHref="/signup"
          topLinkLabel="Get started"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
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
                placeholder="••••••••"
                autoComplete="current-password"
                className="data-[shake=true]:animate-[shake_0.35s_ease-in-out]"
              />
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
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}
