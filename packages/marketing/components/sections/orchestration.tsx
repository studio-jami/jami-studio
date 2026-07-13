// ─── Orchestration ────────────────────────────────────────────────
// Back on dark base. Teal left-border blockquote dominates the top.
// Resource list as a dense two-column ruled grid below.

const RESOURCES = [
  { label: 'Shared Inbox',  note: 'One inbox for messages, notifications, approvals.' },
  { label: 'Vault',         note: 'Encrypted shared credentials for every app in the suite.' },
  { label: 'Approvals',     note: 'Human-in-the-loop flows for sensitive agent operations.' },
  { label: 'Routing',       note: 'Cross-app delegation so specialist apps stay focused.' },
  { label: 'Delegation',    note: 'Tasks and context forwarded without leaving the workspace.' },
  { label: 'Audit log',     note: 'Every action recorded. Agent and human alike.' },
]

export function Orchestration() {
  return (
    <section id="orchestration" className="bg-background border-t border-border" aria-labelledby="orchestration-heading">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-24 md:py-32">

        {/* Full-width blockquote */}
        <blockquote className="border-l-[3px] border-teal pl-8 md:pl-14 mb-20">
          <p
            id="orchestration-heading"
            className="font-serif text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[0.93] tracking-tight text-foreground balance mb-5"
          >
            One inbox.<br />
            One vault.<br />
            <span className="text-teal">Everything</span> shared.
          </p>
          <footer className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
            Central orchestration
          </footer>
        </blockquote>

        {/* Body + resource grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-14 items-start">
          <p className="text-[1.05rem] text-muted-foreground leading-relaxed balance">
            The orchestration app connects the workspace. It manages shared resources, 
            including vaults, inboxes, approvals, routing, and cross-app delegation, 
            so every specialist app stays focused on its own domain instead of rebuilding 
            the same shared plumbing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-border">
            {RESOURCES.map(({ label, note }) => (
              <div key={label} className="border-b border-r border-border px-6 py-5 hover:bg-muted/30 transition-colors">
                <p className="text-[0.9rem] font-semibold text-foreground mb-1">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
