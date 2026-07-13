import Image from 'next/image'
import Link from 'next/link'

// ─── Stack ────────────────────────────────────────────────────────
// Violet relief panel. Provider lanes as a horizontal ruled table.
// Brand icons via theSVG.org — fetched at render, invert-filtered for dark bg.

const SVG = 'https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons'

interface Lane {
  label:   string
  items:   { name: string; icon?: string }[]
  accent:  string
}

const LANES: Lane[] = [
  {
    label:  'Models',
    accent: 'text-rose',
    items:  [
      { name: 'OpenAI',    icon: `${SVG}/openai/default.svg` },
      { name: 'Anthropic', icon: `${SVG}/anthropic/default.svg` },
      { name: 'Gemini',    icon: `${SVG}/google/default.svg` },
      { name: 'Local',     icon: `${SVG}/ollama/default.svg` },
    ],
  },
  {
    label:  'Databases',
    accent: 'text-teal',
    items:  [
      { name: 'Postgres',    icon: `${SVG}/postgresql/default.svg` },
      { name: 'Neon',        icon: `${SVG}/neon/default.svg` },
      { name: 'SQLite',      icon: `${SVG}/sqlite/default.svg` },
      { name: 'PlanetScale', icon: `${SVG}/planetscale/default.svg` },
    ],
  },
  {
    label:  'Search',
    accent: 'text-amber',
    items:  [
      { name: 'Typesense',   icon: `${SVG}/typesense/default.svg` },
      { name: 'Meilisearch', icon: `${SVG}/meilisearch/default.svg` },
      { name: 'Algolia',     icon: `${SVG}/algolia/default.svg` },
      { name: 'Elastic',     icon: `${SVG}/elastic/default.svg` },
    ],
  },
  {
    label:  'Storage / CDN',
    accent: 'text-violet',
    items:  [
      { name: 'Cloudflare', icon: `${SVG}/cloudflare/default.svg` },
      { name: 'Vercel',     icon: `${SVG}/vercel/default.svg` },
      { name: 'S3',         icon: `${SVG}/aws/default.svg` },
      { name: 'R2',         icon: `${SVG}/cloudflare/default.svg` },
    ],
  },
  {
    label:  'Analytics',
    accent: 'text-rose',
    items:  [
      { name: 'PostHog',  icon: `${SVG}/posthog/default.svg` },
      { name: 'Sentry',   icon: `${SVG}/sentry/default.svg` },
      { name: 'Mixpanel', icon: `${SVG}/mixpanel/default.svg` },
      { name: 'Custom' },
    ],
  },
  {
    label:  'Deployment',
    accent: 'text-teal',
    items:  [
      { name: 'Vercel',      icon: `${SVG}/vercel/default.svg` },
      { name: 'Fly',         icon: `${SVG}/fly/default.svg` },
      { name: 'Railway',     icon: `${SVG}/railway/default.svg` },
      { name: 'Self-hosted' },
    ],
  },
]

export function Stack() {
  return (
    <section id="stack" className="bg-background border-t border-border" aria-labelledby="stack-heading">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-24 md:py-32">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-16">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground mb-8">
              Provider-agnostic by design
            </p>
            <h2
              id="stack-heading"
              className="font-serif text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[0.94] tracking-tight text-foreground balance"
            >
              Bring your<br />
              providers.<br />
              <span className="u-amber">Swap anything.</span>
            </h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md lg:self-end">
            Every layer is replaceable. Model, database, search, storage, analytics, 
            and deployment: teams evolve their stack without touching application logic. 
            No lock-in at any tier.
          </p>
        </div>

        {/* Provider table */}
        <div className="border-t border-l border-border">
          {LANES.map(({ label, accent, items }) => (
            <div key={label} className="flex flex-col sm:flex-row border-b border-r border-border">
              <div className="sm:w-36 shrink-0 px-5 py-4 border-b sm:border-b-0 sm:border-r border-border flex items-center">
                <p className={`font-mono text-[0.62rem] uppercase tracking-widest ${accent}`}>{label}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                {items.map(({ name, icon }) => (
                  <span key={name} className="flex items-center gap-2 bg-card border border-border px-3 py-1.5">
                    {icon && (
                      <Image
                        src={icon}
                        alt={name}
                        width={14}
                        height={14}
                        className="opacity-60"
                        unoptimized
                      />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">{name}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 border border-border bg-card px-8 py-5 mt-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Run locally. Deploy anywhere. Evolve from one harness to a full workspace suite.
          </p>
          <Link
            href="https://github.com/studio-jami"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-foreground text-background px-7 py-3 text-sm font-semibold tracking-wide hover:bg-rose hover:text-ink transition-colors"
          >
            View on GitHub
          </Link>
        </div>

      </div>
    </section>
  )
}
