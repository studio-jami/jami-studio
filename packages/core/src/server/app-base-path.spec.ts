import { afterEach, describe, expect, it } from "vitest";

import { setModuleGraphEnvDefaults } from "../shared/global-scope.js";
import {
  getConfiguredAppBasePath,
  normalizeAppBasePath,
  withConfiguredAppBasePath,
} from "./app-base-path.js";

describe("server app base path helpers", () => {
  afterEach(() => {
    delete process.env.APP_BASE_PATH;
    delete process.env.VITE_APP_BASE_PATH;
    setModuleGraphEnvDefaults(null);
  });

  it("normalizes empty and slash-only base paths to no prefix", () => {
    expect(normalizeAppBasePath(undefined)).toBe("");
    expect(normalizeAppBasePath("/")).toBe("");
    expect(normalizeAppBasePath("///")).toBe("");
  });

  it("falls back to module-graph defaults on unified workerd deploys", () => {
    // No ambient env: unified worker delivers the base path per module graph.
    setModuleGraphEnvDefaults({ APP_BASE_PATH: "/analytics" });
    expect(getConfiguredAppBasePath()).toBe("/analytics");

    // Real env still wins over the baked default.
    process.env.APP_BASE_PATH = "/override";
    expect(getConfiguredAppBasePath()).toBe("/override");
  });

  it("adds the configured mount path to origin URLs", () => {
    process.env.APP_BASE_PATH = "/docs/";
    expect(withConfiguredAppBasePath("https://app.test")).toBe(
      "https://app.test/docs",
    );
    expect(withConfiguredAppBasePath("https://app.test/")).toBe(
      "https://app.test/docs",
    );
  });

  it("does not duplicate an already-mounted URL", () => {
    process.env.APP_BASE_PATH = "/docs";
    expect(withConfiguredAppBasePath("https://app.test/docs")).toBe(
      "https://app.test/docs",
    );
  });
});
