import { afterEach, describe, expect, it, vi } from "vitest";

import {
  registerFileUploadProvider,
  listFileUploadProviders,
  unregisterFileUploadProvider,
} from "../file-upload/registry.js";
import type { FileUploadProvider } from "../file-upload/types.js";
import {
  __deleteScopedGlobal,
  getGlobalScopeId,
  getModuleGraphEnvDefault,
  getScopedGlobal,
  scopedGlobalKeyName,
  setGlobalScopeId,
  setModuleGraphEnvDefaults,
} from "./global-scope.js";

function makeProvider(id: string): FileUploadProvider {
  return {
    id,
    name: id,
    isConfigured: () => true,
    upload: async () => ({
      url: `https://cdn/${id}`,
      id: `${id}-1`,
      provider: id,
    }),
  };
}

afterEach(() => {
  // Clear any state each test scope created, then reset to unscoped.
  for (const scope of ["assets", "clips", null]) {
    setGlobalScopeId(scope);
    __deleteScopedGlobal("agent-native.test.value");
    for (const p of listFileUploadProviders()) {
      unregisterFileUploadProvider(p.id);
    }
  }
  setGlobalScopeId(null);
  setModuleGraphEnvDefaults(null);
});

describe("global-scope", () => {
  it("is unscoped by default and returns the base key name", () => {
    expect(getGlobalScopeId()).toBeNull();
    expect(scopedGlobalKeyName("agent-native.test.value")).toBe(
      "agent-native.test.value",
    );
  });

  it("namespaces the key when a scope id is set", () => {
    setGlobalScopeId("assets");
    expect(getGlobalScopeId()).toBe("assets");
    expect(scopedGlobalKeyName("agent-native.test.value")).toBe(
      "agent-native.test.value::app:assets",
    );
  });

  it("trims and rejects empty scope ids", () => {
    setGlobalScopeId("  ");
    expect(getGlobalScopeId()).toBeNull();
    setGlobalScopeId(" clips ");
    expect(getGlobalScopeId()).toBe("clips");
  });

  it("resolves distinct singletons per scope and stable ones within a scope", () => {
    setGlobalScopeId("assets");
    const a1 = getScopedGlobal("agent-native.test.value", () => ({ n: 1 }));
    const a2 = getScopedGlobal("agent-native.test.value", () => ({ n: 2 }));
    expect(a2).toBe(a1);

    setGlobalScopeId("clips");
    const b = getScopedGlobal("agent-native.test.value", () => ({ n: 3 }));
    expect(b).not.toBe(a1);
    expect(b.n).toBe(3);

    setGlobalScopeId(null);
    const unscoped = getScopedGlobal("agent-native.test.value", () => ({
      n: 4,
    }));
    expect(unscoped).not.toBe(a1);
    expect(unscoped).not.toBe(b);
  });

  it("keeps file-upload provider registries per app scope (issue 35)", () => {
    // Simulate the unified worker: the assets app's graph registers its
    // provider under scope "assets", clips under scope "clips". Neither
    // must see the other's provider.
    setGlobalScopeId("assets");
    registerFileUploadProvider(makeProvider("s3-assets"));
    expect(listFileUploadProviders().map((p) => p.id)).toEqual(["s3-assets"]);

    setGlobalScopeId("clips");
    registerFileUploadProvider(makeProvider("s3-clips"));
    expect(listFileUploadProviders().map((p) => p.id)).toEqual(["s3-clips"]);

    setGlobalScopeId("assets");
    expect(listFileUploadProviders().map((p) => p.id)).toEqual(["s3-assets"]);

    // Unscoped (dev / single-app) registries are independent of both.
    setGlobalScopeId(null);
    expect(listFileUploadProviders()).toEqual([]);
  });

  it("module-graph env defaults are per-graph state, not process.env", () => {
    expect(getModuleGraphEnvDefault("APP_BASE_PATH")).toBeUndefined();

    setModuleGraphEnvDefaults({
      APP_BASE_PATH: "/calendar",
      AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: '["/track"]',
    });
    expect(getModuleGraphEnvDefault("APP_BASE_PATH")).toBe("/calendar");
    expect(
      getModuleGraphEnvDefault("AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS"),
    ).toBe('["/track"]');
    // Never leaks into the shared process env.
    expect(process.env.APP_BASE_PATH).not.toBe("/calendar");

    // Cleared with null; empty objects are treated as cleared.
    setModuleGraphEnvDefaults(null);
    expect(getModuleGraphEnvDefault("APP_BASE_PATH")).toBeUndefined();
    setModuleGraphEnvDefaults({});
    expect(getModuleGraphEnvDefault("APP_BASE_PATH")).toBeUndefined();
  });

  it("consumes the unified-Node dispatcher handshake at module evaluation", async () => {
    // The dist/server.mjs dispatcher sets these globals immediately before
    // dynamically importing an app bundle; the bundle's copy of this module
    // consumes them at its own evaluation — before any registry module runs.
    const g = globalThis as unknown as Record<string, unknown>;
    g.__AGENT_NATIVE_MODULE_GRAPH_SCOPE__ = "mail";
    g.__AGENT_NATIVE_MODULE_GRAPH_ENV__ = {
      APP_BASE_PATH: "/mail",
      AGENT_NATIVE_WORKSPACE_APP_ID: "mail",
      EMPTY_VALUE_IGNORED: "",
      NON_STRING_IGNORED: 42,
    };
    try {
      // A fresh module instance simulates an app bundle's own copy of
      // global-scope evaluating under the handshake.
      vi.resetModules();
      const fresh = await import("./global-scope.js");
      expect(fresh.getGlobalScopeId()).toBe("mail");
      expect(fresh.getModuleGraphEnvDefault("APP_BASE_PATH")).toBe("/mail");
      expect(
        fresh.getModuleGraphEnvDefault("AGENT_NATIVE_WORKSPACE_APP_ID"),
      ).toBe("mail");
      expect(
        fresh.getModuleGraphEnvDefault("EMPTY_VALUE_IGNORED"),
      ).toBeUndefined();
      expect(
        fresh.getModuleGraphEnvDefault("NON_STRING_IGNORED"),
      ).toBeUndefined();
    } finally {
      delete g.__AGENT_NATIVE_MODULE_GRAPH_SCOPE__;
      delete g.__AGENT_NATIVE_MODULE_GRAPH_ENV__;
      vi.resetModules();
    }

    // This test file's own module instance stays unaffected (it evaluated
    // before the handshake globals were set).
    expect(getGlobalScopeId()).toBeNull();
  });
});
