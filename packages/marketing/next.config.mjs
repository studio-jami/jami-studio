/**
 * Docs are served on this host at /docs via rewrites to the docs deployment
 * (SEO/AI-SEO consolidation on jami.studio instead of a subdomain).
 * The docs app natively routes /docs/* and loads root-relative /assets/*.
 */
const DOCS_ORIGIN = "https://jami-studio-docs.vercel.app"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Unified host: marketing owns its own pages; every other path
    // (docs, apps, templates, skills, download, brand, privacy, terms,
    // locale variants, /assets, sitemap.xml, robots.txt, llms.txt,
    // /_agent-native/* incl. generated og images) falls through to the
    // docs deployment.
    return {
      fallback: [
        { source: "/:path*", destination: `${DOCS_ORIGIN}/:path*` },
      ],
    }
  },
}

export default nextConfig
