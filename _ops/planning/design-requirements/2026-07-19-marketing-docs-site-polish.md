# 2026-07-19 — Marketing + Docs Site Polish

Durable working checklist for the marketing (`packages/marketing`, Next.js,
`www.jami.studio`) and docs (`packages/docs`, React Router, serves `/docs` +
`/apps` + `/templates` + `/skills` + `/download` behind the marketing
rewrite) polish pass. Source request: chat, 2026-07-19. Status: **plan
presented, awaiting confirmation before any code changes.**

Surfaces in scope: marketing home (`/`), marketing sub-pages (`/brand`,
`/privacy`, `/terms`, `/signup`), docs (`/docs`), apps (`/apps`) — Header and
Footer are shared components for the docs+apps surfaces
(`packages/docs/app/components/{Header,Footer}.tsx`), so header/footer edits
there apply to both automatically.

## Open questions — resolved autonomously (user unavailable, 2026-07-19)

User was asked via structured questions; unavailable to respond in-session
("work autonomously and make good decisions"). Resolved as follows, taking
the recommended default on each, plus an original tagline:

- [x] Q1 — Tagline: **"One action surface. Built for people. Ready for
      agents."** (own copy, distinct from the Parity section's "Every button
      can be a tool" line further down the page; reuses the stat-strip term
      "One action surface" for vocabulary consistency).
- [x] Q2 — Drop "Stack" from the marketing nav too. Final nav = Jami / Apps /
      Docs only.
- [x] Q3 — Uncap the docs header too, so header and footer actually match.
- [x] Q4 — Convert docs Header "GitHub" nav link + docs Footer "GitHub ↗"
      text link to icon-only too, for global consistency.
- [x] Q5 — Delete marketing Footer's duplicate GitHub/X/LinkedIn text
      entries in the "Open Source"/"Connect" columns; keep the existing
      icon-only social row as the single source for those links.
- [x] Q6 — Generic lucide icon (no color/invert) for the "Custom" /
      "Self-hosted" Stack lane entries, not a PNG.

## A. Theme system — light mode + icon-only toggle (item 1)

- [ ] Add `.light` CSS variable overrides in `packages/marketing/app/globals.css`
      for every token under `:root` (background/foreground/card/popover/
      primary/secondary/muted/accent/destructive/border/input/ring/sidebar-*,
      rose/teal/violet/amber/cream/ink, panel-*). Dark stays the unclassed
      default.
- [ ] Add matching `.light` overrides in `packages/docs/app/global.css`
      (`--fg`, `--fg-secondary`, `--bg`, `--bg-secondary`, `--docs-border`,
      `--docs-accent`, `--docs-accent-light`, `--header-bg`, `--code-bg`,
      `--code-border`, `--table-header-bg`, `--sidebar-hover`, `--selection`,
      plus the shadcn HSL block).
- [ ] Marketing: theme controller (React state + `localStorage` key
      `jami-theme`, default `dark`), inline blocking init script in
      `app/layout.tsx` to avoid flash-of-wrong-theme.
- [ ] Docs: extend `THEME_INIT_SCRIPT` in `app/root.tsx` to read
      `localStorage` (`jami-theme`) instead of always forcing dark.
- [ ] Icon-only Sun/Moon toggle button in marketing `components/nav.tsx`
      (lucide-react `Sun`/`Moon`, already a dependency).
- [ ] Icon-only Sun/Moon toggle button in docs `app/components/Header.tsx`
      (desktop + mobile), reusing the existing unused i18n keys
      `theme.toggle` / `theme.light` / `theme.dark`.
- [ ] No new dependencies added (no `next-themes`).

## B. Uncap header/footer width (items 1 + 2)

- [ ] Marketing `components/nav.tsx`: drop `max-w-7xl` on the `<nav>` wrapper.
- [ ] Marketing `components/footer.tsx`: drop `max-w-7xl` on the content
      wrapper.
- [ ] Docs `app/components/Header.tsx`: drop `max-w-[1600px]` (pending Q3).
- [ ] Docs `app/components/Footer.tsx`: drop `max-w-[1440px]`.
- [ ] Body content sections (Hero/Stack/etc., `max-w-7xl`) are unaffected —
      only nav bar + footer bar go edge-to-edge.

## C. Marketing header nav items (item 3)

- [ ] Trim `NAV_LINKS` in `nav.tsx` to `Jami / Apps / Docs` (pending Q2).
- [ ] `Jami` → marketing home (`/`), not the `#jami` anchor.
- [ ] `Apps` → `/apps`, `Docs` → `/docs` (hard nav, unchanged mechanism).
- [ ] Restructure nav row as a 3-column grid (`1fr auto 1fr`) so the links
      are mathematically centered regardless of left/right group width.
