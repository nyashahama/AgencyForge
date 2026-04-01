"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { BrandMark } from "./BrandMark";
import { buttonClass } from "@/components/ui/button";

export default function Navbar() {
  const links = [
    { href: "#how", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#output", label: "Outputs" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <nav className="sticky top-0 z-50 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 py-3 backdrop-blur md:px-6">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[-0.03em]">
          <BrandMark />
          <span>AgencyForge</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] p-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className={buttonClass({
              variant: "ghost",
              size: "sm",
              className: "rounded-full",
            })}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={buttonClass({
              variant: "default",
              size: "sm",
              className: "rounded-full",
            })}
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
