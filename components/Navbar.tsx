import Link from "next/link";

export default function Navbar() {
  return (
    <nav>
      <div className="nav-bg"></div>
      <div className="nav-inner">
        <Link href="/" className="logo">
          <div className="logo-mark">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 4.5V7.5L6 11L1 7.5V4.5L6 1Z" fill="#c8ff00" />
            </svg>
          </div>
          AgencyForge
        </Link>
        <div className="nav-center">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#output">Outputs</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-right">
          <Link href="/login" className="btn-sm btn-ghost-sm">
            Log in
          </Link>
          <Link href="/signup" className="btn-sm btn-dark">
            Get started{" "}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{ display: "block" }}
            >
              <path
                d="M2 6h8M7 3l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
