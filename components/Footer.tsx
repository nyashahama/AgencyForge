export default function Footer() {
  const links = ["Privacy", "Terms", "Security", "Status", "Changelog"];

  return (
    <footer className="px-4 pb-10 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[var(--border)] pt-8 text-sm text-[var(--foreground-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>AgencyForge © 2026</span>
        <div className="flex flex-wrap gap-4">
          {links.map((link) => (
            <a key={link} href="#">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
