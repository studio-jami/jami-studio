# Main Promotion Lanes From Staging

## Position

This catalog describes the deliberate paths from `sync/staging` to Jami Studio
`main` after the 610fe16 upstream intake and its validation follow-up.

- Staging baseline: `c75f4774bbcc2ab00309e6b59716448722e3b513`
- Difference from `main`: 3,885 files across 281 commits
- Rule: a lane is a reviewable product outcome, not a directory-wide merge.

Staging is the integration laboratory. Nothing in this catalog authorizes a
wholesale staging-to-main merge.

## Promotion Order

1. **Core client loading and migration safety** — the smallest high-value
   framework reliability slice from upstream #2232.
2. **Reusable workspace surfaces and feature-flag substrate** — the shared
   foundation needed for the new Jami workspace shell without committing to a
   Builder-shaped product surface.
3. **Voice, video, mobile, and desktop reliability** — the media foundation
   for Jami's workspace-first live collaboration direction.
4. **One complete workspace surface at a time** — begin with the surface that
   best supports the active Jami shell and Hummingbird full-suite trajectory,
   then carry its proven patterns forward.

Every promotion must identify its exact staging files, retain Jami identity and
deployment ownership, run focused tests, and land as its own main PR.

## Framework And Runtime Lanes

| Lane | End-shape benefit | Main decision | Constraints / proof before promotion |
| --- | --- | --- | --- |
| Core client loading and migration safety | Faster, safer workspace startup and upgrades; users arrive in a working studio instead of a brittle loading state. | Port the narrow #2232 reliability slice first. | Additive migrations only; preserve Jami client APIs and identity overlays; Core build plus migration/client tests. |
| Agent execution, durable recovery, and A2A | Long-running work, delegated agents, and cross-app workflows resume reliably instead of losing context. | Adopt recovery behavior without inheriting Builder delivery or hosted-service assumptions. | Test run recovery, artifact scope, A2A continuation, and audit boundaries. |
| Integrations, OAuth, and remote MCP catalog | A polished connection layer for the tools a workspace actually uses. | Take provider-neutral behavior and verified catalog metadata; Jami owns public connection guides and copy. | Preserve Jami URLs, OAuth ownership, credential scoping, and SSRF/security protections. |
| Feature flags and rollout controls | New workspace and media capabilities can become available intentionally, with a clean path from preview to dependable default. | Adopt shared flag evaluation and operator controls; avoid flags that expose a Builder product surface. | Default-off for unfinished capability; name flags by Jami outcome; test rollout/rollback and stale-flag removal. |
| Toolkit, editors, and capability modules | Reusable, composable workspace surfaces rather than one-off app UI. | Bring Toolkit surfaces, editor migrations, Creative Context, Pinpoint, and Code Agents UI in separately where a Jami surface consumes them. | Keep module boundaries, SQL/action contracts, and Jami visual language; verify peer dependency/catalog alignment. |
| Registry, template catalog, package lifecycle, and CLI | Jami can curate its own installable suite and evolution path. | Treat this as Jami-owned infrastructure, not an upstream catalog overwrite. | Reconcile public allow-list, package names, docs, changesets, and CLI copy; no Builder publishing or release automation. |
| Observability, request telemetry, and audit signals | Operators can understand whether work completed, recovered, or needs attention. | Take runtime instrumentation; keep Jami's privacy, consent, and provider boundaries. | No customer payloads or credentials in telemetry; validate sampling, retention, and action-level audit scope. |

## Media, Device, And Collaboration Lanes

| Lane | End-shape benefit | Main decision | Constraints / proof before promotion |
| --- | --- | --- | --- |
| Voice and video foundation | Voice/video becomes a first-class workspace interaction rather than an add-on. | Promote the Core/desktop/mobile primitives that Jami's selected voice flows actually require. | Validate microphone/camera permissions, transcription boundaries, local-vs-hosted storage, and graceful device failure. |
| Mobile companion and remote push | A workspace can extend to a companion device for capture, notifications, and handoff. | Keep it as a Jami companion experience; do not inherit an upstream hosted-app funnel. | Verify device auth, push registration, remote-session ownership, and no background credential leakage. |
| Desktop capture and Clips reliability | Reliable screen/media capture, transcript work, and desktop handoff for a creative workspace. | Port the runtime fixes before broad Clips product copy. | Test camera/mic, recording reset/upload recovery, desktop packaging, and public-share access. |
| Real-time collaboration, sharing, review, and history | Teams can make decisions together with clear ownership, comments, versions, and recovery. | Promote common primitives before app-specific review UI. | Verify ownable-resource access, guest/share boundaries, presence, and optimistic-sync recovery. |

