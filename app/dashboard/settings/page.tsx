"use client";

import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import DashboardPageIntro from "../components/DashboardPageIntro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMockDashboard } from "../components/mock-state";

export default function SettingsPage() {
  const { settings, updateSettingItem } = useMockDashboard();
  const [editingGroup, setEditingGroup] = useState<string | null>(null);

  return (
    <DashboardShell>
      <DashboardPageIntro
        eyebrow="Settings"
        title="Workspace controls"
        description="Configure brand defaults, notifications, and governance for the team."
        tone="from-rose-300/20 to-transparent"
      />
      <div className="grid gap-4 lg:grid-cols-3">
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
                onClick={() => setEditingGroup((current) => (current === group.id ? null : group.id))}
              >
                {editingGroup === group.id ? "Done" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--foreground-muted)]">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[18px] bg-[var(--surface-muted)] px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-soft)]">
                    {item.label}
                  </p>
                  {editingGroup === group.id ? (
                    <Input
                      value={item.value}
                      onChange={(event) =>
                        updateSettingItem(group.id, item.label, event.target.value)
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
