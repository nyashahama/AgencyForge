"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/session";
import { workspace } from "@/lib/api/endpoints";
import type { SettingGroup, SettingItem } from "@/lib/api/client";

function mapSettingItem(item: SettingItem) {
  return {
    label: item.label,
    key: item.key,
    value: item.value,
  };
}

function mapSettingGroup(g: SettingGroup) {
  return {
    id: g.id,
    key: g.key,
    name: g.name,
    description: g.description,
    items: g.items.map(mapSettingItem),
  };
}

export default function SettingsPage() {
  const { accessToken } = useAuth();
  const [settings, setSettings] = useState<ReturnType<typeof mapSettingGroup>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await workspace.settings.get(accessToken);
      setSettings(data.map(mapSettingGroup));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleEditToggle = async (groupId: string) => {
    if (editingGroup !== groupId) {
      setEditingGroup(groupId);
      return;
    }

    const group = settings.find((item) => item.id === groupId);
    if (!accessToken || !group) {
      setEditingGroup(null);
      return;
    }

    try {
      setSavingGroup(groupId);
      await workspace.settings.update(
        {
          items: group.items.map((item) => ({
            group_key: group.key,
            item_key: item.key,
            value: item.value,
          })),
        },
        accessToken,
      );
      setEditingGroup(null);
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingGroup(null);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Settings"
        title="Workspace controls"
        description="Configure brand defaults, notifications, and governance for the team."
        tone="from-rose-300/20 to-transparent"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {error ? (
          <div className="lg:col-span-3 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : null}
        {settings.map((group) => (
          <Card key={group.id}>
            <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </div>
              <Button
                size="sm"
                variant={editingGroup === group.id ? "default" : "ghost"}
                onClick={() => void handleEditToggle(group.id)}
                disabled={savingGroup === group.id}
              >
                {savingGroup === group.id ? "Saving..." : editingGroup === group.id ? "Save" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--foreground-muted)]">
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className="rounded-[18px] bg-[var(--surface-muted)] px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                    {item.label}
                  </p>
                  {editingGroup === group.id ? (
                    <Input
                      value={item.value}
                      onChange={(event) =>
                        setSettings((current) =>
                          current.map((g) =>
                            g.id === group.id
                              ? {
                                  ...g,
                                  items: g.items.map((i) =>
                                    i.key === item.key ? { ...i, value: event.target.value } : i,
                                  ),
                                }
                              : g,
                          ),
                        )
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-[var(--foreground)]">{item.value}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