## Workspace Product-Surface Lanes

| Lane | End-shape benefit | Main decision | Constraints / proof before promotion |
| --- | --- | --- | --- |
| Shared workspace shell and navigation patterns | One coherent Jami Studio with focused panes, agent context, and workspace-first flow. | Main's shell roadmap is the source of truth; selectively reuse staging primitives only where they serve that plan. | Preserve current Jami sidebar/pane work; no upstream navigation or branding reversion; test application-state and route transitions. |
| Design Studio and full-app compatibility | A visual workspace that moves from prototype to a working app without losing review, motion, or design-system context. | Jami owns the experience. Builder/Fusion identifiers remain only behind the temporary runtime compatibility layer. | Keep feature flag default-off; retain Jami-facing copy and links; prove create/sync/deploy flows never expose unsafe provider assumptions. |
| Slides and creative-context workflow | Goverened creative context, dependable imports, and polished presentation work from a shared workspace. | Take reusable creative-context and media-search behavior; keep Jami-owned design-system workflow. | Validate import/export, deck sharing, provider credentials, and generated media attribution/storage. |
| Plan and visual decision workspace | Product decisions, visual plans, recaps, and code context stay actionable in the same studio. | Preserve Jami planning canon and visual-plan direction; port runtime/editor advances selectively. | Keep docs/plan ownership, artifact access control, and local-codebase permission boundaries. |
| Content workspace and database-backed files | Durable content operations with real data context instead of disconnected draft flows. | Take reliability and database improvements without reviving Builder review/publication ownership. | Confirm access checks, database creation/deadlock safety, and provider connection boundaries. |
| Analytics workspace | Useful product and session insight inside the Jami suite. | Port performance/replay improvements only after privacy and consent behavior is confirmed. | Validate replay retention/redaction, data-source access, and Jami analytics copy. |
| Clips workspace | Capture-to-edit-to-share media flow that complements voice/video collaboration. | Promote technical reliability before upstream marketing or desktop-release machinery. | Validate storage, desktop/browser permissions, public links, and transcript integrity. |
| Calendar and Mail workspaces | Human workflows can be coordinated from the studio through focused apps. | Keep provider integrations as scoped capabilities, not Builder account funnels. | Verify OAuth, scheduled jobs, organization ownership, and graceful no-credential states. |
| Forms, Tasks, Dispatch, Assets, Brain, Chat, and Macros | A composable suite of focused workspace tools that discover and work with each other. | Promote each app by a concrete user workflow, not as a bulk template catalog. | Preserve actions-first data access, app-state routing, accessibility, and Jami catalog curation. |

## Ownership, Documentation, And Delivery Lanes

| Lane | End-shape benefit | Main decision | Constraints / proof before promotion |
| --- | --- | --- | --- |
| Core docs content and localized documentation | Current, useful framework knowledge alongside Jami Studio. | Port functional documentation advances with matching locales; retain Jami terminology and domains. | Locales move with source meaning; treat untranslated/baseline debt as a dedicated normalization wave. |
| Public docs shell, marketing, legal, and SEO | A consistent Jami Studio public presence that describes the finished workspace users can have. | `main` owns this surface. Upstream docs chrome never wins by default. | Keep Jami header/footer, waitlist, domain, legal, screenshots, and SEO assets; selectively port only functional fixes. |
| Skills, instructions, plugins, and generated marketplace bundles | Agents and humans receive consistent, current operating guidance. | Update canonical skills and regenerate copies deliberately. | Run the Plan skill and marketplace sync reviews; do not silently overwrite Jami instruction decisions. |
| Deploy, CI, publishing, billing, and release automation | Reliable Jami delivery without upstream operational control returning through the back door. | Keep out of ordinary source-sync promotions. | Explicit owner decision, Jami credentials/domains, security review, and an isolated operational PR are required. |
| Source-sync operations and validation | Each upstream intake becomes more predictable, testable, and easier to curate. | Jami owns this lane entirely. | Preserve reports, policy, protected paths, focused tests, and Windows-safe validation; never let upstream delete it. |

## Deliberate Cleanup Lanes

These are staging health work, not feature promotions:

- raw-DB denylist reconciliation;
- generated Plan-skill and marketplace bundle synchronization;
- legacy planning archive exclusion or explicit guard treatment;
- localization catalog and localized-document baseline normalization;
- registry/dependency catalog review after each tooling wave.

Resolve the cleanup lane that applies to a proposed main promotion, rather than
turning any of them into a blanket staging rewrite.
