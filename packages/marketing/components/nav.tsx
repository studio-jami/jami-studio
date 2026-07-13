'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Config ───────────────────────────────────────────────────────
const SVG_BASE = 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons'

const NAV_LINKS = [
  { label: 'Parity',   href: '#parity' },
  { label: 'Jami',     href: '#jami' },
  { label: 'Registry', href: '#registry' },
  { label: 'Stack',    href: '#stack' },
]

const SOCIAL = [
  { label: 'GitHub',   href: 'https://github.com/studio-jami',               icon: `${SVG_BASE}/github/default.svg` },
  { label: 'X',        href: 'https://x.com/studio_jami',                     icon: `${SVG_BASE}/x/default.svg` },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/jami-studio/', icon: `${SVG_BASE}/linkedin/default.svg` },
]

// ─── Component ───────────────────────────────────────────────────
export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 border-b transition-colors duration-200',
        scrolled
          ? 'border-border bg-background/96 backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 md:px-10"
        aria-label="Primary navigation"
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.3em] text-foreground hover:text-primary transition-colors"
          aria-label="Jami Studio home"
        >
          Jami Studio
        </Link>

        {/* Centre links */}
        <ul className="hidden md:flex items-center gap-7" role="list">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-[0.8rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: social icons + CTA */}
        <div className="flex items-center gap-5">
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
                  className="invert"
                  unoptimized
                />
              </a>
            ))}
          </div>

          <Link
            href="https://intercal.jami.studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-rose text-rose px-4 py-1.5 text-[0.72rem] font-semibold tracking-wide hover:bg-rose hover:text-ink transition-colors"
          >
            Intercal
          </Link>
        </div>
      </nav>
    </header>
  )
}
