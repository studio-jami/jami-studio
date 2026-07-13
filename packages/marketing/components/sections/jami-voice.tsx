'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Jami Voice ───────────────────────────────────────────────────
// Stays on the dark ink base — color lives in the left-border accent
// and the mode label only. Three modes swap via borderless tabs.

interface Mode {
  id:     string
  label:  string
  tag:    string
  body:   string
  accent: string
  border: string
}

const MODES: Mode[] = [
  {
    id:     'voice',
    label:  'Voice',
    tag:    'For flow',
    body:   'Talk to Jami while agents work in the background. Interrupt, approve, and redirect using natural speech, with no context switching or waiting.',
    accent: 'text-rose',
    border: 'border-l-rose',
  },
  {
    id:     'ui',
    label:  'Full UI',
    tag:    'For precision',
    body:   'Switch to app screens for detailed work. Every UI action routes through the same action surface as voice commands. Nothing is duplicated.',
    accent: 'text-teal',
    border: 'border-l-teal',
  },
  {
    id:     'avatar',
    label:  'Avatar',
    tag:    'For presence',
    body:   'Optional video or avatar for richer real-time collaboration while agents keep operating in the background.',
    accent: 'text-amber',
    border: 'border-l-amber',
  },
]

export function JamiVoice() {
  const [active, setActive] = useState('voice')
  const mode = MODES.find((m) => m.id === active) ?? MODES[0]

  return (
    <section id="jami" className="bg-background border-t border-border" aria-labelledby="jami-heading">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-24 md:py-32">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end mb-16">
          <h2
            id="jami-heading"
            className="font-serif text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[0.94] tracking-tight balance text-foreground"
          >
            Talk to{' '}
            <span className="text-rose">Jami.</span><br />
            Agents handle<br />
            the rest.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md lg:self-end">
            Jami is the real-time voice interface to your workspace.
            Voice, chat, user interface, and automation all route into the same
            underlying action system.
          </p>
        </div>

        {/* Tabs — flat, no radius */}
        <div className="flex border border-border" role="tablist" aria-label="Interaction modes">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={active === id}
              onClick={() => setActive(id)}
              className={cn(
                'flex-1 py-3.5 text-[0.8rem] font-semibold tracking-wide transition-colors border-r border-border last:border-r-0',
                active === id
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div
          className={cn('border border-t-0 border-border border-l-4 p-10 md:p-14 transition-all duration-150', mode.border)}
          role="tabpanel"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
            <div>
              <p className={cn('font-mono text-[0.62rem] uppercase tracking-[0.24em] mb-5', mode.accent)}>
                {mode.tag}
              </p>
              <p className="font-serif text-[clamp(2rem,4vw,3rem)] leading-none tracking-tight text-foreground mb-7">
                {mode.label}
              </p>
              <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                {mode.body}
              </p>
            </div>

            <blockquote className="bg-card border border-border p-8">
              <p className="font-mono text-[0.6rem] text-muted-foreground mb-5 uppercase tracking-widest">
                intercal.jami.studio
              </p>
              <p className="font-serif italic text-[1.3rem] leading-snug text-foreground mb-6">
                &ldquo;Voice-first when you want flow; full UI when you need precision.&rdquo;
              </p>
              <a
                href="https://intercal.jami.studio/"
                target="_blank"
                rel="noopener noreferrer"
                className={cn('font-mono text-[0.62rem] uppercase tracking-widest hover:underline', mode.accent)}
              >
                Explore Intercal &rarr;
              </a>
            </blockquote>
          </div>
        </div>

      </div>
    </section>
  )
}
