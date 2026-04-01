import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { Badge } from "./ui/badge";

export default function AuthShowcase({
  eyebrow,
  title,
  description,
  stats,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="relative hidden overflow-hidden rounded-[36px] border border-[var(--accent-border)] bg-[linear-gradient(160deg,rgba(215,255,70,0.18),rgba(20,24,28,0.96))] p-8 text-white lg:flex lg:flex-col">
      <div className="noise absolute inset-0 opacity-10" />
      <div className="relative">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <span className="text-sm font-semibold tracking-[-0.03em]">
            AgencyForge
          </span>
        </Link>
        <Badge variant="accent" className="mt-10 w-fit bg-white/8 text-[var(--accent)]">
          {eyebrow}
        </Badge>
        <h2 className="mt-6 font-serif text-6xl leading-none tracking-[-0.06em]">
          {title}
        </h2>
        <p className="mt-6 max-w-xl text-base leading-8 text-white/70">
          {description}
        </p>
      </div>
      <div className="relative mt-auto grid gap-4 pt-12">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[24px] border border-white/10 bg-white/6 p-5"
          >
            <p className="font-serif text-4xl tracking-[-0.05em]">{stat.value}</p>
            <p className="mt-2 text-sm text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
