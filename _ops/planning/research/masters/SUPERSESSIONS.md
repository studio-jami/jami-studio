# Supersessions

Decisions in these audits/reports that later, on-the-ground work has
superseded. The audit corpus is a snapshot; check here before treating a
recommendation as binding.

## Docs platform: Mintlify → in-house (superseded 2026-07-17)

Every "Mintlify for OSS docs" statement across this corpus (F14, F15, F17,
F18, F19, audits 01/03/07/10/14, and peers) predates the marketing-site
split and the close examination of what `packages/docs` actually is.

Owner-ratified decision (2026-07-17): **keep docs in-house** on the custom
React Router docs app. The pages that made it feel bloated (apps/templates
catalog, download, brand, privacy, terms) were marketing pages that moved to
`packages/marketing`; what remains is pure docs with deep product-differentiating
integration a generic platform would regress, not replace:

- embedded live agent chat (`AgentSidebar`) — the framework dogfooding its
  own thesis on its own docs site;
- custom `docBlocks` rendering shared with the Plan app's visual-answer
  system;
- build-time MDX sync from `packages/core/docs/content` plus generated
  `llms.txt` / `llms-full.txt` / JSON-LD / sitemap / per-locale markdown.

Full reasoning: repo memory `docs-and-marketing-architecture.md` (agent
memory) and main commits 9d72344a9 / bd127fa77. Reopen Mintlify only if the
real pain becomes generic docs authoring/nav/search maintenance for
non-engineer contributors.

## Category term: "agent-native" → Jami (superseded 2026-07-17)

Every use of "agent-native" as the category/positioning term across docs,
marketing, and in-app surfaces is superseded. Owner-ratified canon:

- **Jami Studio** is the brand: the site, workspaces, apps, styles, skills,
  and (future) package names.
- **Jami — Just Another Machine Interface** is the tagline and personality:
  the user interface into the apps, the main interaction layer over the
  underlying technology. Also the agent's name. Spell out
  "Just another machine interface" once per page, then shorthand "Jami".
  Never "J.A.M.I." in running copy; the dotted "j.a.m.i." form is reserved
  for a possible hero treatment only.
- Brand direction: retro-futuristic rekindling — reimagining and rebuilding
  open-source primitives and tried-and-true frameworks under an expansive,
  future-ready layer that stays humble and down-to-earth; maximum
  portability and customization.
- Marketing emphasis moves from SQL/database internals to: interchangeable
  parts, domain-specialty workspaces, the interactive interruptible
  always-on agent (Jami), and complete customization / easy connections for
  business, design, coding, project management, research and beyond.
- "agent-native" and Builder.io must not appear on any doc, marketing, or
  in-app surface — including logos and metadata — EXCEPT the untouched
  system-level identifiers awaiting the npm rename initiative
  (`@agent-native/*` packages, `agent-native` CLI, `/_agent-native/*`
  routes, `agent-native.json`, `AGENT_NATIVE_*` env vars, and the download
  page's BuilderIO releases URL until studio-jami publishes releases).
- Docs and marketing copy describe the final end-shape of the product
  (all-in-one workspaces), not the current work-in-progress state.
  Hummingbird is the future demo/showcase space; do not reference it in
  public copy yet.
