import Link from "next/link";
import { BrandMark } from "./BrandMark";

export default function AuthCard({
  eyebrow,
  title,
  description,
  topText,
  topLinkHref,
  topLinkLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  topText: string;
  topLinkHref: string;
  topLinkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[36px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] p-6 backdrop-blur sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 lg:hidden">
          <BrandMark />
          <span className="text-sm font-semibold tracking-[-0.03em]">AgencyForge</span>
        </Link>
        <div className="ml-auto text-right text-sm text-[var(--foreground-muted)]">
          <span>{topText} </span>
          <Link href={topLinkHref} className="font-medium text-[var(--foreground)]">
            {topLinkLabel}
          </Link>
        </div>
      </div>
      <div className="mt-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-soft)]">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-0.05em]">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--foreground-muted)]">
          {description}
        </p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
