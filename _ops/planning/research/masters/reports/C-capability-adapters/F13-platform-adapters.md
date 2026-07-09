# F13 — Platform adapters (comms · observability · storage · media)

Status: AUTHORED 2026-06-02 · Domain: C · Capability adapters
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/00-orchestration/{plan,synthesis}.md` (Adapter seams register), `04-secrets`, email-sdk (`email-sdk.dev`)
Related: F03, F04, F16, F17 (brand comms)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

The remaining capability seams. **In:** email/comms, observability, storage, media-gen (+ future SMS/vector). **Out:** provider/inference (F11), billing (F12).

## 2. Committed decisions (from canon)

- **The seam test:** (a) commoditized API + (b) real portability value → a thin port we own; never double-abstract (our port is the seam, a multi-provider SDK is the impl behind it); cross-cutting needs (idempotency/audit) at our layer.
- **Email/transactional →** `@opencoredev/email-sdk` (MIT, zero-dep) — Resend primary + SES/Postmark fallback; idempotency at our port; **AgentMail (inbound/agent mailboxes) is a separate concern**.
- **Observability →** OpenTelemetry emit seam; Sentry + GA as exporters (highest-leverage adopt).
- **Storage →** thin S3-API port (S3 / R2 / Supabase Storage). **Media-gen →** port (Fal + peers).
- **Future:** SMS/push (same pattern as email), vector/embeddings (if RAG).

## 3. Architecture & mechanics

**The seam test (canon §2), applied uniformly.** A capability earns a thin **port we own** when **(a)** provider APIs are commoditized enough that a normalized shape covers ~90% **and (b)** portability/fallback carries real value. **Never double-abstract** — our port is the stable seam, a third-party multi-provider SDK is the *impl behind it*; cross-cutting needs (idempotency keys, audit) live at **our** port layer.

**Email / transactional → `@opencoredev/email-sdk`** (MIT, zero runtime deps). **Resend primary + SES/Postmark fallback**, behind our `email` port. **Send-only** seam; **idempotency at our port** (an idempotency key per send → dedupe). **Inbound / agent mailboxes (AgentMail) is a separate concern** — not this seam (F24 may consume it for triage). Port: `send(message, {idempotencyKey}) → receipt`.

**Observability → OpenTelemetry emit seam** (highest-leverage adopt — *the standard already is the adapter*). Code emits **OTel** spans/metrics/logs; **Sentry + GA are exporters** behind the OTel collector config — swap an exporter without touching emit sites. W3C Trace Context (F06) propagates across runs so a span chains to its governed action. Port: standard OTel API; the only owned piece is the exporter/collector config.

**Storage → thin S3-API port** (S3 / R2 / Supabase Storage — near-free portability). Port: `put/get/delete/signedUrl` over the S3 API; R2 (CF plane, F04) is the default impl, S3/Supabase swappable by config.

**Media-gen → media-gen port** (Fal + peers) — same agnostic logic as inference (F11): commoditized generate/transcode calls behind one port; provider-keyed registry; eval-driven default.

**Future (conditional, same pattern):** **SMS/push** (Twilio etc. — when multi-channel lands, same shape as email); **vector/embeddings** (pgvector / Pinecone — only if retrieval/RAG lands). **Database is already portable** (Postgres-wire + Drizzle, F07) — **no extra layer**; deliberately bounded.

**Adopt-at-build order:** **OTel first** (highest leverage, spans everything), then storage (near-free), then media-gen (when a media surface needs it). Email is already committed.

## 4. Remaining peripheral decisions to cement

- **Port interfaces (cemented):** `email.send` (idempotent, send-only), OTel-standard emit + owned exporter config, S3-API `put/get/delete/signedUrl`, media-gen provider-keyed port.
- **Adopt order (cemented):** OTel → storage → media-gen; email committed; SMS/vector conditional/future.
- Default impls (cemented directions): Resend (email), R2 (storage), Fal (media) — each swappable by config.

## 5. Dependencies & interfaces

- **F17 / F18 / F19 / F20 / F24** — outbound business/brand/funding/support comms run through the `email` port (Resend); the F09/brand projections never call a provider directly.
- **F06 (governance)** — OTel Trace Context chains spans to governed actions; the audit + observability are complementary.
- **F03 (secrets)** — every provider key resolves via the secrets adapter.
- **F04 (hosting)** — R2 storage lives on the CF plane; OTel collector deploys with the kitchen.
- **F05 (harness)** — these are the thin infra adapters the harness consumes.
- **F11 (media/inference)** — media-gen mirrors the inference port's agnostic logic.

## 6. Verification & closing criteria

- An email sends via Resend through the `email` port; a forced primary failure falls back to SES/Postmark; a duplicate send (same idempotency key) dedupes.
- OTel spans emit from a run and export to Sentry + GA via collector config; swapping an exporter touches no emit site; Trace Context chains a span to its governed action.
- A blob round-trips through the S3 port against R2, and against S3/Supabase by config change only.
- A media-gen call runs through the port against Fal, swappable by config.
- No port double-abstracts (our port + the vendor SDK as impl, not a second abstraction); idempotency/audit live at our layer.
- Database has **no** extra adapter layer beyond Postgres-wire + Drizzle (bounded-on-purpose).

## 7. Risks & verify-at-build (dated 2026-06-02)

- **`@opencoredev/email-sdk` is v0.5.0 (just published)** — adopt strictly behind our own `email` port so a swap is trivial if it stalls; pin the version.
- **OTel exporter/SDK churn** — pin the SDK + collector; keep exporters in config.
- **R2 / S3 / Supabase Storage** API parity is ~90%, not 100% — verify signed-URL + multipart behavior per impl at build.
- **Media/SMS/vector** are adopt-at-build/future — do not pre-build ahead of a consuming surface (zero-bloat).

## 8. Sources

- canon §2 Adapter seams register, synthesis §3 (adopt-at-build seams), `04-secrets`, email-sdk (`email-sdk.dev`).

## 7. Risks & verify-at-build (dated, 2026-06-02)

- email-sdk is v0.5.0 (just published) — adopt behind our own port so a swap is trivial.

## 8. Sources

- canon §2 Adapter seams register, `04`, email-sdk.dev.
