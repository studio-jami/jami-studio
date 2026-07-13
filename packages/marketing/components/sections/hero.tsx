import Link from 'next/link'
import Image from 'next/image'

// ─── Hero ─────────────────────────────────────────────────────────
export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-between pt-14 overflow-hidden" aria-label="Hero">

      {/* Top strip */}
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10 pt-16 flex items-center justify-between">
        <p className="eyebrow">JAMI: Just Another Machine Interface</p>
        <div className="hidden sm:flex items-center gap-3">
          {['Provider-agnostic', 'Agent-native', 'Durable state', 'Open source'].map((tag) => (
            <span key={tag} className="border border-border px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-widest text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Main — headline left, image right */}
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10 flex flex-col lg:flex-row lg:items-end gap-10">
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] tracking-tight balance">
            The workspace where<br />
            <span className="text-rose">agents</span> and<br />
            <span className="text-rose">humans</span> share<br />
            the same interface.
          </h1>
          <p className="mt-8 max-w-lg text-[1.05rem] text-muted-foreground leading-relaxed">
            JAMI is an open source framework for building agent-native applications. 
            Define your operations once in standard SQL and actions. They become 
            instantly accessible to humans through web interfaces, and to agents through 
            tools, voice, or automated tasks.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="https://github.com/studio-jami"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-rose text-ink px-8 py-3.5 text-sm font-semibold tracking-wide hover:bg-rose/85 transition-colors"
            >
              View on GitHub
            </Link>
            <Link
              href="https://intercal.jami.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border text-foreground px-8 py-3.5 text-sm font-medium hover:border-foreground/50 transition-colors"
            >
              Open Intercal &rarr;
            </Link>
          </div>
        </div>

        {/* Hero image */}
        <div className="lg:w-[40%] shrink-0 self-end">
          <div className="relative aspect-[4/3] w-full border-t border-l border-border overflow-hidden">
            <Image
              src="/images/hero-visual.png"
              alt="Agents and interfaces converging on one action surface"
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </div>

      {/* Bottom stat bar */}
      <div className="border-t border-border mt-16">
        <dl className="mx-auto max-w-7xl px-6 md:px-10 grid grid-cols-1 sm:grid-cols-3">
          {([
            ['One action surface',     'Every button, tool call, and voice command runs the same code. Always.'],
            ['SQL-backed state',       'Agents write directly to SQL where humans read. No sync layer, no drift.'],
            ['Swap any provider',      'Replace any layer: model, database, search, or storage, without rebuilding.'],
          ] as const).map(([term, def], i) => (
            <div key={term} className={`px-8 py-7 ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-border' : ''}`}>
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-rose mb-2">{term}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{def}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
