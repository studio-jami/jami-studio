import { Puzzle, Server, type LucideIcon } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

// ─── Stack ─────────────────────────────────────────────────
// Violet relief panel. Provider lanes as a horizontal ruled table.
// Brand icons via theSVG.org — fetched at render, invert-filtered for dark bg.
// "Custom" / "Self-hosted" aren't real providers, so they get a generic
// lucide icon instead of a brand logo (previously both reused the
// full-color illustrated placeholder mark through an invert+brightness
// filter meant for monochrome logos, which is what produced the garish
// green/black render).

const SVG = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

interface LaneItem {
  name: string;
  icon?: string;
  invert?: boolean;
  Icon?: LucideIcon;
}

interface Lane {
  label: string;
  items: LaneItem[];
  accent: string;
}

const LANES: Lane[] = [
  {
    label: "Models",
    accent: "text-rose",
    items: [
      { name: "OpenAI", icon: `${SVG}/openai/default.svg` },
      { name: "Anthropic", icon: `${SVG}/anthropic/default.svg` },
      { name: "Gemini", icon: `${SVG}/google/default.svg` },
      { name: "Mistral", icon: `${SVG}/mistral/default.svg` },
      { name: "Cohere", icon: `${SVG}/cohere/default.svg` },
      { name: "Local", icon: `${SVG}/ollama/default.svg` },
      {
        name: "ElevenLabs",
        icon: `${SVG}/elevenlabs/default.svg`,
        invert: true,
      },
      { name: "OpenRouter", icon: `${SVG}/openrouter/default.svg` },
      { name: "xAI", icon: `${SVG}/xai/default.svg`, invert: true },
      { name: "Groq", icon: `${SVG}/groq/default.svg` },
    ],
  },
  {
    label: "Databases",
    accent: "text-teal",
    items: [
      { name: "Postgres", icon: `${SVG}/postgresql/default.svg` },
      { name: "Neon", icon: `${SVG}/neon/default.svg` },
      { name: "SQLite", icon: `${SVG}/sqlite/default.svg` },
      { name: "PlanetScale", icon: `${SVG}/planetscale/default.svg` },
      { name: "Supabase", icon: `${SVG}/supabase/default.svg` },
      { name: "GCP", icon: `${SVG}/google-cloud/default.svg` },
      { name: "MongoDB", icon: `${SVG}/mongodb/default.svg` },
      { name: "Redis", icon: `${SVG}/redis/default.svg` },
      { name: "Upstash", icon: `${SVG}/upstash/default.svg` },
    ],
  },
  {
    label: "Storage / CDN",
    accent: "text-violet",
    items: [
      { name: "Cloudflare", icon: `${SVG}/cloudflare/default.svg` },
      { name: "Vercel", icon: `${SVG}/vercel/default.svg` },
      { name: "S3", icon: `${SVG}/aws/default.svg` },
      { name: "R2", icon: `${SVG}/cloudflare/default.svg` },
      { name: "GCP", icon: `${SVG}/google-cloud/default.svg` },
    ],
  },
  {
    label: "Deployment",
    accent: "text-teal",
    items: [
      { name: "Vercel", icon: `${SVG}/vercel/default.svg` },
      { name: "Fly", icon: `${SVG}/fly/default.svg` },
      { name: "Railway", icon: `${SVG}/railway/default.svg` },
      { name: "Netlify", icon: `${SVG}/netlify/default.svg` },
      { name: "Cloudflare", icon: `${SVG}/cloudflare/default.svg` },
      { name: "Self-hosted", Icon: Server },
    ],
  },
  {
    label: "Analytics",
    accent: "text-rose",
    items: [
      { name: "PostHog", icon: `${SVG}/posthog/default.svg` },
      { name: "Sentry", icon: `${SVG}/sentry/default.svg`, invert: true },
      { name: "Mixpanel", icon: `${SVG}/mixpanel/default.svg` },
      { name: "Databricks", icon: `${SVG}/databricks/default.svg` },
      {
        name: "OpenTelemetry",
        icon: `${SVG}/opentelemetry/default.svg`,
        invert: true,
      },
      { name: "Custom", Icon: Puzzle },
    ],
  },
  {
    label: "Search",
    accent: "text-amber",
    items: [
      { name: "Typesense", icon: `${SVG}/typesense/default.svg` },
      { name: "Meilisearch", icon: `${SVG}/meilisearch/default.svg` },
      { name: "Algolia", icon: `${SVG}/algolia/default.svg` },
      { name: "Elastic", icon: `${SVG}/elastic/default.svg` },
      { name: "Pinecone", icon: `${SVG}/pinecone/default.svg`, invert: true },
    ],
  },
];

export function Stack() {
  return (
    <section
      id="stack"
      className="bg-background border-t border-border"
      aria-labelledby="stack-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-24 md:py-32">
        {/* Header — description stacked directly under the headline so the
            two read as one unit, matching the registry/parity sections. */}
        <div className="mb-16 max-w-2xl">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground mb-8">
            Provider-agnostic by design
          </p>
          <h2
            id="stack-heading"
            className="font-serif text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[0.94] tracking-tight text-foreground balance mb-6"
          >
            Bring your
            <br />
            providers.
            <br />
            <span className="u-amber">Swap anything.</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md">
            Every layer is replaceable. Model, database, search, storage,
            analytics, and deployment: teams evolve their stack without touching
            application logic. No lock-in at any tier.
          </p>
        </div>

        {/* Provider table */}
        <div className="border-t border-l border-border">
          {LANES.map(({ label, accent, items }) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row border-b border-r border-border"
            >
              <div className="sm:w-36 shrink-0 px-5 py-4 border-b sm:border-b-0 sm:border-r border-border flex items-center">
                <p
                  className={`font-mono text-[0.62rem] uppercase tracking-widest ${accent}`}
                >
                  {label}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6 px-6 py-6">
                {items.map(({ name, icon, invert, Icon }) => (
                  <div
                    key={name}
                    className="flex flex-col items-center gap-2.5 w-16"
                  >
                    {icon ? (
                      <div className="h-9 w-9 flex items-center justify-center">
                        <Image
                          src={icon}
                          alt={name}
                          width={36}
                          height={36}
                          className={cn(
                            "opacity-80 object-contain w-auto h-auto max-w-full max-h-full",
                            invert &&
                              "invert brightness-200 light:invert-0 light:brightness-100",
                          )}
                          unoptimized
                        />
                      </div>
                    ) : Icon ? (
                      <div className="h-9 w-9 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground opacity-80" />
                      </div>
                    ) : (
                      <div className="h-9 w-9 flex items-center justify-center bg-muted/10 border border-border rounded opacity-60">
                        <span className="text-xs font-mono text-muted-foreground/40">
                          {name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-muted-foreground text-center leading-none tracking-wide">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 border border-border bg-card px-8 py-5 mt-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Run locally. Deploy anywhere. Evolve from one harness to a full
            workspace suite.
          </p>
          <a
            href="https://github.com/studio-jami"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            title="View on GitHub"
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-border hover:border-foreground/50 transition-colors"
          >
            <Image
              src={`${SVG}/github/default.svg`}
              alt=""
              width={18}
              height={18}
              className="invert light:invert-0 opacity-80"
              unoptimized
            />
          </a>
        </div>
      </div>
    </section>
  );
}
