# Agentic Brand & Account Development — Design Brief

Date: 2026-06-01
Status: Committed direction (greenfield rebuild). Verified facts dated inline.
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Scope: How a solo operator builds and runs brand presence per org — at full production shape, agent-drivable, isolated per org — across the three lanes: jami.studio (OSS), yrka.io (commercial SaaS), jnh.org (personal).

---

## Executive Summary

Agentic brand and account development is built fresh as one system-layer capability: a hub-and-spoke brand plane that every org's lane plugs into, where agents call thin owned adapters and never hold raw platform credentials. The engineering is settled and unremarkable. The only genuinely binding constraint is platform automation policy and identity provisioning — the least stable layer in the rebuild, dated and re-verified at provisioning time.

Committed design — a three-part brand plane, owned at the system layer, configured per org:

1. Identity spine (per org): one domain + a comms adapter (branded outbound + agent inboxes) + a separate, isolated platform account set per org — dedicated browser profile, per-org credential vault entry (ws04), MFA, and non-linkable naming so the three lanes never correlate.
2. Content engine: a durable, versioned brand-voice primitive + brand templates -> agent drafts -> a deterministic review gate before anything publishes.
3. Distribution hub: one self-hosted Postiz instance as the single publish API across all connected channels, every channel OAuthed into Postiz so agents drive one contract and touch no platform keys.

Reach is open-protocol-first. Every lane anchors on the free, agent-native protocols — Bluesky (AT Protocol) and Mastodon (ActivityPub) — which have no gate, no app review, and no per-call fee. Gated mainstream platforms are entered selectively, per lane, on payoff: X (mandatory pay-per-use since Feb 2026, with a $0.20/URL-post penalty), Instagram (Meta App Review, weeks of lead time), LinkedIn (Community Management API — registered legal entity only). The entity gate lands exactly where the high-value funding audience lives, so yrka.io (the commercial org) owns the entity-gated surfaces; jami.studio and jnh.org stay open-protocol-first.

The brand plane's output — live per-lane sites, active profiles, a newsletter, demo/devlog content — is the first funding-wave evidence consumed by ws07 (brands & funding). This brief operationalizes ws07's lane map; it does not re-derive it.

---

## Questions Answered

1. How does a solo operator build and run brand presence per org (jami.studio / yrka.io / jnh.org) using agents, at full production shape?
2. How are accounts isolated per org across platforms, vendors, socials, and comms so the three lanes never cross-link?
3. Which platforms and vendors are agent-drivable in 2026, under what policy gates, at what cost?
4. What architecture lets agents operate brand presence without holding raw platform credentials and without violating automation policy?

---

## Architecture (committed)

A single system-layer brand plane, provisioned once and shared, configured per org — never rebuilt per project. It maps cleanly onto the dev/orgs/<domain>/ scaffold: each org's lane supplies its domain, accounts, brand config, and voice; the system layer supplies the hub, the adapters, and the review gate.

Two thin adapters behind the same primitive contract the rest of the rebuild uses:

- social adapter over Postiz (MCP / CLI / API). The open-protocol clients (atproto / Mastodon) sit behind this same contract, so a single protocol can be driven directly if Postiz coverage ever lags a feature — without changing the agent-facing seam.
- comms adapter — one seam over branded transactional/newsletter outbound and agent-owned interactive inboxes. The two jobs are different (branded deliverable outbound vs. an inbox an agent monitors for replies/DMs), so the adapter exposes both behind one contract and either provider is swappable. Resend and AgentMail are the current fills (see Vendors); the adapter, not the vendor, is load-bearing.

Credential isolation by construction. Platforms OAuth into Postiz; Postiz's own API key plus the comms/templating keys live in the ws04 per-org vault, selected per lane. Each org's brand account set gets a dedicated browser profile, its own MFA, and a non-shared recovery address (an agent inbox or lane alias) so no shared login or recovery email can correlate the three orgs. No raw platform token ever enters agent context — the agent calls the hub and the adapters, nothing lower.

