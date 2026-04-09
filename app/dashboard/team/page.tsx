"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/session";
import { workspace as workspaceApi } from "@/lib/api/endpoints";
import type { WorkspaceInvite } from "@/lib/api/client";

const ROLE_OPTIONS = ["owner", "admin", "member", "viewer"] as const;

function formatStatus(invite: WorkspaceInvite) {
  switch (invite.status) {
    case "accepted":
      return "Accepted";
    case "revoked":
      return "Revoked";
    case "expired":
      return "Expired";
    default:
      return "Pending";
  }
}

export default function TeamPage() {
  const { accessToken, user } = useAuth();
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("member");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = useMemo(
    () => user?.role === "owner" || user?.role === "admin",
    [user?.role],
  );

  const loadInvites = useCallback(async () => {
    if (!accessToken || !canManage) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await workspaceApi.invites.list(accessToken);
      setInvites(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load team invites");
    } finally {
      setLoading(false);
    }
  }, [accessToken, canManage]);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);
    try {
      const created = await workspaceApi.invites.create({ email, role }, accessToken);
      setInvites((current) => [created, ...current]);
      setEmail("");
      setRole("member");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create invite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (inviteId: string) => {
    if (!accessToken) return;
    try {
      const updated = await workspaceApi.invites.resend(inviteId, accessToken);
      setInvites((current) =>
        current.map((invite) => (invite.id === inviteId ? updated : invite)),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend invite");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!accessToken) return;
    try {
      await workspaceApi.invites.revoke(inviteId, accessToken);
      setInvites((current) =>
        current.map((invite) =>
          invite.id === inviteId
            ? { ...invite, status: "revoked", revoked_at: new Date().toISOString() }
            : invite,
        ),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke invite");
    }
  };

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow={user?.agency ?? "Workspace"}
        title="Team access"
        description="Manage operator invitations, watch acceptance status, and keep the workspace role map under owner-admin control."
        tone="from-cyan-300/20 to-transparent"
      />

      {!canManage ? (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--foreground-muted)]">
          Only owners and admins can manage operator invites.
        </div>
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateInvite}
            className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-[1.4fr_0.8fr_auto]"
          >
            <div>
              <label htmlFor="invite-email" className="mb-2 block text-sm font-medium">
                Operator email
              </label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="operator@agency.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="mb-2 block text-sm font-medium">
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(event) => setRole(event.target.value as (typeof ROLE_OPTIONS)[number])}
                className="flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--border-strong)] focus:ring-4 focus:ring-[var(--ring)]"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="accent"
                className="w-full rounded-full"
                disabled={submitting || !email.trim()}
              >
                {submitting ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </form>

          {error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <p className="text-sm font-medium">Outstanding and historical invites</p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Owners and admins can resend or revoke pending invitations.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void loadInvites()}>
                Refresh
              </Button>
            </div>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
              </div>
            ) : invites.length === 0 ? (
              <div className="px-5 py-8 text-sm text-[var(--foreground-muted)]">
                No operator invites have been issued yet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{invite.email}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                        {invite.role} · {formatStatus(invite)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                        Expires {new Date(invite.expires_at).toLocaleString()}
                        {invite.invited_by_name ? ` · sent by ${invite.invited_by_name}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={invite.status !== "pending"}
                        onClick={() => void handleResend(invite.id)}
                      >
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        disabled={invite.status !== "pending"}
                        onClick={() => void handleRevoke(invite.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
