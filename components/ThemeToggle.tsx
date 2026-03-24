"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="btn-sm btn-ghost-sm theme-toggle"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        /* Sun */
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: "block" }}>
          <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M7 1.5V3M7 11v1.5M1.5 7H3M11 7h1.5M3.22 3.22l1.06 1.06M9.72 9.72l1.06 1.06M9.72 4.28l1.06-1.06M3.22 10.78l1.06-1.06"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        /* Moon */
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: "block" }}>
          <path
            d="M11.5 8A5 5 0 0 1 6 2.5a5 5 0 1 0 5.5 5.5z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
