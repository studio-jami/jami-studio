"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { ThemeToggle } from "./theme-toggle";

// ─── Config ───────────────────────────────────────────────────────
const SVG_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

// True-centered on all three surfaces (marketing, /apps, /docs — see
// packages/docs/app/components/Header.tsx for the docs-side copy of this
// list). Jami always points at the marketing home, not an in-page anchor,
// so it behaves the same regardless of which surface you're on.
const NAV_LINKS = [
  { label: "Jami", href: "/" },
  { label: "Apps", href: "/apps" },
  { label: "Docs", href: "/docs" },
];

const SOCIAL = [
  {
    label: "GitHub",
    href: "https://github.com/studio-jami",
    icon: `${SVG_BASE}/github/default.svg`,
  },
  {
    label: "X",
    href: "https://x.com/studio_jami",
    icon: `${SVG_BASE}/x/default.svg`,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/jami-studio/",
    icon: `${SVG_BASE}/linkedin/default.svg`,
  },
];

// ─── Component ───────────────────────────────────────────────────
export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 border-b transition-colors duration-200",
        scrolled
          ? "border-border bg-background/96 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <nav
        className="grid h-14 w-full grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10"
        aria-label="Primary navigation"
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="justify-self-start font-mono text-[0.62rem] font-medium uppercase tracking-[0.3em] text-foreground hover:text-primary transition-colors"
          aria-label="Jami Studio home"
        >
          Jami Studio
        </Link>

        {/* True-centered links — middle grid column, so left/right groups
            of any width never pull it off-center. */}
        <ul
          className="hidden md:flex items-center gap-7 justify-self-center"
          role="list"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              {/* /apps and /docs live on the docs deployment behind the
                  next.config fallback rewrite — client-side <Link> 404s on
                  them, so cross-app paths must hard-navigate. Jami uses the
                  same hard <a> for consistency with the identical nav on
                  the docs/apps surfaces. */}
              <a
                href={href}
                className="text-[0.8rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right: social icons + theme toggle */}
        <div className="flex items-center justify-self-end gap-4">
          <div className="hidden sm:flex items-center gap-4">
            {SOCIAL.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="opacity-35 hover:opacity-80 transition-opacity"
              >
                <Image
                  src={icon}
                  alt={label}
                  width={15}
                  height={15}
                  className="invert light:invert-0"
                  unoptimized
                />
              </a>
            ))}
          </div>

          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
