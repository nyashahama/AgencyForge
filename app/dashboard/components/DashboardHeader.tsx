"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS, getDashboardNavItem } from "./navigation";

type User = {
  name: string;
  agency?: string;
};

export default function DashboardHeader({
  user,
}: {
  user: User;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const current = getDashboardNavItem(pathname);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="border-b border-[var(--border)]">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-[var(--foreground-muted)]">
            {user.agency ?? "Agency workspace"} · {current.eyebrow}
          </p>
          <h1 className="font-serif text-3xl tracking-[-0.04em] sm:text-4xl">
            {current.label}
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Signed in as {user.name}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto px-4 pb-4 sm:px-6">
        <nav className="flex min-w-max gap-2">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  active
                    ? "border-[var(--border-strong)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
