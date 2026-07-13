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
    return [
      { source: "/docs", destination: `${DOCS_ORIGIN}/docs` },
      { source: "/docs/:path*", destination: `${DOCS_ORIGIN}/docs/:path*` },
      { source: "/assets/:path*", destination: `${DOCS_ORIGIN}/assets/:path*` },
    ]
  },
}

export default nextConfig
