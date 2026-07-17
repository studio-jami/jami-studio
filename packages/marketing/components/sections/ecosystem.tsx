import Image from "next/image";
import Link from "next/link";

// ─── Ecosystem ────────────────────────────────────────────────────
// Dark base. Two giant blocks stacked: CTA strip + Intercal.
// Full-bleed image sits behind the CTA block as a dark texture.

export function Ecosystem() {
  return (
    <section
      id="ecosystem"
      className="bg-background border-t border-border"
      aria-labelledby="ecosystem-heading"
    >
      {/* CTA block — foreground panel with image behind */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/images/ecosystem-visual.png"
            alt=""
            fill
            className="object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 md:px-10 py-28 md:py-36">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground mb-10">
            Jami Studio
          </p>
          <h2
            id="ecosystem-heading"
            className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.92] tracking-tight balance text-foreground mb-10"
          >
            Build the next
            <br />
            generation of
            <br />
            <span className="text-rose">agent software.</span>
          </h2>
          <p className="text-[1.05rem] text-muted-foreground leading-relaxed max-w-xl mb-14">
            For solo developers, technical founders, and small teams building
            agent-enabled internal tools, workflow systems, and product
            surfaces.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="https://github.com/studio-jami"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-foreground text-background px-8 py-3.5 text-sm font-semibold tracking-wide hover:bg-primary hover:text-ink transition-colors"
            >
              View on GitHub
            </Link>
            <Link
              href="https://x.com/studio_jami"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border text-foreground px-8 py-3.5 text-sm font-medium hover:border-foreground/50 transition-colors"
            >
              Follow on X
            </Link>
            <Link
              href="https://www.linkedin.com/company/jami-studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border text-foreground px-8 py-3.5 text-sm font-medium hover:border-foreground/50 transition-colors"
            >
              LinkedIn
            </Link>
          </div>
        </div>
      </div>

      {/* Intercal — teal relief block */}
      {/* Intercal — uniform bg block */}
      <div className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-20">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground mb-12">
            Supporting ecosystem
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-end">
            <div>
              <h3 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[0.95] tracking-tight text-foreground balance mb-6">
                Intercal: knowledge delta
                <br />
                for current context.
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                Intercal supplements model training gaps with discovery and
                current context. It extends the Jami ecosystem without
                introducing technical dependencies to the core framework.
              </p>
            </div>
            <Link
              href="https://intercal.jami.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-foreground text-background px-8 py-3.5 text-sm font-semibold tracking-wide hover:bg-rose hover:text-ink transition-colors"
            >
              Visit Intercal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
