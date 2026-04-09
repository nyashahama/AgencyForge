"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AuthShowcase from "@/components/AuthShowcase";
import AuthCard from "@/components/AuthCard";
import { Button, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invites as invitesApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/session";
import type { InvitePreview } from "@/lib/api/client";

function statusCopy(status: InvitePreview["status"]) {
  switch (status) {
    case "accepted":
      return {
        title: "Invite already used",
        description: "This invite has already been accepted. Sign in with the account that was created from it.",
      };
    case "revoked":
      return {
        title: "Invite revoked",
        description: "The workspace owner revoked this invite. Ask them to send a fresh one.",
      };
    case "expired":
      return {
        title: "Invite expired",
        description: "This invite link expired before it was accepted. Ask for a resend from the workspace owner.",
      };
    default:
      return {
        title: "Join the operator workspace",
        description: "Set your name and password once, then step directly into the live delivery console.",
      };
  }
}

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { refreshSession } = useAuth();
  const token = useMemo(() => {
    const raw = params?.token;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadInvite() {
      try {
        setLoading(true);
        const data = await invitesApi.inspect(token);
        if (!cancelled) {
          setInvite(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load invite");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInvite();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const copy = invite ? statusCopy(invite.status) : statusCopy("pending");

  const handleAccept = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError("");
    try {
      await invitesApi.accept(token, { name, password });
      await refreshSession();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept invite");
    } finally {
      setSubmitting(false);
    }
  };

  const canAccept = invite?.status === "pending";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <AuthShowcase
          eyebrow="Operator onboarding"
          title="You were added to a live workspace."
          description="Briefs, campaign reviews, and approvals are already moving. Finish setup once and enter with the right agency context attached."
          stats={[
            { value: invite?.role?.toUpperCase() ?? "INVITE", label: "Assigned role" },
            { value: invite?.email ?? "Pending", label: "Destination email" },
            { value: invite ? new Date(invite.expires_at).toLocaleDateString() : "Loading", label: "Invite expiry" },
          ]}
        />
        <AuthCard
          eyebrow="Workspace invite"
          title={copy.title}
          description={copy.description}
          topText="Already onboarded?"
          topLinkHref="/login"
          topLinkLabel="Sign in"
        >
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : canAccept ? (
            <form onSubmit={handleAccept} className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                <p className="font-medium text-[var(--foreground)]">{invite?.email}</p>
                <p className="mt-1">
                  Role: <span className="font-medium capitalize text-[var(--foreground)]">{invite?.role}</span>
                </p>
              </div>
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Full name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Chen"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
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
                disabled={submitting || !name.trim() || password.length < 8}
              >
                {submitting ? "Activating workspace..." : "Accept invite"}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--foreground-muted)]">
                {error || copy.description}
              </div>
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className={buttonClass({
                    variant: "accent",
                    className: "rounded-full",
                  })}
                >
                  Go to sign in
                </Link>
                <Link
                  href="/"
                  className={buttonClass({
                    variant: "outline",
                    className: "rounded-full",
                  })}
                >
                  Back home
                </Link>
              </div>
            </div>
          )}
        </AuthCard>
      </div>
    </main>
  );
}
