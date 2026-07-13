import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// ─── Fonts ────────────────────────────────────────────────────────
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

// ─── Metadata ─────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL('https://www.jami.studio'),
  title: 'Jami Studio: Just Another Machine Interface',
  description:
    'The provider-agnostic, agent-native framework for customizable workspaces where agents and interfaces share the same actions, state, and context.',
  keywords: ['agent framework', 'workspace', 'MCP', 'voice interface', 'JAMI', 'open source'],
  authors: [{ name: 'Jami Studio', url: 'https://github.com/studio-jami' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Jami Studio: Just Another Machine Interface',
    description: 'The provider-agnostic, agent-native framework for customizable workspaces.',
    url: 'https://www.jami.studio',
    siteName: 'Jami Studio',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jami Studio: Just Another Machine Interface',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jami Studio: Just Another Machine Interface',
    description: 'The provider-agnostic, agent-native framework for customizable workspaces.',
    images: ['/twitter-image.png'],
    creator: '@studio_jami',
  },
}

export const viewport: Viewport = {
  themeColor: '#201912',
}

// ─── Root Layout ──────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
