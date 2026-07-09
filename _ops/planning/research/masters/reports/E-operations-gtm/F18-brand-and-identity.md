# F18 — Brand & identity

Status: AUTHORED 2026-06-02 · Domain: E · Operations & go-to-market · Stage: 0 (deep-ish)
Owner: Jamie (jamie@yrka.io) — one human, many agents.
Canons from: `../../research/14-operations/proposal.md` (§2.3), `09-brand-development`, `../../research/00-orchestration/plan.md` (§2 Naming)
Related: F17 (tokens live in the Canon), F19/F20 (consume tokens)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility
Codify the visual identity into tokens the Ops Canon serves out. **In:** identity tokens, asset library, voice/tone. **Out:** the actual creative marks (Jamie's call).

## 2. Committed decisions (from proposal + canon)
- Core **names already committed** (§2): jami · the Studio · jami.studio · yrka · `@jami-studio` · `studio-jami`. Stage-0 brand-basics = **codifying identity into `brand-tokens.json`** (logo paths, color tokens, type scale, handles), not naming.
- **Identity design in Figma** (vector, owned) → resolved tokens in the Canon; **Canva for downstream content only**, never the identity. AI logo accelerators OK only if output lands as owned vector + tokens.
- Every artifact (site, deck, README, bios) pulls the same tokens → **visual parity by construction** (§0 tokenized-design-system rule applied to brand).

## 3. Architecture & mechanics

**Stage-0 brand-basics is codifying identity into tokens, not naming.** Core names are already committed + owned (§2 Naming): **jami** (agent) · **the Studio** (UI env) · **jami.studio** (platform) · **yrka** (commercial) · npm `@jami-studio` · GitHub/socials `studio-jami`. So the Stage-0 job is to **resolve the visual identity into `brand-tokens.json`** (F17) that every surface serves out — applying §0's "tokenized design system, never three hardcoded colors" to brand.

**The identity/content split (verified 2026 best practice for a solo founder).** **Design the identity as owned vectors in Figma** (free tier sufficient) — the logomark + core marks; **Figma is the design-token source.** **Canva is for downstream content only** (social templates, one-off graphics), **never the identity.** AI logo accelerators (Design.com, Sologo, "Claude design" workflows) are acceptable for a first mark **only if the output lands as owned vector + tokens**, never a locked SaaS asset (§1 owned/agnostic).

**`brand-tokens.json` shape (resolved tokens, served by F17).**
```json
{
  "color":   { "accent": "...", "fg": "...", "bg": "...", "muted": "..." },
  "type":    { "sans": "...", "mono": "...", "scale": [ ... ] },
  "logo":    { "mark": "path/to/mark.svg", "wordmark": "...", "favicon": "..." },
  "radius":  "...", "spacing": [ ... ],
  "handles": { "github": "studio-jami", "x": "...", "npm": "@jami-studio" }
}
```
Tokens are **resolved values** (Figma → exported → committed), not a design file. They feed:
- **Astro Content Layer / CF Pages site** — CSS custom properties from `color`/`type`/`radius`/`spacing`; logo from `logo.*` (F19).
- **Marp deck** — the Marp theme is CSS; it reads the same token set so the deck matches the site (F20).
- **Mintlify docs** — theme config from the tokens.
- **`@jami-studio/ui`** — the *product* design system (F09) is its own tokenized vocabulary; the **brand** tokens here are the marketing/business-surface layer. They share discipline (both fully tokenized) and can share values where the brand bleeds into the product chrome, but F09 owns the product render seam; F18 owns the business-artifact identity.

**Visual parity by construction.** Every artifact (site, deck, README, social bios) pulls the same `brand-tokens.json` + `Company.social_handles` → no surface can drift visually or in handle.

## 4. Remaining peripheral decisions to cement
- **Token-serve mechanics (cemented):** Figma → resolved `brand-tokens.json` in F17 → consumed by Astro/Marp/Mintlify as CSS custom properties + asset paths; Canva downstream-content-only.
- **`> needs Jamie` (creative, §4-open):** the actual **logomark, palette, type choices** — squarely the founder's/brand-workstream's creative call; and final **suite/product names** (the naming sweep, F16). This report commits *that the tokens live in the Canon and serve out*, not what they are.

## 5. Dependencies & interfaces
- **F17 (Ops Canon)** — `brand-tokens.json` + `Company.social_handles` live here; F18 defines their shape + provenance.
- **F19 (marketing)** — the site consumes the tokens (CF Pages, F04).
- **F20 (funding)** — the Marp deck theme reads the tokens; the deck's visual theme is a `> needs Jamie` creative call (F20).
- **F09 (UI registry)** — the product design system; shares tokenization discipline, distinct render seam.
- **F16 (products)** — per-product brand surfaces; names open (`> needs Jamie`).

## 6. Verification & closing criteria
- A resolved `brand-tokens.json` (logo, palette, type, handles) exists per domain, mirroring the brand workstream.
- Every generated artifact (site, deck, README, social bios) pulls the same tokens — visual parity verified by changing one token and seeing it propagate on rebuild.
- Social handles are single-sourced (`studio-jami` etc.); no bio drifts.
- The identity is owned vector + tokens (no locked SaaS asset); Canva is confined to downstream content.

## 7. Risks & verify-at-build (dated 2026-06-02)
- **The logomark/palette/type are open creative calls (`> needs Jamie`)** — do not invent them; the token *machinery* ships, the values are Jamie's.
- **AI-logo-tool output must land as owned vector** — reject any SaaS-locked asset (§1).
- **Figma free-tier limits** — verify export/token-export workflow at build; the tokens (not the Figma file) are the source of truth.
- Keep the brand token layer (F18) distinct from the product render vocabulary (F09) so neither leaks assumptions into the other.

## 8. Sources
- proposal §2.3, synthesis §3 (Brand & funding), `09-brand-development`, canon §0 (tokenized design system) + §2 Naming + §4 (open creative).
