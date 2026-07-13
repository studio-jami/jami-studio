import Image from 'next/image'

// ─── Registry ─────────────────────────────────────────────────────
// Amber relief panel. Suites as a ruled list, not a card grid.
// Image sits as a full-width bleed block at the top.

const SUITES = [
  { name: 'Business', color: 'text-rose',   apps: ['Mail', 'Calendar', 'Forms', 'Analytics', 'Content', 'Orchestration'] },
  { name: 'Design',   color: 'text-violet', apps: ['Design', 'Assets', 'Slides', 'Clips', 'Visual Planning'] },
  { name: 'Research', color: 'text-teal',   apps: ['Knowledge', 'Sources', 'Reports', 'Content DB', 'Data Connectors'] },
  { name: 'Coding',   color: 'text-amber',  apps: ['Visual Plans', 'PR Recaps', 'Code Agents', 'Browser Debug', 'Harness'] },
]

const HARNESSES = [
  { num: '01', name: 'Coding agents',    note: 'Safe operating environment for coding agents.' },
  { num: '02', name: 'Browser sessions', note: 'Visual browsing and scraping harnesses.' },
  { num: '03', name: 'Visual planning',  note: 'Spatial canvas harness for planning agents.' },
  { num: '04', name: 'PR recaps',        note: 'Automated pull-request summarisation.' },
  { num: '05', name: 'MCP / A2A bridge', note: 'Protocol bridge for external agent access.' },
]

export function Registry() {
  return (
    <section id="registry" className="bg-background border-t border-border" aria-labelledby="registry-heading">

      {/* Full-bleed image strip */}
      <div className="relative h-52 md:h-72 w-full overflow-hidden border-b border-border">
        <Image
          src="/images/registry-visual.png"
          alt="Four workspace suites: Business, Design, Research, Coding"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/30" aria-hidden="true" />
      </div>

      <div className="mx-auto max-w-7xl px-6 md:px-10 py-24 md:py-32">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 items-start">

          {/* Left: headline */}
          <div className="lg:sticky lg:top-24">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground mb-8">
              Registry &amp; suites
            </p>
            <h2
              id="registry-heading"
              className="font-serif text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[0.94] tracking-tight text-foreground balance mb-8"
            >
              One app,<br />
              one harness,<br />
              or an intentional<br />
              suite.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
              Start with a single installable harness and grow into a coordinated
              workspace of specialist apps that all share the same action surface
              and SQL state.
            </p>
          </div>

          {/* Right: suites + harnesses */}
          <div>
            {/* Suite list */}
            <div className="border-t border-border mb-10">
              {SUITES.map(({ name, color, apps }) => (
                <div key={name} className="flex items-start gap-8 py-7 border-b border-border">
                  <p className={`font-mono text-[0.65rem] uppercase tracking-widest w-20 shrink-0 mt-1 ${color}`}>
                    {name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {apps.map((app) => (
                      <span key={app} className="border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Harnesses — card style */}
            <div className="bg-card border border-border p-8">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground mb-8">
                Harnesses
              </p>
              <ol role="list" className="space-y-0">
                {HARNESSES.map(({ num, name, note }) => (
                  <li key={num} className="flex items-baseline gap-7 py-4 border-b border-border last:border-0">
                    <span className="font-mono text-[0.6rem] text-muted-foreground/35 w-5 shrink-0">{num}</span>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                      <p className="text-sm font-semibold text-foreground shrink-0">{name}</p>
                      <p className="text-sm text-muted-foreground/75">{note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
