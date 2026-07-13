/**
 * Per-module-graph global scope for globalThis-pinned framework registries.
 *
 * Why this exists: several framework registries (file-upload providers,
 * private-blob providers, shareable resources, event bus, notification
 * channels, tracking providers, secrets registry) pin their state on
 * `globalThis` so that multiple ESM graphs of ONE app (Vite dev + Nitro,
 * symlinked node_modules, dist/ vs src/) still share a single registry.
 *
 * On a unified workspace deployment (Cloudflare Pages `_worker.js` dispatcher
 * importing every app's worker into ONE isolate) that pinning goes too far:
 * each app's bundle keeps its own module graph — so module-scope state is
 * correctly per-app — but the `globalThis` pin collapses all apps' registries
 * into one shared map. Real-world failure: an upload POSTed to /assets was
 * served by the clips app's registered S3 provider (wrong object prefix).
 *
 * The fix: each app's generated worker entry calls `setGlobalScopeId(appId)`
 * from a scope-init module evaluated FIRST in the entry's import graph (ESM
 * evaluates imports depth-first in declaration order, so the scope is set
 * before any registry module initializes or registers built-ins). Registries
 * resolve their `globalThis` key LAZILY through `getScopedGlobal`, which
 * namespaces the key by the module graph's scope id. Result:
 *
 * - Unified worker: each app's core copy has its own scope id → per-app keys
 *   → per-app registries. Cross-app state sharing is gone.
 * - Dev / single-app deployments: `setGlobalScopeId` is never called → keys
 *   are unscoped → the original multi-graph dedupe behavior is preserved.
 *
 * This module must stay dependency-free: it is imported by the generated
 * scope-init module before anything else in the app bundle evaluates.
 */

let moduleGraphScopeId: string | null = null;

/**
 * Set the global-registry scope for THIS module graph (this app's bundle).
 * Called by the generated worker entry's scope-init module on unified
 * workspace deployments. Pass `null` to clear (tests).
 */
export function setGlobalScopeId(id: string | null): void {
  const trimmed = typeof id === "string" ? id.trim() : "";
  moduleGraphScopeId = trimmed ? trimmed : null;
}

/** The active scope id for this module graph, or `null` when unscoped. */
export function getGlobalScopeId(): string | null {
  return moduleGraphScopeId;
}

/**
 * The fully-qualified global key name for `base` under the active scope.
 * Unscoped graphs get `base` unchanged, so existing dev-mode behavior
 * (one registry across all of an app's ESM graphs) is preserved.
 */
export function scopedGlobalKeyName(base: string): string {
  return moduleGraphScopeId ? `${base}::app:${moduleGraphScopeId}` : base;
}

/**
 * Lazily resolve (and initialize once) a globalThis-pinned singleton under
 * the scope-aware key for `base`. Registries MUST call this per access —
 * never capture the result in module scope — so a scope id set during
 * entry-module evaluation is honored by every later registration and read.
 */
export function getScopedGlobal<T>(base: string, init: () => T): T {
  const key = Symbol.for(scopedGlobalKeyName(base));
  const g = globalThis as unknown as Record<symbol, T | undefined>;
  return (g[key] ??= init());
}

/** Test helper — delete the pinned singleton for `base` in the ACTIVE scope. */
export function __deleteScopedGlobal(base: string): void {
  const key = Symbol.for(scopedGlobalKeyName(base));
  delete (globalThis as unknown as Record<symbol, unknown>)[key];
}

/**
 * Per-module-graph env defaults for unified workspace deployments.
 *
 * workerd has no filesystem and no ambient build env, so per-app workspace
 * config (app id, base path, audience, public/protected route lists) must be
 * baked into the artifact. It CANNOT go through `process.env`: the unified
 * worker shares ONE `process.env` across every app's module graph, so the
 * first app's baked values would poison every sibling (the exact issue-35
 * class the scope id above exists for — observed live as every app stripping
 * paths against dispatch's base path, 401ing all framework routes).
 *
 * Instead the generated scope-init module stores this graph's per-app values
 * here (module scope = per app bundle), and env readers fall back to
 * `getModuleGraphEnvDefault` when the ambient env lacks the key. Real runtime
 * env still wins; dev/single-app graphs never set defaults, so behavior is
 * unchanged there.
 */
let moduleGraphEnvDefaults: Record<string, string> | null = null;

/** Set (or clear with `null`) this module graph's baked env defaults. */
export function setModuleGraphEnvDefaults(
  defaults: Record<string, string> | null,
): void {
  moduleGraphEnvDefaults =
    defaults && Object.keys(defaults).length > 0 ? { ...defaults } : null;
}

/** This module graph's baked default for `key`, or undefined. */
export function getModuleGraphEnvDefault(key: string): string | undefined {
  return moduleGraphEnvDefaults?.[key];
}

/**
 * Unified workspace Node handshake.
 *
 * On the unified Node deployment (`agent-native deploy --preset node`) the
 * generated dist/server.mjs dispatcher imports every app's Nitro bundle into
 * ONE process. Each bundle also carries a scope-init module, but Rolldown
 * chunk splitting can evaluate shared chunks (which register built-ins at
 * module scope) BEFORE the entry body where the inlined scope-init call
 * lands — so import order alone cannot guarantee the scope is set first.
 *
 * This module, however, is a dependency of every registry module, so it is
 * ALWAYS evaluated before any of them. The dispatcher sets these globals
 * immediately before dynamically importing an app bundle, and this module
 * consumes them at its own evaluation — guaranteeing the scope id and
 * per-app env defaults are live before the first registry initializes.
 * The bundle's own scope-init still runs later with identical values
 * (idempotent), covering direct imports without the dispatcher.
 */
const HANDSHAKE_SCOPE_KEY = "__AGENT_NATIVE_MODULE_GRAPH_SCOPE__";
const HANDSHAKE_ENV_KEY = "__AGENT_NATIVE_MODULE_GRAPH_ENV__";
{
  const g = globalThis as unknown as Record<string, unknown>;
  const pendingScope = g[HANDSHAKE_SCOPE_KEY];
  if (typeof pendingScope === "string" && pendingScope.trim()) {
    moduleGraphScopeId = pendingScope.trim();
  }
  const pendingEnv = g[HANDSHAKE_ENV_KEY];
  if (pendingEnv && typeof pendingEnv === "object") {
    const defaults: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      pendingEnv as Record<string, unknown>,
    )) {
      if (typeof value === "string" && value !== "") defaults[key] = value;
    }
    if (Object.keys(defaults).length > 0) moduleGraphEnvDefaults = defaults;
  }
}
