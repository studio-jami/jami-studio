# F12 — Billing & payments

Status: AUTHORED 2026-06-02 · Domain: C · Capability adapters
Owner: Jamie (<jamie@yrka.io>) — one human, many agents.
Canons from: `../../research/00-orchestration/{plan,synthesis,activity-log}.md` (Adapter seams; MakerKit/billing research #4), `10-product-concepts`
Related: F07 (entitlements), F14 (the Kit), F16 (yrka)

> Operating Canon: `../../research/00-orchestration/plan.md` · System map: `../../research/00-orchestration/synthesis.md`

## 1. Scope & responsibility

Monetization plumbing. **In:** the billing adapter, provider strategies, webhook→entitlement sync, tax mode. **Out:** entitlement tables themselves (F07), pricing/packaging (F14/F16).

## 2. Committed decisions (from canon)

- **Single-active, swappable billing adapter** (Stripe direct / Stripe Managed-Payments / Paddle / Lemon Squeezy / Polar).
- **Two contracts:** imperative _strategy_ (checkout/portal/cancel/usage) + reactive _webhook handler_ with a **normalized event vocabulary**; lazy registry keyed by enum (env-select, unused SDKs never bundle).
- **Webhooks are the only writer** → one idempotent upsert into provider-neutral entitlement tables (F07).
- **Un-normalizable seam = MoR vs direct (tax):** a `taxMode` flag per provider. Ship single-active; multi/per-tenant later via the same registry.

## 3. Architecture & mechanics

**Single-active, swappable billing adapter** (grounded in the MakerKit audit + official provider docs — **clean-room**, no MakerKit code). Two contracts:

1. **Imperative *strategy* (the writer's command side):** `createCheckout`, `openPortal`, `cancel`, `reportUsage`. A **lazy registry keyed by enum** (`BILLING_PROVIDER` env-select) resolves the active strategy — **unused provider SDKs never bundle**. Providers: Stripe direct / Stripe Managed-Payments / Paddle / Lemon Squeezy / Polar.
2. **Reactive *webhook handler* (the only writer):** each provider's webhook normalizes into a **provider-neutral event vocabulary** (`subscription.activated`, `subscription.updated`, `subscription.canceled`, `payment.succeeded`, `payment.failed`, `usage.recorded`, …). **Webhooks are the only writer** into the F07 entitlement tables → **one idempotent upsert** keyed on the provider event id (replay-safe).

**The entitlement upsert.** A normalized event → one idempotent upsert into the F07 provider-neutral entitlement tables (`capability_grants` / `entitlement_keys`). The strategy side **never** writes entitlements directly — it triggers a provider action, the provider's webhook confirms, the handler upserts. This is the single-source-of-truth rule (F07): one writer, idempotent, provider-neutral.

**The un-normalizable seam = MoR vs direct (tax).** A **`taxMode` flag per provider**: **MoR** (Paddle / Lemon Squeezy / Polar / Stripe-Managed handle sales-tax/VAT as merchant-of-record) vs **direct** (Stripe + pluggable Stripe Tax). This is the one part that cannot be normalized — it's a legal/liability difference, so it's a configured strategy, not abstracted away. MoR offloads tax-compliance burden (F22).

**Checkout/portal UI.** The suite shells (F16) render checkout/portal via the active strategy's hosted surface (provider checkout + customer portal); the UI never touches provider SDKs directly — it calls the strategy.

**Ship single-active; multi/per-tenant later via the same registry.** One active provider now; per-tenant or multi-provider selection later flows through the same enum registry — no rearchitecture.

## 4. Remaining peripheral decisions to cement

- **Default provider — `> needs Jamie`** (creative/scope: this couples to pricing/packaging and MoR posture, F21/F22). Engineering posture: **MoR-leaning** (Paddle/LS/Polar/Stripe-Managed) so tax is offloaded for a solo founder — but the pick is Jamie's once pricing lands. The *adapter* is provider-agnostic regardless.
- **Adapter interface (cemented):** the strategy + webhook contracts above; lazy enum registry; webhooks-only-writer; idempotent neutral upsert.
- **Entitlement-sync contract (cemented):** normalized event → one idempotent upsert into F07; provider event id = idempotency key.
- **MoR vs direct per market (cemented mechanism):** `taxMode` flag per provider; ship single-active.

## 5. Dependencies & interfaces

- **F07 (data)** — webhooks are the only writer into the entitlement tables; idempotent neutral upsert.
- **F14 (the Kit)** — the billing adapter is a sellable, curated piece of the Kit (MakerKit proves it's feasible + sellable).
- **F16 (yrka)** — powers the suite/Kit monetization; checkout/portal in the suite shells.
- **F22 (legal)** — MoR offloads sales-tax/VAT; `taxMode` aligns with the entity/tax posture.
- **F21 (GTM)** — pricing/packaging surface (`icp.yaml`, F17) feeds the strategy's price ids.
- **F04 (provisioning)** — shares the hosted-vs-OSS switch (the provisioning seam) for managed billing.

## 6. Verification & closing criteria

- A provider swap is a `BILLING_PROVIDER` enum change; unused SDKs don't bundle (proven by bundle inspection).
- **Idempotent webhook replay test:** the same provider event delivered twice produces exactly one entitlement state change.
- Webhooks are the *only* writer into entitlement tables (no strategy-side direct write); access control enforces it.
- A checkout → webhook → entitlement-upsert round-trip grants access; a cancel webhook revokes it (F06 default-deny picks it up immediately).
- `taxMode` selects MoR vs direct correctly per provider; an MoR provider shows merchant-of-record handling tax.
- The whole adapter is **clean-room** — no MakerKit-derived code (verified against the F14/F22 clean-room boundary).

## 7. Risks & verify-at-build (dated 2026-06-02)

- **MoR/tax liability differs per provider** and **usage-billing addressing differs** — keep both provider-specific behind the strategy; re-verify each provider's webhook event schema + tax handling at integration time.
- **MakerKit is strict clean-room** — reference patterns only; the adopted shape is grounded in **official provider docs**, MakerKit merely confirming structure (F14/F22). Never copy files; never let a training pipeline read the MakerKit dir.
- **Provider webhook schemas drift** — version the normalizer per provider; pin SDK versions.
- **Stripe Managed-Payments / Polar** are newer surfaces — verify current capabilities at build before committing a default.

## 8. Sources

- canon §2 Adapter seams (billing) + MakerKit/billing research #4, synthesis §3 (billing adapter), `10-product-concepts`.

## 7. Risks & verify-at-build (dated, 2026-06-02)

- MoR/tax liability differs per provider; usage-billing addressing differs — keep provider-specific. **MakerKit clean-room only.**

## 8. Sources

- canon §2 register + MakerKit/billing research #4, `10`.