Review-first publishing. Agents draft; a deterministic policy gate (and human approval where wanted) clears before anything goes live. The discipline is authored fresh as a system-layer primitive: queued drafts, suppression-aware sends, immutable published versions, publish/send blocked until approved. This is built greenfield — not lifted from any prior project, though the same operating principles apply.

Durable brand voice as a primitive. A versioned brand-voice definition (a skill/document, not per-post prompting) plus brand templates feeds every draft, so output stays consistent and agent-reproducible across all three lanes. The voice lives per org under dev/orgs/<domain>/docs/brand.

Deployment. One Postiz container at the system layer serves all lanes with per-lane channel connections — one concern, one owner. Comms and templating keys are org-scoped; the hub is system-scoped.

---

## Platform & Vendor Findings

All figures, gates, and behaviors below are drift-prone and verified 2026-05-31 / 2026-06-01 against official and primary sources. Platform automation policy is the least stable layer in the rebuild; re-verify each at provisioning time and treat every single platform as replaceable behind the adapter. Findings split into open-protocol (no gate, no fee) and gated mainstream (entity / review / pay-per-use).

### Open protocols — anchor every lane here

Bluesky / AT Protocol. No paid tier, no per-call fee, no app review. Auth is OAuth (App Passwords deprecated for new projects; acceptable only for scripting your own account). Rate limiting is points-based, roughly 1,666 record creations/hour per account — far above any human-paced brand cadence. The most agent-native mainstream-reach social surface in 2026: open, free, OAuth, self-hostable PDS if ever wanted. (Verified 2026-05-31 — docs.bsky.app.)

Mastodon / ActivityPub. Open protocol; token-based REST per instance, no central gate or fee. Mastodon's own client API is the practical integration target (ActivityPub C2S exists but is secondary). Smaller reach than X/IG (~low-millions MAU across the Fediverse) but zero policy friction and fully agent-drivable. CVE patching matters only if self-hosting an instance. (Verified 2026-05-31 — docs.joinmastodon.org.)

Both are first-class Postiz channels, so the hub drives them through one contract. Neither carries an incorporation requirement — usable on all three lanes from day one with no entity.

### Gated mainstream — enter selectively, per lane, on payoff

X (Twitter) API — mandatory pay-per-use. Since February 6, 2026, pay-per-use is the default and only model for new developers; the free tier is discontinued and new signups cannot get the legacy Basic/Pro tiers (those persist for existing subscribers only). Re-adjusted April 20, 2026: owned reads (your own posts/bookmarks/followers/lists) $0.001/resource; standard writes (text/media post without a URL) $0.015/request (up from $0.010); posts containing a URL: $0.20/request; reads $0.005, capped 2M reads/mo; credits purchased upfront in the Developer Console; enterprise from ~$42,000/mo. Implication: every link-out post costs $0.20 — the dominant cost for a brand that drives traffic to sites. Connect X but meter it, and lead link-distribution on the free protocols. (Verified 2026-06-01 — docs.x.com pricing; devcommunity.x.com pay-per-use announcement.)

Instagram — Meta Graph API + App Review. Requires an IG Business/Creator account linked to a Facebook Page, a Meta Developer App, the instagram_business_basic + instagram_business_content_publish scopes (old instagram_basic/instagram_content_publish names deprecated Jan 2025 — use current scopes), and Meta App Review for production beyond test users. Review runs ~1-4 weeks per submission round, each permission a separate submission with a screencast of the full flow; first-submission rejection is common. Rate limits ~200 calls/hour and 100 API-published posts/24h per account. No per-call fee. The review lead time is the real cost — start it early for whichever lane wants IG. (Verified 2026-06-01 — developers.facebook.com; current API ~v21.0.)

LinkedIn — Community Management API, entity-gated. Organic posting/management for a Page via the CMA is available only to legally registered entities (LLC, Corp, 501(c), etc.), not individual developers. Application requires a business email plus the organization's legal name, registered address, website, and privacy policy, an approved commercial use case, and LinkedIn review; apps start at Development (call-restricted) and apply separately for Standard (production). Without an entity you are limited to the much weaker Share product. ~100 posting calls/day/member. This is the pivotal gate: organic LinkedIn brand presence requires the incorporated commercial entity — which ws07 creates for yrka.io, exactly where the high-value funding audience lives. (Verified 2026-06-01 — learn.microsoft.com/linkedin, developer.linkedin.com.)

