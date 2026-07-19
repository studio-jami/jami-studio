import Image from "next/image";

// ─── Hero ─────────────────────────────────────────────────────────
// Normal content flow (no forced min-h-screen) so the stat strip below the
// fold on tall screens is still close to the initial viewport instead of
// being pushed down by an artificial full-height section.
export function Hero() {
  return (
    <section
      className="relative pt-28 md:pt-32 overflow-hidden"
      aria-label="Hero"
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* Top strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="eyebrow">Jami: Just Another Machine Interface</p>
          <div className="hidden sm:flex items-center gap-3">
            {[
              "Provider-agnostic",
              "Interchangeable parts",
              "Always-on agent",
              "Open source",
            ].map((tag) => (
              <span
                key={tag}
                className="border border-border px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-widest text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Main — headline left, image right, top-aligned so the image
            doesn't hang low relative to the headline. */}
        <div className="mt-12 md:mt-16 flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-14">
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.98] tracking-tight balance">
              One action surface.
              <br />
              Built for <span className="text-rose">people</span>.
              <br />
              Ready for <span className="text-rose">agents</span>.
            </h1>
            <p className="mt-8 max-w-lg text-[1.05rem] text-muted-foreground leading-relaxed">
              Jami is an open source framework for customizable workspaces —
              mail, calendars, analytics, design, planning, research and beyond.
              Define an operation once and every interface gets it: buttons for
              humans, tools for the always-on agent, voice, and automations.
              Every part interchangeable — your models, your data, your hosting,
              your look.
            </p>
          </div>

          {/* Hero image */}
          <div className="lg:w-[38%] shrink-0">
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
      </div>

      {/* Stat bar — sits right under the main content, not pushed down by
          an artificial full-viewport section height. */}
      <div className="border-t border-border mt-14 md:mt-16">
        <dl className="mx-auto max-w-7xl px-6 md:px-10 grid grid-cols-1 sm:grid-cols-3">
          {(
            [
              [
                "One action surface",
                "Every button, tool call, and voice command runs the same code. Always.",
              ],
              [
                "Interchangeable parts",
                "Swap any layer — model, database, search, or storage — without rebuilding.",
              ],
              [
                "An agent that keeps up",
                "Always on, fully interruptible. Steer it, stop it, or take over any time.",
              ],
            ] as const
          ).map(([term, def], i) => (
            <div
              key={term}
              className={`px-8 py-7 ${i > 0 ? "border-t sm:border-t-0 sm:border-l border-border" : ""}`}
            >
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-rose mb-2">
                {term}
              </dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">
                {def}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
