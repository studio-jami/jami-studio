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