### Tooling & vendors — current fills behind the adapters

Postiz — the distribution hub. Open-source (AGPL-3.0), self-hostable via Docker with no feature gap vs. cloud (same API and MCP on both). 31+ channels (X, Instagram, Facebook, TikTok, Reddit, LinkedIn, Threads, Bluesky, Mastodon, Nostr, Warpcast/Farcaster, YouTube, Pinterest, Dribbble, Slack, Discord, Lemmy, Telegram, ...). Explicitly agentic: public API, native MCP server, and CLI built to be driven by Claude/Codex/etc. Channels connect via their own OAuth into Postiz, so agents never hold raw platform keys. AGPL-3.0 self-host is correct posture — full control, data on owned infra; the per-platform costs/gates above still apply underneath (Postiz is a control plane, not a bypass of X's meter or Meta/LinkedIn policy). AGPL obligations are irrelevant for private internal self-host. (Verified 2026-05-31 — github.com/gitroomhq/postiz-app, postiz.com.)

Resend — branded transactional/newsletter outbound (current comms outbound fill). Free tier: 3,000 emails/mo, 100/day cap, 1 verified domain. Pro $20-$35/mo removes the daily cap and lifts domain count (10+). SPF/DKIM/DMARC domain-auth model. One domain per lane -> one Resend team per org within free tier, or a single Pro account spanning all lanes. (Verified 2026-06-01 — resend.com/pricing.)

AgentMail — agent-native interactive inboxes (current comms inbox fill). Purpose-built inboxes for AI agents (create/send/receive/search via REST), email-as-identity model, real-time inbound via webhooks/websockets, native MCP server. Tier-based flat fee + inbox count: Free 3 inboxes / 3,000 emails/mo; $20/mo -> 10 inboxes; $200/mo -> 150 inboxes. Complements Resend (branded outbound) with agent-owned inboxes for replies/DMs/notifications and per-org recovery addresses. (Verified 2026-06-01 — agentmail.to/pricing.)

Canva Connect — programmatic templating (commercial-lane content scale). OAuth 2.0 (PKCE). The Autofill API (populate a brand template with text/image data -> async job -> poll) and Brand Templates API are the agent-relevant surfaces — both require Canva Enterprise, and the integration developer must be a member of a Canva Enterprise org. Only text/image fields autofill (not colors/fonts). Implication: programmatic templating is a paid-Enterprise capability, so it belongs to the commercial lane (yrka.io) where content volume justifies it; manual Canva + agent-assembled assets is the open path for the OSS and personal lanes. (Verified 2026-05-31 — canva.dev/docs/connect; Enterprise price not publicly listed — confirm at contract time.)

---

## Per-Lane Mapping (committed)

Per ws07, lane = org. The brand plane is identical; the channel set and entity-gated surfaces differ per lane:

- jami.studio (OSS). Open-protocol-first: Bluesky + Mastodon + Nostr/Warpcast (developer-native audiences) on day one, no entity, no review. X added only for a specific campaign, metered. Brand voice = the OSS/builder voice. No Canva Enterprise dependency.
- yrka.io (commercial SaaS). Owns the entity-gated surfaces: LinkedIn CMA (at incorporation), Instagram (start App Review early), X (connected, metered), plus the open protocols. Owns Canva Enterprise if/when content volume justifies it. This is the funding-audience lane.
- jnh.org (personal). Open-protocol-first, minimal surface — Bluesky/Mastodon, X only if a personal campaign warrants. No entity, no review, no Canva Enterprise.

Sequencing. Open-protocol presence (Bluesky/Mastodon) stands up immediately on every lane. IG App Review starts as soon as yrka.io has a Facebook Page; LinkedIn CMA application fires the moment the entity is registered (ws07); X is connected-but-metered. None of the gated surfaces is a launch dependency for any lane.

---

## Risks & Constraints

- Platform automation policy is the highest-risk layer. ToS, app-review criteria, and pricing drift quarterly. Every fact here is dated; re-verify at provisioning; keep every platform replaceable behind the adapter.
- X cost creep. $0.20/URL-post makes a traffic-driving cadence expensive; model spend, prefer URL-free posts ($0.015), lead link-distribution on the free protocols.
- IG review latency + rejection. Weeks per submission, screencast per permission, possible rejection — a schedule risk, not a cost risk. Start early; never make IG a launch dependency.
- LinkedIn entity gate. No entity -> no organic LinkedIn API presence (only the weak Share product). Couples yrka.io brand presence to ws07's incorporation timeline.
- Canva Enterprise gate. Programmatic autofill/brand-templates require paid Enterprise (price not public). The open path is manual Canva + agent-assembled assets for the non-commercial lanes.
- Cross-linking / identity leakage. Shared recovery emails, reused phone numbers, or one browser session across lanes can correlate the orgs. Mitigated by per-org browser profile + MFA + dedicated recovery + ws04 vault isolation — operational discipline that must hold every time.
- Verification gaps: Canva Enterprise pricing (not public); exact incorporation status/timeline (ws07); per-org vault mechanics (ws04 owns these); long-term automation-policy stability of any platform (inherently unknowable).

---

## Ownership & Handoffs

- This workstream owns the publish/comms hub, the two adapters, the review gate, the brand-voice primitive, and per-org account provisioning.
- ws07 owns lane/domain/entity mapping, incorporation, and funding; this brief's live output (sites, profiles, newsletter, demos) is ws07's first funding-wave evidence.
- ws04 owns the per-org credential vault that isolates each lane's keys/tokens.

---

## Open (creative / scope)

Per canon section 4, the only open items here are downstream of decisions Jamie hasn't made and genuinely creative/scope:

- Final per-lane brand names/handles and non-linkable naming scheme — a creative naming decision (canon section 4), assessed against strategy with ws07, not inherited from placeholders.
- Auth/identity coupling between brand accounts and the unified product identity plane — defers to the canon section 4 auth-topology decision; the brand plane consumes whatever identity shape that decision lands on.

Everything else (hub-and-spoke, open-protocol-first, per-org isolation, agents-never-hold-tokens, comms behind one adapter, Postiz self-hosted, X metered, IG/LinkedIn on the commercial lane) is committed.

---

## Sources

Official / external (all verified 2026-05-31 to 2026-06-01; drift-prone — re-verify at provisioning):

- Bluesky / AT Protocol — https://docs.bsky.app/docs/advanced-guides/atproto ; https://docs.bsky.app/blog/oauth-atproto
- Mastodon / ActivityPub — https://docs.joinmastodon.org/ ; https://docs.joinmastodon.org/spec/activitypub/
- X API pay-per-use pricing — https://docs.x.com/x-api/getting-started/pricing ; https://devcommunity.x.com/t/announcing-the-launch-of-x-api-pay-per-use-pricing/256476
- Instagram / Meta Graph API content publishing + App Review — https://developers.facebook.com/docs/instagram-platform/overview/ ; https://developers.facebook.com/docs/instagram-platform/content-publishing
- LinkedIn Community Management API (legal-entity gate) — https://developer.linkedin.com/product-catalog/marketing/community-management-api ; https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview
- Postiz (AGPL-3.0, MCP/CLI/API, channels) — https://github.com/gitroomhq/postiz-app ; https://postiz.com/
- Canva Connect APIs (Autofill / Brand Templates; Enterprise gate) — https://www.canva.dev/docs/connect/ ; https://www.canva.dev/docs/connect/autofill-guide/
- Resend pricing — https://resend.com/pricing
- AgentMail (inboxes for agents; MCP; pricing) — https://www.agentmail.to/ ; https://www.agentmail.to/pricing

Cross-references: ws07 (07-brands-funding — lane/domain/entity map, funding), ws04 (04-secrets — per-org vault), canon (00-orchestration/plan.md).
