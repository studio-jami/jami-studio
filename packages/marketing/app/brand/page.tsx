import type { Metadata } from "next";
import Image from "next/image";

import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Jami Studio brand assets",
  description:
    "Download official Jami Studio logos and symbols for articles, presentations, and community projects.",
  openGraph: {
    title: "Jami Studio brand assets",
    description: "Official Jami Studio marks, ready to download.",
  },
};

interface DownloadAsset {
  label: string;
  href: string;
  hint: string;
}

const ASSETS: DownloadAsset[] = [
  {
    label: "Logo — SVG",
    href: "/brand/jami-studio-logo.svg",
    hint: "Vector, scales to any size",
  },
  {
    label: "Logo — ICO",
    href: "/brand/jami-studio-logo.ico",
    hint: "Favicon / app icon",
  },
  {
    label: "Mark — PNG 512×512",
    href: "/brand/jami-studio-mark-512.png",
    hint: "Raster, transparent background",
  },
];

export default function BrandPage() {
  return (
    <>
      <Nav />
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground mb-6">
            Brand
          </p>
          <h1 className="font-serif text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[0.98] tracking-tight text-foreground mb-6">
            Jami Studio brand assets
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mb-14">
            Official marks for articles, talks, and community projects. Please
            don&apos;t alter the mark&apos;s proportions or colors, or imply
            endorsement of an unaffiliated product or service.
          </p>

          <div className="flex flex-col items-center justify-center gap-6 border border-border bg-card p-12 mb-14">
            <Image
              src="/brand/jami-studio-mark-512.png"
              alt="Jami Studio mark"
              width={128}
              height={128}
            />
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-3">
            {ASSETS.map((asset) => (
              <a
                key={asset.href}
                href={asset.href}
                download
                className="flex flex-col gap-1 bg-background p-6 transition-colors hover:bg-card"
              >
                <span className="text-sm font-semibold text-foreground">
                  {asset.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {asset.hint}
                </span>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
