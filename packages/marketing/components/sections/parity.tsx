// ─── Parity ───────────────────────────────────────────────────────
// Rose relief panel — warm light against the dark base.

const SURFACES = [
  { num: '01', label: 'Button / Form',    note: 'Human clicks. Action fires.' },
  { num: '02', label: 'Agent tool call',  note: 'Agent invokes. Same handler.' },
  { num: '03', label: 'Voice command',    note: 'Jami speaks the intent.' },
  { num: '04', label: 'MCP / A2A',        note: 'External agents reach in.' },
  { num: '05', label: 'Automation / CLI', note: 'Scheduled tasks, scripts.' },
]

export function Parity() {
  return (
    <section id="parity" className="bg-background border-t border-border" aria-labelledby="parity-heading">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-24 md:py-32">

        <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground mb-16">
          Agent &amp; UI parity
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left: numbered surface list */}
          <ol role="list" className="space-y-0">
            {SURFACES.map(({ num, label, note }) => (
              <li key={num} className="flex items-baseline gap-8 py-7 border-b border-border last:border-0">
                <span className="font-mono text-[0.62rem] text-muted-foreground/40 w-6 shrink-0">{num}</span>
                <div>
                  <p className="text-[1.3rem] font-semibold leading-snug text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{note}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Right: sticky editorial block */}
          <div className="lg:sticky lg:top-24 flex flex-col gap-8">
            <h2
              id="parity-heading"
              className="font-serif text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[0.94] tracking-tight text-foreground balance"
            >
              Every button<br />
              can be a tool.<br />
              Every tool<br />
              can have a UI.
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
              Define an operation once. It becomes reachable by a human, an 
              agent, a voice command, or a cron job, and always lands in the 
              same durable SQL state.
            </p>

            {/* Pull quote — dark inset card */}
            <div className="bg-card p-8 border-l-2 border-rose">
              <p className="font-serif italic text-[1.45rem] leading-snug mb-4">
                &ldquo;Agents and interfaces see the same world.&rdquo;
              </p>
              <p className="text-sm text-foreground/40 leading-relaxed">
                All state lives in SQL. Agent writes surface in the UI.
                User actions update agent context. No sync layer. No drift.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