- [ ] Docs `Header.tsx`: add the same 3 links (desktop + mobile), reusing the
      existing unused `header.templates` i18n key ("Apps") for the Apps
      label. Not true-centering docs' header (different right-hand toolbar
      layout — search/feedback/language/ask-assistant already dense there).

## D. Broken provider icon (item 4)

- [ ] `components/sections/stack.tsx`: stop routing "Custom" (Analytics
      lane) and "Self-hosted" (Deployment lane) through
      `/brand/jami-studio-logo.svg` + `invert brightness-200` (the source
      image is a full-color illustrated placeholder mark, not a monochrome
      icon — that's exactly what's producing the green/black render).
      Replace with a plain generic icon per row (pending Q6).

## E. Hero CTAs (item 5)

- [ ] Remove "View on GitHub" + "Open Intercal" buttons from `hero.tsx`.
- [ ] Remove the "Intercal" button from the header row (`nav.tsx`).
- [ ] Intercal stays as its own section in `ecosystem.tsx` (icon-only pass
      covered under item 9).

## F. New tagline (item 6)

- [ ] Replace Hero H1 copy (pending Q1).
- [ ] Confirm whether the new tagline should also propagate into
      `app/layout.tsx` metadata (title/description/OG/Twitter copy) — currently
      out of scope unless requested.

## G. Hero layout polish (item 7)

- [ ] Remove forced `min-h-screen` + `justify-between` full-viewport
      structure that pushes the stat strip down; tighten vertical rhythm so
      the 3-item strip is visible without scrolling on common viewports.
- [ ] Change headline+image row from `lg:items-end` to top-aligned so the
      image doesn't hang low relative to the headline.
- [ ] Remove hardcoded manual `<br />` line breaks in the H1; let it wrap
      naturally with `text-wrap: balance`.
- [ ] Done together with items 5 + 6 (same file, one pass).

## H. ElevenLabs section (item 8)

- [ ] `jami-voice.tsx`: rewrite the paragraph to drop "ElevenLabs Grant"
      language, lead with ElevenLabs quality instead.
- [ ] Replace the two "Grants"-branded external images (repeating banner
      background + video-placeholder image) with the plain ElevenLabs mark
      (reuse `elevenlabs/default.svg` from theSVG CDN, already used in
      `stack.tsx`) or drop the placeholder image outright.
- [ ] Leave "Powered by ElevenLabs" label inside the quote block as-is
      (already grant-free).

## I. Detached title/description cohesion (item 10)

- [ ] `stack.tsx` header block: fix `grid-cols-2 items-end` layout that
      strands the paragraph away from the headline.
- [ ] `jami-voice.tsx` header block: same fix, same underlying bug.

## J. Icon-only buttons (item 9)

- [ ] `stack.tsx` CTA strip "View on GitHub" → icon-only.
- [ ] `ecosystem.tsx` CTA block "View on GitHub" / "Follow on X" / "LinkedIn"
      → icon-only.
- [ ] Docs Header "GitHub" nav link → icon-only (pending Q4).
- [ ] Docs Footer "GitHub ↗" text link → icon-only (pending Q4).
- [ ] Marketing Footer duplicate GitHub/X/LinkedIn text links in "Open
      Source" / "Connect" columns → delete duplicates (pending Q5), keep the
      existing icon-only social row.
- [ ] Out of scope (contextual, not generic social CTAs): docs
      `templates.$slug.tsx` "Source" link, `download.tsx` "View all
      releases" link, docs Footer "npm ↗" link.

## Execution order (grouped by shared file, avoids re-touching files)

1. This checklist file.
2. Theme tokens + toggle wiring (marketing globals.css + layout.tsx, docs
   global.css + root.tsx).
3. Marketing `nav.tsx` (toggle, uncap, true-center, drop Intercal + trim
   links).
4. Marketing `footer.tsx` (uncap, GitHub/social cleanup).
5. Docs `Header.tsx` / `Footer.tsx` (toggle, uncap, add nav links,
   icon-only GitHub).
6. `hero.tsx` (remove CTAs, new tagline, layout polish).
7. `stack.tsx` (icon fix, header cohesion, icon-only CTA).
8. `jami-voice.tsx` (grant language, image swap, header cohesion).
9. `ecosystem.tsx` (icon-only CTAs).
10. Manual review pass — marketing home + `/apps` + `/docs`, light + dark —
    before sign-off.

## Verification plan

- [ ] Visual check (light + dark) on marketing `/`, `/brand`, `/privacy`,
      `/terms`, docs `/docs`, `/apps` — nav centering, header/footer width,
      toggle persistence across reload.
- [ ] Confirm no `next-themes` or other new runtime deps were added.
- [ ] Confirm Stack lane icons render cleanly in both themes (no invert
      artifacts).
