"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardHeader({
  user,
}: {
  user: { name: string };
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm text-[var(--foreground-muted)]">Welcome back</p>
        <h1 className="font-serif text-3xl tracking-[-0.04em] sm:text-4xl">
          {user.name}
        </h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search briefs, campaigns, clients..."
          className="sm:w-72"
        />
        <ThemeToggle />
        <Button variant="accent" className="rounded-full">
          Upload brief
        </Button>
      </div>
    </header>
  );
}
