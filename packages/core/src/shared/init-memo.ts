/**
 * Workerd-safe memoization for module-scope init promises.
 *
 * Nearly every SQL-backed store memoizes its table-creation promise at module
 * scope (`let _initPromise`). On Cloudflare Workers (workerd) that pattern has
 * a lethal failure mode: workerd cancels a request's pending I/O the moment
 * its response returns, so an init promise CREATED during an early-responding
 * request (auth probe, 404) FREEZES forever — and every later caller that
 * awaits the memo hangs permanently. Proven live: `ensureObservabilityTables`
 * frozen by a `get-session`-first ordering wedged every agent chat run at
 * "Starting agent" on the unified Cloudflare runtime.
 *
 * `createInitMemo` keeps the single-flight memo semantics everywhere, and on
 * workerd adds two layers of defense:
 *   1. The init promise is tied to the creating request's lifetime via
 *      `__cf_ctx.waitUntil`, so workerd keeps its I/O alive to completion
 *      even when the response returns first (same remedy as the plugin-init
 *      freeze fix in framework-request-handler.ts).
 *   2. Awaits on a still-pending memo are bounded; on timeout the memo is
 *      re-run under the CURRENT (live) request. Init bodies are idempotent
 *      (CREATE TABLE IF NOT EXISTS / guarded ALTERs), so a re-run is safe.
 *
 * On Node the behavior is identical to the raw memo pattern (single flight,
 * failed init clears the memo so the next caller retries).
 */

import { isCloudflareRuntime } from "./runtime.js";

/** How long a pending memo may be awaited on workerd before it is presumed
 * frozen and re-run. Long enough for a slow cold init (Neon DDL over HTTP),
 * short enough that a frozen memo degrades to a slow call, not a hang. */
export const INIT_MEMO_FROZEN_RETRY_MS = 15_000;

const FROZEN = Symbol("init-memo-frozen");

export function createInitMemo(
  init: () => Promise<void>,
  options?: { frozenRetryMs?: number; label?: string },
): () => Promise<void> {
  const frozenRetryMs = options?.frozenRetryMs ?? INIT_MEMO_FROZEN_RETRY_MS;
  let promise: Promise<void> | undefined;
  let settled = false;

  const start = (): Promise<void> => {
    settled = false;
    const p = init().then(
      () => {
        settled = true;
      },
      (err) => {
        // Failed init must not be memoized — the next caller retries.
        promise = undefined;
        throw err;
      },
    );
    // Keep the init's I/O alive past the creating request's response on
    // workerd. The extra catch keeps waitUntil from surfacing the rejection
    // twice; callers still see it through the memoized promise.
    try {
      (
        globalThis as {
          __cf_ctx?: { waitUntil?: (p: Promise<unknown>) => void };
        }
      ).__cf_ctx?.waitUntil?.(p.catch(() => {}));
    } catch {
      /* not on Cloudflare — nothing to extend */
    }
    return p;
  };

  return async (): Promise<void> => {
    if (!promise) promise = start();
    if (settled || !isCloudflareRuntime()) return promise;

    // workerd + still pending: the memo may belong to a completed request
    // whose I/O was frozen. Bounded wait, then re-run under this request.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const raced = await Promise.race([
      promise,
      new Promise<typeof FROZEN>((resolve) => {
        timer = setTimeout(() => resolve(FROZEN), frozenRetryMs);
      }),
    ]).finally(() => {
      if (timer) clearTimeout(timer);
    });
    if (raced !== FROZEN) return;

    console.warn(
      `[agent-native] init memo${options?.label ? ` (${options.label})` : ""} still pending after ${frozenRetryMs}ms — presumed frozen by a completed request; re-running under the current request`,
    );
    promise = start();
    return promise;
  };
}
