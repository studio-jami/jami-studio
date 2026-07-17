import Image from "next/image";
import Link from "next/link";

// ─── Footer ───────────────────────────────────────────────────────
// Dark base. Two rows: nav grid + bottom copyright bar.
// No rounded corners. Brand icons from theSVG.

const SVG = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}
interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Agent Parity", href: "#parity" },
      { label: "Jami Voice", href: "#jami" },
      { label: "Registry", href: "#registry" },
      { label: "Orchestration", href: "#orchestration" },
      { label: "Stack", href: "#stack" },
    ],
  },
  {
    heading: "Open Source",
    links: [
      { label: "Docs", href: "/docs" },
      {
        label: "GitHub",
        href: "https://github.com/studio-jami",
        external: true,
      },
      {
        label: "Intercal",
        href: "https://intercal.jami.studio/",
        external: true,
      },
    ],
  },
  {
    heading: "Connect",
    links: [
      {
        label: "X / Twitter",
        href: "https://x.com/studio_jami",
        external: true,
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/jami-studio/",
        external: true,
      },
    ],
  },
];

const SOCIAL = [
  {
    label: "GitHub",
    href: "https://github.com/studio-jami",
    icon: `${SVG}/github/default.svg`,
  },
  {
    label: "X",
    href: "https://x.com/studio_jami",
    icon: `${SVG}/x/default.svg`,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/jami-studio/",
    icon: `${SVG}/linkedin/default.svg`,
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-16">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-foreground hover:text-rose transition-colors"
              aria-label="Jami Studio home"
            >
              Jami Studio
            </Link>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Adaptable agent frameworks for real workspaces. Agents and
              interfaces sharing the same actions, state, and context.
            </p>
            <div className="flex items-center gap-4 mt-7">
              {SOCIAL.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="opacity-30 hover:opacity-70 transition-opacity"
                >
                  <Image
                    src={icon}
                    alt={label}
                    width={15}
                    height={15}
                    className="invert"
                    unoptimized
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground mb-6">
                {heading}
              </p>
              <ul className="flex flex-col gap-3.5" role="list">
                {links.map(({ label, href, external }) => (
                  <li key={label}>
                    {/* Cross-app paths (/docs, /apps) are served through the
                        fallback rewrite — must hard-navigate, not <Link>. */}
                    <a
                      href={href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            &copy; {year} Jami Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {/* /download isn't a page in this app yet — it still lives on
                the docs deployment, so use a hard nav instead of next/link
                and let the next.config.mjs fallback rewrite serve it. */}
            <a
              href="/download"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Download
            </a>
            <Link
              href="/brand"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Brand
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
          <p className="font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground/50">
            Provider-agnostic by design.
          </p>
        </div>
      </div>
    </footer>
  );
}
