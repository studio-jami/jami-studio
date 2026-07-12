import fs from "fs";
import os from "os";
import path from "path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  computeWorkspaceAppBuildHash,
  isWorkspaceBuildCacheEnabled,
  workspaceAppBuildCacheHit,
  writeWorkspaceAppBuildStamp,
} from "./workspace-build-cache.js";

let tmpDir: string;
let previousCacheEnv: string | undefined;

function makeWorkspace(): { workspaceRoot: string; appDir: string } {
  const workspaceRoot = tmpDir;
  const appDir = path.join(workspaceRoot, "apps", "demo");
  fs.mkdirSync(path.join(appDir, "app"), { recursive: true });
  fs.writeFileSync(
    path.join(appDir, "package.json"),
    JSON.stringify({ name: "demo", dependencies: { shared: "workspace:*" } }),
  );
  fs.writeFileSync(path.join(appDir, "app", "root.tsx"), "export default 1;");
  fs.mkdirSync(path.join(workspaceRoot, "packages", "shared"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(workspaceRoot, "packages", "shared", "package.json"),
    JSON.stringify({ name: "shared" }),
  );
  fs.writeFileSync(
    path.join(workspaceRoot, "packages", "shared", "index.ts"),
    "export const x = 1;",
  );
  fs.writeFileSync(path.join(workspaceRoot, "pnpm-lock.yaml"), "lockfileV9");
  return { workspaceRoot, appDir };
}

function opts(workspaceRoot: string, appDir: string) {
  return {
    workspaceRoot,
    appDir,
    app: "demo",
    preset: "cloudflare_pages",
    buildEnv: { APP_BASE_PATH: "/demo" },
    builderVersion: "1.0.0",
  };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "an-build-cache-"));
  previousCacheEnv = process.env.AGENT_NATIVE_WORKSPACE_BUILD_CACHE;
  delete process.env.AGENT_NATIVE_WORKSPACE_BUILD_CACHE;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (previousCacheEnv === undefined) {
    delete process.env.AGENT_NATIVE_WORKSPACE_BUILD_CACHE;
  } else {
    process.env.AGENT_NATIVE_WORKSPACE_BUILD_CACHE = previousCacheEnv;
  }
});

describe("isWorkspaceBuildCacheEnabled", () => {
  it("defaults to enabled", () => {
    expect(isWorkspaceBuildCacheEnabled([])).toBe(true);
  });
  it("disables via --no-build-cache", () => {
    expect(isWorkspaceBuildCacheEnabled(["--no-build-cache"])).toBe(false);
  });
  it("disables via env", () => {
    process.env.AGENT_NATIVE_WORKSPACE_BUILD_CACHE = "0";
    expect(isWorkspaceBuildCacheEnabled([])).toBe(false);
  });
});

describe("workspace build cache", () => {
  it("is a miss without a stamp, a hit after stamping, and stays stable", () => {
    const { workspaceRoot, appDir } = makeWorkspace();
    const o = opts(workspaceRoot, appDir);
    const hash = computeWorkspaceAppBuildHash(o);
    expect(hash).toBeTruthy();
    expect(workspaceAppBuildCacheHit(o, hash)).toBe(false);

    // Simulate a successful build: output exists + stamp written.
    fs.mkdirSync(path.join(appDir, "dist"), { recursive: true });
    writeWorkspaceAppBuildStamp(o, hash);
    expect(workspaceAppBuildCacheHit(o, hash)).toBe(true);
    expect(computeWorkspaceAppBuildHash(o)).toBe(hash);
  });

  it("misses when app source changes", () => {
    const { workspaceRoot, appDir } = makeWorkspace();
    const o = opts(workspaceRoot, appDir);
    const hash = computeWorkspaceAppBuildHash(o);
    fs.mkdirSync(path.join(appDir, "dist"), { recursive: true });
    writeWorkspaceAppBuildStamp(o, hash);

    fs.writeFileSync(path.join(appDir, "app", "root.tsx"), "export default 2;");
    const next = computeWorkspaceAppBuildHash(o);
    expect(next).not.toBe(hash);
    expect(workspaceAppBuildCacheHit(o, next)).toBe(false);
  });

  it("misses when a workspace:* dep changes", () => {
    const { workspaceRoot, appDir } = makeWorkspace();
    const o = opts(workspaceRoot, appDir);
    const hash = computeWorkspaceAppBuildHash(o);
    fs.writeFileSync(
      path.join(workspaceRoot, "packages", "shared", "index.ts"),
      "export const x = 2;",
    );
    expect(computeWorkspaceAppBuildHash(o)).not.toBe(hash);
  });

  it("misses when the lockfile changes", () => {
    const { workspaceRoot, appDir } = makeWorkspace();
    const o = opts(workspaceRoot, appDir);
    const hash = computeWorkspaceAppBuildHash(o);
    fs.writeFileSync(path.join(workspaceRoot, "pnpm-lock.yaml"), "lockfileV10");
    expect(computeWorkspaceAppBuildHash(o)).not.toBe(hash);
  });

  it("misses when the invocation env or builder version changes", () => {
    const { workspaceRoot, appDir } = makeWorkspace();
    const o = opts(workspaceRoot, appDir);
    const hash = computeWorkspaceAppBuildHash(o);
    expect(
      computeWorkspaceAppBuildHash({
        ...o,
        buildEnv: { APP_BASE_PATH: "/other" },
      }),
    ).not.toBe(hash);
    expect(
      computeWorkspaceAppBuildHash({ ...o, builderVersion: "2.0.0" }),
    ).not.toBe(hash);
  });

  it("ignores build outputs and node_modules when hashing", () => {
    const { workspaceRoot, appDir } = makeWorkspace();
    const o = opts(workspaceRoot, appDir);
    const hash = computeWorkspaceAppBuildHash(o);
    fs.mkdirSync(path.join(appDir, "dist"), { recursive: true });
    fs.writeFileSync(path.join(appDir, "dist", "out.js"), "artifact");
    fs.mkdirSync(path.join(appDir, "node_modules", "dep"), { recursive: true });
    fs.writeFileSync(
      path.join(appDir, "node_modules", "dep", "index.js"),
      "dep",
    );
    expect(computeWorkspaceAppBuildHash(o)).toBe(hash);
  });

  it("misses when the stamp preset differs or output is missing", () => {
    const { workspaceRoot, appDir } = makeWorkspace();
    const o = opts(workspaceRoot, appDir);
    const hash = computeWorkspaceAppBuildHash(o);
    writeWorkspaceAppBuildStamp(o, hash);
    // Stamp exists but no dist/.output yet → miss.
    expect(workspaceAppBuildCacheHit(o, hash)).toBe(false);
    fs.mkdirSync(path.join(appDir, "dist"), { recursive: true });
    expect(workspaceAppBuildCacheHit(o, hash)).toBe(true);
    // Different preset → miss (netlify additionally requires functions).
    expect(
      workspaceAppBuildCacheHit({ ...o, preset: "netlify" }, hash),
    ).toBe(false);
  });
});
