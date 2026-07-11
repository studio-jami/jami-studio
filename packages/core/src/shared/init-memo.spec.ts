import { afterEach, describe, expect, it, vi } from "vitest";

import { createInitMemo } from "./init-memo.js";

// The raw `let _initPromise` memo pattern wedges on workerd: an init promise
// created during an early-responding request freezes when that request's
// response returns, and every later awaiter hangs forever (proven live:
// ensureObservabilityTables wedging every agent chat run at "Starting
// agent"). These specs pin the helper's defenses.
describe("createInitMemo", () => {
  afterEach(() => {
    delete (globalThis as any).__cf_env;
    delete (globalThis as any).__cf_ctx;
    vi.useRealTimers();
  });

  it("runs the init once and memoizes success (Node behavior unchanged)", async () => {
    const init = vi.fn(async () => {});
    const ensure = createInitMemo(init);
    await Promise.all([ensure(), ensure(), ensure()]);
    await ensure();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("does not memoize a failed init — the next caller retries", async () => {
    let fail = true;
    const init = vi.fn(async () => {
      if (fail) throw new Error("boom");
    });
    const ensure = createInitMemo(init);
    await expect(ensure()).rejects.toThrow("boom");
    fail = false;
    await expect(ensure()).resolves.toBeUndefined();
    expect(init).toHaveBeenCalledTimes(2);
  });

  it("ties the init promise to the creating request's waitUntil on Cloudflare", async () => {
    (globalThis as any).__cf_env = {};
    const waitUntil = vi.fn();
    (globalThis as any).__cf_ctx = { waitUntil };
    const ensure = createInitMemo(async () => {});
    await ensure();
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });

  it("re-runs a presumed-frozen pending memo under the current request on Cloudflare", async () => {
    (globalThis as any).__cf_env = {};
    let calls = 0;
    const ensure = createInitMemo(
      () =>
        new Promise<void>((resolve) => {
          calls += 1;
          // First init NEVER settles (simulates a frozen promise); the
          // retry settles immediately.
          if (calls > 1) resolve();
        }),
      { frozenRetryMs: 20 },
    );
    await ensure();
    expect(calls).toBe(2);
  });

  it("fast-path returns immediately once settled on Cloudflare (no race per call)", async () => {
    (globalThis as any).__cf_env = {};
    const init = vi.fn(async () => {});
    const ensure = createInitMemo(init, { frozenRetryMs: 20 });
    await ensure();
    const start = Date.now();
    await ensure();
    expect(Date.now() - start).toBeLessThan(20);
    expect(init).toHaveBeenCalledTimes(1);
  });
});
