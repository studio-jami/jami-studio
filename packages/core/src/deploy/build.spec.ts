import fs from "fs";
import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AGENT_CHAT_PROCESS_RUN_PATH } from "../agent/durable-background.js";
import {
  AGENT_NATIVE_SOCIAL_IMAGE_CACHE_BUSTER,
  AGENT_NATIVE_SOCIAL_IMAGE_PATH,
} from "../shared/social-meta.js";
import {
  addImmutableAssetRouteRulesForClientBuild,
  assertSingleTemplateNetlifyBuildOutput,
  bundleSharedYjsLibForWorkerOutput,
  bundleSharedYjsLibForNodeServerOutput,
  bundledAiSdkModulesEnvDefault,
  CLOUDFLARE_WORKER_ESBUILD_EXTERNALS,
  CLOUDFLARE_WORKER_NODE_BUILTIN_STUB_MODULES,
  CLOUDFLARE_WORKER_STUB_MODULES,
  copyDir,
  emitSingleTemplateNetlifyBackgroundFunction,
  esbuildSpawnCommand,
  findInstalledFfmpegStaticPackage,
  findInstalledResvgPackages,
  generateCloudflarePagesStaticShellFromManifest,
  generateProvidedPluginsNitroPluginSource,
  generateWorkerEntry,
  generateScopeInitSource,
  installedOptionalAiSdkModules,
  OPTIONAL_AI_SDK_MODULES,
  uninstalledOptionalAiSdkStubs,
  workspaceAppScopeIdFromBasePath,
  workspaceEnvDefaultsFromBuildEnv,
  workspaceAppModuleGraphEnvDefaultsFromBuildEnv,
  workspaceNodeMiddlewareEntry,
  stripServerDataFlagsFromClientManifest,
  getNodeBuiltinNames,
  isDurableBackgroundDeployEnabled,
  NITRO_RUNTIME_IGNORE_PATTERNS,
  nitroNoExternalsForPreset,
  resolveYjsEsmEntry,
  rewriteBareYjsImportsForServerlessOutput,
  runNitroBuildPipeline,
  sanitizeServerlessFunctionPackageManifest,
  shouldBundleFfmpegStaticForServerless,
  writeSingleTemplateNetlifyRedirects,
} from "./build.js";
import { IMMUTABLE_ASSET_CACHE_CONTROL } from "./immutable-assets.js";

const DEFAULT_SSR_CACHE_CONTROL = "public, max-age=0, must-revalidate";
const DEFAULT_SSR_CDN_CACHE_CONTROL =
  "public, s-maxage=600, stale-while-revalidate=604800, stale-if-error=3600";
const DEFAULT_SSR_NETLIFY_CDN_CACHE_CONTROL =
  "public, durable, s-maxage=600, stale-while-revalidate=604800, stale-if-error=3600";
const tempDirs: string[] = [];

describe("nitroNoExternalsForPreset", () => {
  it("bundles Yjs in Node/serverless output", () => {
    expect(nitroNoExternalsForPreset("netlify")).toEqual(["yjs"]);
    expect(nitroNoExternalsForPreset("vercel")).toEqual(["yjs"]);
    expect(nitroNoExternalsForPreset("aws-lambda")).toEqual(["yjs"]);
    expect(nitroNoExternalsForPreset("node-server")).toEqual(["yjs"]);
    expect(nitroNoExternalsForPreset("node-middleware")).toEqual(["yjs"]);
  });

  it("bundles every dependency for edge output", () => {
    expect(nitroNoExternalsForPreset("cloudflare-pages")).toBe(true);
    expect(nitroNoExternalsForPreset("deno-deploy")).toBe(true);
  });
});

// Unified workspace Node builds wrap Nitro's node-middleware entry so each
// app's bundle sets its per-app registry scope + module-graph env defaults
// BEFORE any registry module evaluates — the dispatcher imports every app
// into one process, so unscoped graphs would collide exactly like the
// unified Cloudflare worker case.
describe("workspaceNodeMiddlewareEntry", () => {
  const tmpOut = path.join(process.cwd(), ".deploy-tmp", "workspace-node");
  let previousWorkspace: string | undefined;
  let previousAppId: string | undefined;

  beforeEach(() => {
    previousWorkspace = process.env.AGENT_NATIVE_WORKSPACE;
    previousAppId = process.env.AGENT_NATIVE_WORKSPACE_APP_ID;
  });

  afterEach(() => {
    if (previousWorkspace === undefined) {
      delete process.env.AGENT_NATIVE_WORKSPACE;
    } else {
      process.env.AGENT_NATIVE_WORKSPACE = previousWorkspace;
    }
    if (previousAppId === undefined) {
      delete process.env.AGENT_NATIVE_WORKSPACE_APP_ID;
    } else {
      process.env.AGENT_NATIVE_WORKSPACE_APP_ID = previousAppId;
    }
    fs.rmSync(path.join(process.cwd(), ".deploy-tmp"), {
      recursive: true,
      force: true,
    });
  });

  it("returns null outside unified workspace node builds", () => {
    delete process.env.AGENT_NATIVE_WORKSPACE;
    expect(workspaceNodeMiddlewareEntry("node-middleware", "/mail")).toBeNull();

    process.env.AGENT_NATIVE_WORKSPACE = "1";
    expect(workspaceNodeMiddlewareEntry("node-server", "/mail")).toBeNull();
    expect(workspaceNodeMiddlewareEntry("netlify", "/mail")).toBeNull();
    expect(workspaceNodeMiddlewareEntry("node-middleware", "")).toBeNull();
  });

  it("writes a scope-init-first entry re-exporting Nitro's node-middleware runtime", () => {
    process.env.AGENT_NATIVE_WORKSPACE = "1";
    process.env.AGENT_NATIVE_WORKSPACE_APP_ID = "mail";

    const entry = workspaceNodeMiddlewareEntry("node-middleware", "/mail");
    expect(entry).toBe(path.join(tmpOut, "index.mjs"));

    const entrySource = fs.readFileSync(entry!, "utf-8");
    const [firstImport, secondStatement] = entrySource
      .split("\n")
      .filter((line) => line.startsWith("import") || line.startsWith("export"));
    expect(firstImport).toBe('import "./_scope-init.mjs";');
    expect(secondStatement).toContain("export * from");
    expect(secondStatement).toContain("node-middleware.mjs");
    expect(secondStatement).not.toContain("\\\\");

    const scopeInit = fs.readFileSync(
      path.join(tmpOut, "_scope-init.mjs"),
      "utf-8",
    );
    expect(scopeInit).toContain('setGlobalScopeId("mail")');
    // The bundled optional AI SDK marker must ride the module-graph env
    // defaults (per-app value) so the engine registry's install check can
    // trust the build-time decision inside the bundled artifact.
    expect(scopeInit).toContain("AGENT_NATIVE_BUNDLED_AI_SDK_MODULES");
    expect(scopeInit).toContain("setModuleGraphEnvDefaults");
  });
});

// The marker's value must be exactly the optional AI SDK packages that
// resolve from the app dir at build time (the complement of the stub set) —
// the bundler inlines those literal dynamic import() sites, so inside the
// artifact they are importable without any node_modules entry.
describe("bundledAiSdkModulesEnvDefault", () => {
  it("lists exactly the resolvable optional AI SDK packages", () => {
    const installed = installedOptionalAiSdkModules(process.cwd());
    // Core's own dev environment installs the full optional set — the
    // helper must agree with a direct require.resolve probe.
    const appRequire = createRequire(path.join(process.cwd(), "package.json"));
    for (const mod of installed) {
      expect(() => appRequire.resolve(mod)).not.toThrow();
    }
    const stubbed = Object.keys(uninstalledOptionalAiSdkStubs(process.cwd()));
    expect(new Set([...installed, ...stubbed])).toEqual(
      new Set(OPTIONAL_AI_SDK_MODULES),
    );
    expect(installed.filter((mod) => stubbed.includes(mod))).toEqual([]);

    const marker = bundledAiSdkModulesEnvDefault(process.cwd());
    if (installed.length === 0) {
      expect(marker).toEqual({});
    } else {
      expect(marker).toEqual({
        AGENT_NATIVE_BUNDLED_AI_SDK_MODULES: installed.join(","),
      });
    }
  });
});

function expectDefaultWorkerSsrCacheHeaders(response: Response) {
  expect(response.headers.get("cache-control")).toBe(DEFAULT_SSR_CACHE_CONTROL);
  expect(response.headers.get("cdn-cache-control")).toBe(
    DEFAULT_SSR_CDN_CACHE_CONTROL,
  );
  expect(response.headers.get("netlify-cdn-cache-control")).toBe(
    DEFAULT_SSR_NETLIFY_CDN_CACHE_CONTROL,
  );
}

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-worker-test-"));
  tempDirs.push(dir);
  return dir;
}

async function importGeneratedWorker(entrySource: string) {
  const dir = makeTempDir();
  const nodeModules = path.join(dir, "node_modules", "react-router");
  fs.mkdirSync(nodeModules, { recursive: true });
  fs.writeFileSync(
    path.join(nodeModules, "package.json"),
    JSON.stringify({ type: "module", main: "index.js" }),
  );
  fs.writeFileSync(
    path.join(nodeModules, "index.js"),
    `
export function createRequestHandler() {
  return async (request) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith(".data")) {
      if (url.pathname === "/custom.data") {
        return new Response('{"ok":true}', {
          headers: {
            "cache-control": "no-cache",
            "content-type": "application/json",
          },
        });
      }
      return new Response('["data"]', {
        headers: {
          "cache-control": url.pathname === "/private.data" ? "private, no-store" : "no-cache",
          "content-type": "text/x-script",
          "x-remix-response": "yes",
        },
      });
    }
    if (url.pathname === "/redirect") {
      return new Response(null, {
        status: 302,
        headers: { location: "/login", "content-type": "text/html" },
      });
    }
    if (url.pathname === "/private-html") {
      return new Response("<html></html>", {
        headers: {
          "cache-control": "private, no-store",
          "content-type": "text/html; charset=utf-8",
          "set-cookie": "viewer=private; Path=/",
          "vary": "Cookie, Accept-Encoding, Authorization",
        },
      });
    }
    if (url.pathname === "/request-headers") {
      return new Response(
        '<html><body>' + (request.headers.get("cookie") || "no-cookie") + ':' + (request.headers.get("authorization") || "no-auth") + '</body></html>',
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    return new Response(
      '<html><head></head><body><a href="/next">next</a><form action="/api/search"></form><style>.hero{background:url("/hero.png")}</style>' +
        request.method + ' ' + url.pathname + '</body></html>',
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  };
}
`,
  );
  fs.writeFileSync(path.join(dir, "server-build.js"), "export default {};\n");
  const entryPath = path.join(dir, "entry.mjs");
  fs.writeFileSync(entryPath, entrySource);
  return (await import(`${pathToFileURL(entryPath).href}?t=${Date.now()}`))
    .default;
}

// These tests dynamically import generated workers. Under the full workspace
// prep run, module startup shares CPU with many package suites and can exceed
// Vitest's generic 5s default even though the worker responds correctly. Keep
// a bounded suite-local allowance so local prep tests behavior, not scheduler
// contention; focused runs normally complete well below this limit.
describe("generateWorkerEntry", { timeout: 15_000 }, () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("pins generated React Router SSR to an anonymous request context", () => {
    const source = generateWorkerEntry([], []);

    expect(source).toContain(
      'import { runWithRequestContext } from "@agent-native/core/server/edge";',
    );
    expect(source).toContain(
      "const anonymousContext = { userEmail: undefined, orgId: undefined };",
    );
    expect(source).toContain(
      "runWithRequestContext(anonymousContext, () => rrHandler(request))",
    );
  });

  it("pre-marks generated plugin slots before running async plugins", () => {
    const dir = makeTempDir();
    const agentChatPlugin = path.join(
      dir,
      "server",
      "plugins",
      "agent-chat.ts",
    );
    const coreRoutesPlugin = path.join(
      dir,
      "server",
      "plugins",
      "core-routes.ts",
    );
    const source = generateWorkerEntry(
      [],
      [agentChatPlugin, coreRoutesPlugin],
      ["resources"],
    );

    expect(source).toContain(
      'import { markDefaultPluginProvided as markGeneratedPluginProvided } from "@agent-native/core/server/edge";',
    );
    expect(source).toContain(
      'markGeneratedPluginProvided(nitroApp, "core-routes");',
    );
    expect(source).toContain(
      'markGeneratedPluginProvided(nitroApp, "terminal");',
    );
    expect(
      source.indexOf('markGeneratedPluginProvided(nitroApp, "agent-chat");'),
    ).toBeLessThan(source.indexOf("await plugin_0(nitroApp);"));
  });

  it("pre-marks slots before generated default plugin calls", () => {
    const source = generateWorkerEntry([], [], ["core-routes"]);

    expect(source).toContain(
      'import { defaultCoreRoutesPlugin as defaultPlugin_0 } from "@agent-native/core/server/edge";',
    );
    expect(source).toContain(
      'markGeneratedPluginProvided(nitroApp, "core-routes");',
    );
    expect(
      source.indexOf('markGeneratedPluginProvided(nitroApp, "core-routes");'),
    ).toBeLessThan(source.indexOf("await defaultPlugin_0(nitroApp);"));
  });

  it("emits the per-app scope-init module as the FIRST import when appScopeId is set", () => {
    const source = generateWorkerEntry([], [], [], [], null, [], "/assets", {
      appScopeId: "assets",
    });

    const scopeImportIndex = source.indexOf('import "./_scope-init.js";');
    expect(scopeImportIndex).toBeGreaterThan(-1);
    // Must be evaluated before every other import so globalThis-pinned
    // registries resolve per-app keys on unified workspace deployments.
    const firstOtherImport = source.indexOf("import {");
    expect(scopeImportIndex).toBeLessThan(firstOtherImport);

    // Unmounted (single-app) builds stay unscoped.
    const unscoped = generateWorkerEntry([], [], [], [], null, [], "", {});
    expect(unscoped).not.toContain("_scope-init.js");
  });

  it("emits mounted custom-route matchers so non-/api h3 routes strip the mount prefix", () => {
    const source = generateWorkerEntry(
      [
        { method: "post", route: "/track", absPath: "/x/track.post.ts" },
        {
          method: "get",
          route: "/status/:slug",
          absPath: "/x/status/[slug].get.ts",
        },
        {
          method: "post",
          route: "/api/analytics/track",
          absPath: "/x/api/analytics/track.post.ts",
        },
      ] as never,
      [],
      [],
      [],
      null,
      [],
      "/analytics",
      { appScopeId: "analytics" },
    );
    // Custom routes outside /api get matchers…
    expect(source).toContain('["POST", new RegExp("^/track$")]');
    expect(source).toContain('["GET", new RegExp("^/status/[^/]+$")]');
    // …while /api routes rely on the existing isApiPath strip.
    expect(source).not.toContain("api/analytics/track$");
    expect(source).toContain(
      "matchesMountedCustomRoute(request.method, strippedPathname)",
    );
  });

  it("generateScopeInitSource calls setGlobalScopeId with the app id via the lean subpath", () => {
    const source = generateScopeInitSource("clips");
    expect(source).toContain(
      'import { setGlobalScopeId } from "@agent-native/core/global-scope";',
    );
    expect(source).toContain('setGlobalScopeId("clips");');
    // No env-defaults block when none are provided.
    expect(source).not.toContain("Baked workspace-identical env defaults");
  });

  it("generateScopeInitSource bakes shared env defaults and per-app module-graph defaults separately", () => {
    const source = generateScopeInitSource(
      "calendar",
      {
        AGENT_NATIVE_WORKSPACE_APPS_JSON:
          '[{"id":"calendar","path":"/calendar"}]',
        EMPTY_IGNORED: "",
      },
      {
        AGENT_NATIVE_WORKSPACE_APP_ID: "calendar",
        APP_BASE_PATH: "/calendar",
        AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: '["/track"]',
      },
    );
    // Workspace-identical keys land as process.env defaults…
    expect(source).toContain("Baked workspace-identical env defaults");
    expect(source).toContain("AGENT_NATIVE_WORKSPACE_APPS_JSON");
    expect(source).toContain('\\"id\\":\\"calendar\\"');
    // …with only-if-absent semantics (runtime bindings win).
    expect(source).toContain("if (processRef.env[key] === undefined)");
    // Empty values must not be baked.
    expect(source).not.toContain("EMPTY_IGNORED");
    // Per-app keys go through the module graph, NEVER shared process.env —
    // the first app's env would poison every sibling in the unified isolate.
    expect(source).toContain("setModuleGraphEnvDefaults({");
    expect(source).toContain('"APP_BASE_PATH":"/calendar"');
    const envBlockStart = source.indexOf("Baked workspace-identical");
    const perAppAssignment = source.indexOf("setModuleGraphEnvDefaults(");
    expect(perAppAssignment).toBeGreaterThan(-1);
    expect(source.slice(envBlockStart)).not.toContain("APP_BASE_PATH");
    // setGlobalScopeId still runs first.
    expect(source.indexOf("setGlobalScopeId")).toBeLessThan(perAppAssignment);

    // No env blocks at all when nothing is provided.
    const bare = generateScopeInitSource("clips");
    expect(bare).not.toContain("setModuleGraphEnvDefaults");
    expect(bare).not.toContain("Baked workspace-identical");
  });

  it("workspaceEnvDefaultsFromBuildEnv snapshots only workspace-identical keys for workspace builds", () => {
    const workspaceEnv = {
      AGENT_NATIVE_WORKSPACE: "1",
      AGENT_NATIVE_WORKSPACE_APP_ID: "calendar",
      APP_BASE_PATH: "/calendar",
      AGENT_NATIVE_WORKSPACE_APPS_JSON: '[{"id":"calendar"}]',
      VITE_AGENT_NATIVE_WORKSPACE_APPS_JSON: '[{"id":"calendar"}]',
      UNRELATED_KEY: "nope",
      DATABASE_URL: "postgres://secret",
    } as NodeJS.ProcessEnv;
    const shared = workspaceEnvDefaultsFromBuildEnv(workspaceEnv);
    expect(shared.AGENT_NATIVE_WORKSPACE).toBe("1");
    expect(shared.AGENT_NATIVE_WORKSPACE_APPS_JSON).toBe('[{"id":"calendar"}]');
    // Per-app keys are excluded from the shared set…
    expect(shared).not.toHaveProperty("AGENT_NATIVE_WORKSPACE_APP_ID");
    expect(shared).not.toHaveProperty("APP_BASE_PATH");
    // …and non-workspace keys never leak (no secrets in the artifact).
    expect(shared).not.toHaveProperty("UNRELATED_KEY");
    expect(shared).not.toHaveProperty("DATABASE_URL");

    // Per-app snapshot picks up exactly the per-app keys.
    const perApp = workspaceAppModuleGraphEnvDefaultsFromBuildEnv(workspaceEnv);
    expect(perApp.AGENT_NATIVE_WORKSPACE_APP_ID).toBe("calendar");
    expect(perApp.APP_BASE_PATH).toBe("/calendar");
    expect(perApp).not.toHaveProperty("AGENT_NATIVE_WORKSPACE_APPS_JSON");
    expect(perApp).not.toHaveProperty("DATABASE_URL");

    // Standalone builds bake nothing.
    expect(
      workspaceEnvDefaultsFromBuildEnv({
        APP_BASE_PATH: "/calendar",
      } as NodeJS.ProcessEnv),
    ).toEqual({});
    expect(
      workspaceAppModuleGraphEnvDefaultsFromBuildEnv({
        APP_BASE_PATH: "/calendar",
      } as NodeJS.ProcessEnv),
    ).toEqual({});
  });

  it("workspaceAppScopeIdFromBasePath derives the app id from mounted base paths", () => {
    expect(workspaceAppScopeIdFromBasePath("/assets")).toBe("assets");
    expect(workspaceAppScopeIdFromBasePath("assets")).toBe("assets");
    expect(workspaceAppScopeIdFromBasePath("/assets/")).toBe("assets");
    expect(workspaceAppScopeIdFromBasePath("")).toBeNull();
    expect(workspaceAppScopeIdFromBasePath("/")).toBeNull();
    expect(workspaceAppScopeIdFromBasePath(undefined)).toBeNull();
  });

  it("strips mounted /api prefixes and removes bodies for HEAD on GET API routes", async () => {
    const dir = makeTempDir();
    const routePath = path.join(dir, "hello.get.mjs");
    fs.writeFileSync(
      routePath,
      `
export default (event) =>
  new Response("body:" + event.req.method + ":" + new URL(event.req.url).pathname, {
    headers: {
      "content-type": "text/plain",
      "x-route-method": event.req.method,
      "x-route-path": new URL(event.req.url).pathname,
    },
  });
`,
    );
    const worker = await importGeneratedWorker(
      generateWorkerEntry(
        [
          {
            method: "get",
            route: "/api/hello",
            filePath: "api/hello.get.ts",
            absPath: routePath,
          },
        ],
        [],
      ),
    );

    const getResponse = await worker.fetch(
      new Request("https://app.test/docs/api/hello", { method: "GET" }),
      { APP_BASE_PATH: "/docs" },
      {},
    );
    expect(await getResponse.text()).toBe("body:GET:/api/hello");
    expect(getResponse.headers.get("x-route-path")).toBe("/api/hello");

    const headResponse = await worker.fetch(
      new Request("https://app.test/docs/api/hello", { method: "HEAD" }),
      { APP_BASE_PATH: "/docs" },
      {},
    );
    expect(headResponse.status).toBe(200);
    expect(headResponse.headers.get("x-route-method")).toBe("GET");
    await expect(headResponse.text()).resolves.toBe("");
  });

  it("handles mounted /api index routes", async () => {
    const dir = makeTempDir();
    const routePath = path.join(dir, "index.get.mjs");
    fs.writeFileSync(
      routePath,
      `
export default (event) =>
  new Response(new URL(event.req.url).pathname, {
    headers: { "content-type": "text/plain" },
  });
`,
    );
    const worker = await importGeneratedWorker(
      generateWorkerEntry(
        [
          {
            method: "get",
            route: "/api",
            filePath: "api/index.get.ts",
            absPath: routePath,
          },
        ],
        [],
      ),
    );

    const response = await worker.fetch(
      new Request("https://app.test/docs/api?ping=1"),
      { APP_BASE_PATH: "/docs" },
      {},
    );

    await expect(response.text()).resolves.toBe("/api");
  });

  it("strips mounted SSR paths and rewrites root-relative HTML and redirects", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/docs/inbox", { method: "GET" }),
      { APP_BASE_PATH: "/docs" },
      {},
    );
    const html = await response.text();
    expect(html).toContain("GET /inbox");
    expect(html).toContain('href="/docs/next"');
    expect(html).toContain('action="/docs/api/search"');
    expect(html).toContain('url("/docs/hero.png")');
    expect(html).toContain(
      `<meta property="og:image" content="https://app.test/docs${AGENT_NATIVE_SOCIAL_IMAGE_PATH}?v=${AGENT_NATIVE_SOCIAL_IMAGE_CACHE_BUSTER}">`,
    );
    expectDefaultWorkerSsrCacheHeaders(response);
    expect(response.headers.get("speculation-rules")).toBe(
      '"/docs/_agent-native/speculation-rules.json"',
    );

    const redirect = await worker.fetch(
      new Request("https://app.test/docs/redirect", { method: "GET" }),
      { APP_BASE_PATH: "/docs" },
      {},
    );
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("location")).toBe("/docs/login");
  });

  it("hard-caches SSR HTML for authenticated Cloudflare worker requests just like anonymous ones", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    // An auth cookie must make no difference: the framework hard-caches SSR
    // HTML publicly for every visitor.
    const response = await worker.fetch(
      new Request("https://app.test/docs/inbox", {
        method: "GET",
        headers: { cookie: "an_session=1" },
      }),
      { APP_BASE_PATH: "/docs" },
      {},
    );

    expectDefaultWorkerSsrCacheHeaders(response);
  });

  it("overwrites explicit no-store on anonymous Cloudflare worker SSR", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/private-html"),
      {},
      {},
    );

    expectDefaultWorkerSsrCacheHeaders(response);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("vary")).toBe("Accept-Encoding");
  });

  it("strips credential headers before generated worker SSR", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/request-headers", {
        headers: {
          cookie: "an_session=active",
          authorization: "Bearer private-token",
        },
      }),
      {},
      {},
    );

    expect(await response.text()).toContain("no-cookie:no-auth");
    expectDefaultWorkerSsrCacheHeaders(response);
  });

  it("overwrites route-provided private Cache-Control on authenticated Cloudflare worker SSR HTML responses", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    // Route-level cache hints must not make the shared shell session-dependent
    // or send authenticated page loads back to origin.
    const response = await worker.fetch(
      new Request("https://app.test/private-html", {
        headers: { cookie: "an_session=active" },
      }),
      {},
      {},
    );

    expectDefaultWorkerSsrCacheHeaders(response);
  });

  it("hard-caches React Router data responses with the default no-cache policy", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/docs/inbox.data"),
      { APP_BASE_PATH: "/docs" },
      {},
    );

    expectDefaultWorkerSsrCacheHeaders(response);
  });

  it("hard-caches .data responses for authenticated Cloudflare worker requests", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/docs/inbox.data", {
        headers: { cookie: "an_session=active" },
      }),
      { APP_BASE_PATH: "/docs" },
      {},
    );

    expectDefaultWorkerSsrCacheHeaders(response);
  });

  it("overwrites route-provided private Cache-Control on authenticated Cloudflare worker data responses", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    // React Router page data follows the same public-shell invariant as HTML.
    const response = await worker.fetch(
      new Request("https://app.test/private.data", {
        headers: { cookie: "an_session=active" },
      }),
      {},
      {},
    );

    expectDefaultWorkerSsrCacheHeaders(response);
  });

  it("does not replace no-cache on non-React Router Cloudflare worker data responses", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/custom.data"),
      {},
      {},
    );

    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("cdn-cache-control")).toBeNull();
    expect(response.headers.get("netlify-cdn-cache-control")).toBeNull();
  });

  it("keeps public SSR cache headers for anonymous Cloudflare worker preference cookies", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/docs/inbox", {
        method: "GET",
        headers: { cookie: "sidebar:state=collapsed" },
      }),
      { APP_BASE_PATH: "/docs" },
      {},
    );

    expectDefaultWorkerSsrCacheHeaders(response);
  });

  it("adds immutable cache headers to Cloudflare Pages hashed assets only", async () => {
    const worker = await importGeneratedWorker(
      generateWorkerEntry([], [], [], [], null, [
        "/assets/entry.client-aB12_cdE.js",
      ]),
    );
    const env = {
      APP_BASE_PATH: "/docs",
      ASSETS: {
        fetch: async () =>
          new Response("asset", {
            headers: { "content-type": "application/javascript" },
          }),
      },
    };

    const hashed = await worker.fetch(
      new Request("https://app.test/docs/assets/entry.client-aB12_cdE.js"),
      env,
      {},
    );
    expect(await hashed.text()).toBe("asset");
    expect(hashed.headers.get("cache-control")).toBe(
      IMMUTABLE_ASSET_CACHE_CONTROL,
    );
    expect(hashed.headers.get("cdn-cache-control")).toBe(
      IMMUTABLE_ASSET_CACHE_CONTROL,
    );
    expect(hashed.headers.get("netlify-cdn-cache-control")).toBe(
      IMMUTABLE_ASSET_CACHE_CONTROL,
    );

    const unhashed = await worker.fetch(
      new Request("https://app.test/docs/assets/logo.png"),
      env,
      {},
    );
    expect(await unhashed.text()).toBe("asset");
    expect(unhashed.headers.get("cache-control")).toBeNull();
    expect(unhashed.headers.get("cdn-cache-control")).toBeNull();
    expect(unhashed.headers.get("netlify-cdn-cache-control")).toBeNull();

    const manuallyVersioned = await worker.fetch(
      new Request("https://app.test/docs/assets/logo-20240501.png"),
      env,
      {},
    );
    expect(await manuallyVersioned.text()).toBe("asset");
    expect(manuallyVersioned.headers.get("cache-control")).toBeNull();
    expect(manuallyVersioned.headers.get("cdn-cache-control")).toBeNull();
    expect(
      manuallyVersioned.headers.get("netlify-cdn-cache-control"),
    ).toBeNull();
  });

  it("uses the build-time app base path for mounted Cloudflare Pages hashed assets", async () => {
    const worker = await importGeneratedWorker(
      generateWorkerEntry(
        [],
        [],
        [],
        [],
        null,
        ["/assets/entry.client-aB12_cdE.js"],
        "/docs",
      ),
    );

    const response = await worker.fetch(
      new Request("https://app.test/docs/assets/entry.client-aB12_cdE.js"),
      {
        ASSETS: {
          fetch: async () =>
            new Response("asset", {
              headers: { "content-type": "application/javascript" },
            }),
        },
      },
      {},
    );

    expect(await response.text()).toBe("asset");
    expect(response.headers.get("cache-control")).toBe(
      IMMUTABLE_ASSET_CACHE_CONTROL,
    );
    expect(response.headers.get("cdn-cache-control")).toBe(
      IMMUTABLE_ASSET_CACHE_CONTROL,
    );
    expect(response.headers.get("netlify-cdn-cache-control")).toBe(
      IMMUTABLE_ASSET_CACHE_CONTROL,
    );
  });

  it("serves a static app shell without bundling React Router SSR", async () => {
    // Earlier tests in this file fetch with `{ APP_BASE_PATH: "/docs" }`,
    // which the generated entry copies into process.env permanently (mirrors
    // per-isolate env on workerd). Reset so this single-app-shaped test
    // isn't polluted by workspace base paths.
    delete process.env.APP_BASE_PATH;
    delete process.env.VITE_APP_BASE_PATH;
    const source = generateWorkerEntry([], [], [], [], null, [], "", {
      includeReactRouterSsr: false,
    });
    expect(source).not.toContain("react-router");
    expect(source).not.toContain("server-build");
    expect(source).toContain("fetchStaticAppShell");

    const worker = await importGeneratedWorker(source);
    const requestedPaths: string[] = [];
    const env = {
      ASSETS: {
        fetch: async (request: Request) => {
          requestedPaths.push(new URL(request.url).pathname);
          if (new URL(request.url).pathname === "/index.html") {
            return new Response(
              "<html><head></head><body>shell</body></html>",
              {
                headers: { "content-type": "text/html; charset=utf-8" },
              },
            );
          }
          return new Response("missing", { status: 404 });
        },
      },
    };

    const appRoute = await worker.fetch(
      new Request("https://app.test/ask"),
      env,
      {},
    );
    expect(appRoute.status).toBe(200);
    await expect(appRoute.text()).resolves.toContain("shell");
    expectDefaultWorkerSsrCacheHeaders(appRoute);
    expect(requestedPaths).toEqual(["/ask", "/index.html"]);

    const head = await worker.fetch(
      new Request("https://app.test/ask", { method: "HEAD" }),
      env,
      {},
    );
    expect(head.status).toBe(200);
    await expect(head.text()).resolves.toBe("");

    const missingApi = await worker.fetch(
      new Request("https://app.test/api/missing"),
      env,
      {},
    );
    expect(missingApi.status).toBe(404);
  });

  it("generates a manifest-based Cloudflare Pages static shell fallback", () => {
    const html = generateCloudflarePagesStaticShellFromManifest(
      {
        entry: {
          module: "/assets/entry.client-abc.js",
          imports: ["/assets/vendor-def.js"],
          css: ["/assets/entry.css"],
        },
        routes: {
          root: {
            id: "root",
            module: "/assets/root-ghi.js",
            imports: ["/assets/root-vendor-jkl.js"],
            css: ["/assets/root.css"],
            clientLoaderModule: "/assets/root-client-loader-mno.js",
          },
        },
        url: "/assets/manifest-123.js",
      },
      "/docs",
    );

    expect(html).toContain("window.__reactRouterContext");
    expect(html).toContain('"basename":"/docs"');
    expect(html).toContain('"isSpaMode":true');
    expect(html).toContain('import "/assets/manifest-123.js"');
    expect(html).toContain('import * as route0 from "/assets/root-ghi.js"');
    expect(html).toContain(
      'import * as route0_clientLoader from "/assets/root-client-loader-mno.js"',
    );
    expect(html).toContain('import("/assets/entry.client-abc.js")');
    expect(html).toContain('href="/assets/root.css"');
    expect(html).toContain("streamController.enqueue");
    expect(html).toContain("loaderData");
    expect(html).toContain('<html lang="en">');
    expect(html).not.toContain("en-US");
  });

  it("hydrates default root loader data in the manifest fallback", () => {
    const html = generateCloudflarePagesStaticShellFromManifest({
      entry: {
        module: "/assets/entry.client-abc.js",
      },
      routes: {
        root: {
          id: "root",
          module: "/assets/root-ghi.js",
          hasLoader: true,
        },
      },
      url: "/assets/manifest-123.js",
    });

    expect(html).toContain("loaderData");
    expect(html).toContain("root");
    expect(html).toContain("en-US");
    expect(html).toContain("system");
    expect(html).toContain("messages");
    // Root loaders hydrate the default locale shape; the shell <html> tag
    // must match so recovery doesn't add an attribute mismatch.
    expect(html).toContain('<html lang="en-US" dir="ltr" data-locale="en-US">');
  });

  it("strips server loader/action flags from the client manifest (handler-less static-shell worker)", () => {
    const dir = makeTempDir();
    const assetsDir = path.join(dir, "assets");
    fs.mkdirSync(assetsDir, { recursive: true });
    const manifest = {
      entry: { module: "/assets/entry.client-abc.js" },
      routes: {
        root: {
          id: "root",
          module: "/assets/root-ghi.js",
          hasLoader: true,
          clientLoaderModule: "/assets/root-client-loader.js",
        },
        "routes/overview": {
          id: "routes/overview",
          module: "/assets/overview-xyz.js",
          hasLoader: true,
          hasAction: true,
        },
        "routes/plain": {
          id: "routes/plain",
          module: "/assets/plain-xyz.js",
        },
      },
      url: "/assets/manifest-123.js",
    };
    const manifestPath = path.join(assetsDir, "manifest-123abc.js");
    fs.writeFileSync(
      manifestPath,
      `window.__reactRouterManifest=${JSON.stringify(manifest)};`,
    );

    stripServerDataFlagsFromClientManifest(dir);

    const rewritten = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(
      rewritten.match(/^window\.__reactRouterManifest=(.*);$/)![1],
    );
    expect(parsed.routes.root.hasLoader).toBe(false);
    expect(parsed.routes["routes/overview"].hasLoader).toBe(false);
    expect(parsed.routes["routes/overview"].hasAction).toBe(false);
    // Client-side data hooks stay intact.
    expect(parsed.routes.root.clientLoaderModule).toBe(
      "/assets/root-client-loader.js",
    );
    expect(parsed.routes["routes/plain"]).toEqual(
      manifest.routes["routes/plain"],
    );
    // Still a loadable script assigning the global.
    expect(rewritten.startsWith("window.__reactRouterManifest=")).toBe(true);
  });

  it("leaves a loader-free client manifest untouched", () => {
    const dir = makeTempDir();
    const assetsDir = path.join(dir, "assets");
    fs.mkdirSync(assetsDir, { recursive: true });
    const source = `window.__reactRouterManifest=${JSON.stringify({
      entry: { module: "/assets/entry.js" },
      routes: { root: { id: "root", module: "/assets/root.js" } },
      url: "/assets/manifest-1.js",
    })};`;
    const manifestPath = path.join(assetsDir, "manifest-1abc.js");
    fs.writeFileSync(manifestPath, source);

    stripServerDataFlagsFromClientManifest(dir);

    expect(fs.readFileSync(manifestPath, "utf8")).toBe(source);
  });

  it("injects runtime browser Sentry config into generated worker SSR HTML", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/inbox", { method: "GET" }),
      { SENTRY_DSN: "https://public@example/4511270423822336" },
      {},
    );
    const html = await response.text();

    expect(html).toContain("data-agent-native-sentry-config");
    expect(html).toContain("https://public@example/4511270423822336");
  });

  it("keeps mounted SSR HEAD responses bodyless and leaves missing API paths as 404", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const head = await worker.fetch(
      new Request("https://app.test/docs/inbox", { method: "HEAD" }),
      { APP_BASE_PATH: "/docs" },
      {},
    );
    expect(head.status).toBe(200);
    await expect(head.text()).resolves.toBe("");

    const missingApi = await worker.fetch(
      new Request("https://app.test/docs/api/missing", { method: "GET" }),
      { APP_BASE_PATH: "/docs" },
      {},
    );
    expect(missingApi.status).toBe(404);
  });

  it("strips mounted base path for auto-mounted action routes under /_agent-native/actions/", async () => {
    const dir = makeTempDir();
    const actionPath = path.join(dir, "ping-action.mjs");
    fs.writeFileSync(
      actionPath,
      `
export default {
  run: async (params) => ({ ok: true, echo: params }),
};
`,
    );
    const worker = await importGeneratedWorker(
      generateWorkerEntry(
        [],
        [],
        [],
        [{ name: "ping", absPath: actionPath, method: "post" }],
      ),
    );

    // With APP_BASE_PATH=/docs the client calls /docs/_agent-native/actions/ping.
    // Without the fix the request arrives at H3 with the prefix still attached,
    // misses the literal `/_agent-native/actions/ping` registration, and 404s.
    const mountedResponse = await worker.fetch(
      new Request("https://app.test/docs/_agent-native/actions/ping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hello: "world" }),
      }),
      { APP_BASE_PATH: "/docs" },
      {},
    );
    expect(mountedResponse.status).toBe(200);
    await expect(mountedResponse.json()).resolves.toEqual({
      ok: true,
      echo: { hello: "world" },
    });

    // No base path — original behavior still works.
    const unmountedResponse = await worker.fetch(
      new Request("https://app.test/_agent-native/actions/ping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hello: "again" }),
      }),
      {},
      {},
    );
    expect(unmountedResponse.status).toBe(200);
    await expect(unmountedResponse.json()).resolves.toEqual({
      ok: true,
      echo: { hello: "again" },
    });
  });

  it("allows browser action-client headers in generated worker preflight responses", async () => {
    const worker = await importGeneratedWorker(generateWorkerEntry([], []));

    const response = await worker.fetch(
      new Request("https://app.test/_agent-native/actions/ping", {
        method: "OPTIONS",
      }),
      {},
      {},
    );

    expect(response.status).toBe(204);
    const allowHeaders = response.headers.get("Access-Control-Allow-Headers");
    expect(allowHeaders).toContain("X-Agent-Native-Frontend");
    expect(allowHeaders).toContain("X-User-Timezone");
  });

  it("mounts an action under its custom http.path, not its name", async () => {
    const dir = makeTempDir();
    const actionPath = path.join(dir, "aliased-action.mjs");
    fs.writeFileSync(
      actionPath,
      `
export default {
  run: async (params) => ({ ok: true, echo: params }),
};
`,
    );
    const worker = await importGeneratedWorker(
      generateWorkerEntry(
        [],
        [],
        [],
        // Mirrors the runtime mount: route = `${PREFIX}/${http.path ?? name}`.
        [{ name: "aliased", absPath: actionPath, method: "post", path: "v2" }],
      ),
    );

    const aliased = await worker.fetch(
      new Request("https://app.test/_agent-native/actions/v2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hello: "world" }),
      }),
      {},
      {},
    );
    expect(aliased.status).toBe(200);
    await expect(aliased.json()).resolves.toEqual({
      ok: true,
      echo: { hello: "world" },
    });

    // The bare name is no longer a route when a custom path is set.
    const byName = await worker.fetch(
      new Request("https://app.test/_agent-native/actions/aliased", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hello: "world" }),
      }),
      {},
      {},
    );
    expect(byName.status).toBe(404);
  });
});

describe("CLOUDFLARE_WORKER_ESBUILD_EXTERNALS", () => {
  it("externalizes browser screenshot packages with native dependencies", () => {
    expect(CLOUDFLARE_WORKER_ESBUILD_EXTERNALS).toContain("playwright-core");
    expect(CLOUDFLARE_WORKER_ESBUILD_EXTERNALS).toContain("chromium-bidi/*");
    expect(CLOUDFLARE_WORKER_ESBUILD_EXTERNALS).toContain(
      "@sparticuz/chromium-min",
    );
    expect(CLOUDFLARE_WORKER_ESBUILD_EXTERNALS).toContain("fsevents");
  });

  it("stubs edge-incompatible optional packages before externalizing", () => {
    expect(CLOUDFLARE_WORKER_STUB_MODULES["@sentry/node"]).toContain("init");
    expect(CLOUDFLARE_WORKER_STUB_MODULES["@resvg/resvg-js"]).toContain(
      "Resvg",
    );
    expect(CLOUDFLARE_WORKER_STUB_MODULES["playwright-core"]).toContain(
      "chromium",
    );
    expect(CLOUDFLARE_WORKER_STUB_MODULES["playwright"]).toContain("chromium");
    expect(CLOUDFLARE_WORKER_STUB_MODULES["playwright/test"]).toContain(
      "chromium",
    );
    expect(CLOUDFLARE_WORKER_STUB_MODULES["detect-libc"]).toContain(
      "familySync",
    );
    // sharp loads its native binary at require time and kills the worker
    // at module init — the stub must be callable and throw at call time.
    expect(CLOUDFLARE_WORKER_STUB_MODULES["sharp"]).toContain("Proxy");
    expect(CLOUDFLARE_WORKER_STUB_MODULES["sharp"]).toContain(
      "sharp unavailable",
    );
  });

  it("bundles the real @anthropic-ai/sdk (never a stub) — the BYOK agent engine constructs it at runtime", () => {
    // The SDK is pure fetch-based JS that runs on workerd. An empty-class
    // stub made every agent chat run on the unified Cloudflare runtime die
    // with "Cannot read properties of undefined (reading 'stream')".
    expect(CLOUDFLARE_WORKER_STUB_MODULES["@anthropic-ai/sdk"]).toBeUndefined();
    expect(CLOUDFLARE_WORKER_ESBUILD_EXTERNALS).not.toContain(
      "@anthropic-ai/sdk",
    );
  });

  it("stubs node builtins that Cloudflare Pages rejects at upload time", () => {
    expect(CLOUDFLARE_WORKER_NODE_BUILTIN_STUB_MODULES.child_process).toContain(
      "execFileSync",
    );
    expect(CLOUDFLARE_WORKER_NODE_BUILTIN_STUB_MODULES.fs).toContain(
      "existsSync",
    );
    expect(
      CLOUDFLARE_WORKER_NODE_BUILTIN_STUB_MODULES["fs/promises"],
    ).toContain("mkdtemp");
    expect(CLOUDFLARE_WORKER_NODE_BUILTIN_STUB_MODULES.console).toContain(
      "globalThis.console",
    );
    expect(CLOUDFLARE_WORKER_NODE_BUILTIN_STUB_MODULES.net).toContain("isIP");
    expect(CLOUDFLARE_WORKER_NODE_BUILTIN_STUB_MODULES.module).toContain(
      "createRequire",
    );
  });

  it("exposes overridden members through the builtin stub default export", () => {
    // os.tmpdir() must return "/tmp" through BOTH the named export and the
    // default export — dependencies call it as `import os from "os"` and a
    // bare throwing proxy killed workers at module init.
    const osStub = CLOUDFLARE_WORKER_NODE_BUILTIN_STUB_MODULES.os;
    expect(osStub).toContain('export const tmpdir = () => "/tmp";');
    expect(osStub).toContain("const __members = {");
    expect(osStub).toMatch(/__members = \{[^}]*\btmpdir\b/);
    expect(osStub).toContain("prop in target ? target[prop]");
  });
});

describe("Nitro runtime scan ignores", () => {
  it("excludes test files from Nitro route, middleware, and plugin scanning", () => {
    expect(NITRO_RUNTIME_IGNORE_PATTERNS).toEqual(
      expect.arrayContaining([
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/*.spec.mjs",
        "**/*.test.cjs",
      ]),
    );
  });
});

describe("generateProvidedPluginsNitroPluginSource", () => {
  it("emits a Nitro plugin that pre-marks discovered app plugin slots", () => {
    const source = generateProvidedPluginsNitroPluginSource([
      "core-routes",
      "agent-chat",
      "core-routes",
    ]);

    expect(source).toContain(
      'import { markDefaultPluginProvided } from "@agent-native/core/server/edge";',
    );
    expect(source).toContain(
      'const pluginStems = ["agent-chat","core-routes"]',
    );
    expect(source).toContain("markDefaultPluginProvided(nitroApp, stem);");
  });
});

describe("Cloudflare deploy builtins", () => {
  it("externalizes node:sqlite references from optional runtime probes", () => {
    expect(getNodeBuiltinNames()).toContain("sqlite");
  });
});

describe("copyDir", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  it("copies directory symlink targets instead of treating symlinks as files", () => {
    const cwd = fs.mkdtempSync(path.join(process.cwd(), ".tmp-copy-dir-test-"));
    dirs.push(cwd);
    const src = path.join(cwd, "src");
    const dest = path.join(cwd, "dest");
    const linkedTarget = path.join(cwd, "linked-target");
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(linkedTarget, { recursive: true });
    fs.writeFileSync(path.join(linkedTarget, "asset.txt"), "asset");
    fs.symlinkSync(
      linkedTarget,
      path.join(src, "linked-dir"),
      process.platform === "win32" ? "junction" : "dir",
    );

    copyDir(src, dest);

    expect(
      fs.readFileSync(path.join(dest, "linked-dir", "asset.txt"), "utf8"),
    ).toBe("asset");
  });

  it("skips broken symlinks instead of crashing the copy", () => {
    const cwd = fs.mkdtempSync(path.join(process.cwd(), ".tmp-copy-dir-test-"));
    dirs.push(cwd);
    const src = path.join(cwd, "src");
    const dest = path.join(cwd, "dest");
    fs.mkdirSync(src, { recursive: true });
    fs.symlinkSync(path.join(cwd, "missing-target"), path.join(src, "broken"));

    expect(() => copyDir(src, dest)).not.toThrow();
    expect(fs.existsSync(path.join(dest, "broken"))).toBe(false);
  });
});

describe("findInstalledFfmpegStaticPackage", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function setupNodeModules() {
    const cwd = fs.mkdtempSync(path.join(process.cwd(), ".tmp-ffmpeg-test-"));
    dirs.push(cwd);
    const nodeModules = path.join(cwd, "node_modules");
    fs.mkdirSync(nodeModules, { recursive: true });
    return nodeModules;
  }

  it("finds a direct ffmpeg-static install only when the binary exists", () => {
    const nodeModules = setupNodeModules();
    const packageDir = path.join(nodeModules, "ffmpeg-static");
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, "package.json"), "{}");

    expect(findInstalledFfmpegStaticPackage([nodeModules])).toBeNull();

    fs.writeFileSync(path.join(packageDir, "ffmpeg"), "binary");

    expect(findInstalledFfmpegStaticPackage([nodeModules])).toBe(packageDir);
  });

  it("finds ffmpeg-static in pnpm's nested store layout", () => {
    const nodeModules = setupNodeModules();
    const packageDir = path.join(
      nodeModules,
      ".pnpm",
      "ffmpeg-static@5.3.0",
      "node_modules",
      "ffmpeg-static",
    );
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, "package.json"), "{}");
    fs.writeFileSync(path.join(packageDir, "ffmpeg"), "binary");

    expect(findInstalledFfmpegStaticPackage([nodeModules])).toBe(packageDir);
  });

  it("only bundles host ffmpeg-static binaries for matching Linux serverless targets", () => {
    expect(shouldBundleFfmpegStaticForServerless("linux", "x64", "x64")).toBe(
      true,
    );
    expect(
      shouldBundleFfmpegStaticForServerless("linux", "arm64", "arm64"),
    ).toBe(true);
    expect(shouldBundleFfmpegStaticForServerless("linux", "x64", "arm64")).toBe(
      false,
    );
    expect(shouldBundleFfmpegStaticForServerless("linux", "x64", null)).toBe(
      false,
    );
    expect(shouldBundleFfmpegStaticForServerless("darwin", "x64", "x64")).toBe(
      false,
    );
    expect(shouldBundleFfmpegStaticForServerless("win32", "x64", "x64")).toBe(
      false,
    );
  });
});

describe("sanitizeServerlessFunctionPackageManifest", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function setupFunctionDir() {
    const root = fs.mkdtempSync(
      path.join(process.cwd(), ".tmp-function-manifest-"),
    );
    dirs.push(root);
    const functionDir = path.join(root, "server");
    fs.mkdirSync(path.join(functionDir, "node_modules"), { recursive: true });
    fs.writeFileSync(
      path.join(functionDir, "package.json"),
      JSON.stringify(
        {
          name: "traced-node-modules",
          type: "module",
          dependencies: {
            "@libsql/linux-x64-gnu": "0.5.29",
            electron: "41.9.0",
            "node-pty": "1.1.0",
            "playwright-core": "1.61.1",
          },
          optionalDependencies: {
            fsevents: "2.3.2",
          },
        },
        null,
        2,
      ),
    );

    for (const packageName of ["electron", "node-pty", "playwright-core"]) {
      fs.mkdirSync(path.join(functionDir, "node_modules", packageName), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(functionDir, "node_modules", packageName, "package.json"),
        "{}",
      );
    }

    return functionDir;
  }

  it("removes desktop-only packages but keeps serverless runtime packages", () => {
    const functionDir = setupFunctionDir();

    sanitizeServerlessFunctionPackageManifest(functionDir);

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(functionDir, "package.json"), "utf8"),
    );
    expect(packageJson.dependencies).toEqual({
      "@libsql/linux-x64-gnu": "0.5.29",
      "playwright-core": "1.61.1",
    });
    expect(packageJson.optionalDependencies).toBeUndefined();
    expect(
      fs.existsSync(path.join(functionDir, "node_modules", "electron")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(functionDir, "node_modules", "node-pty")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(functionDir, "node_modules", "playwright-core")),
    ).toBe(true);
  });
});

describe("findInstalledResvgPackages", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function setupNodeModules() {
    const cwd = fs.mkdtempSync(path.join(process.cwd(), ".tmp-resvg-test-"));
    dirs.push(cwd);
    const nodeModules = path.join(cwd, "node_modules");
    fs.mkdirSync(nodeModules, { recursive: true });
    return nodeModules;
  }

  it("finds direct resvg packages", () => {
    const nodeModules = setupNodeModules();
    const packageDir = path.join(nodeModules, "@resvg", "resvg-js");
    const nativeDir = path.join(
      nodeModules,
      "@resvg",
      "resvg-js-linux-x64-gnu",
    );
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(nativeDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, "package.json"), "{}");
    fs.writeFileSync(path.join(nativeDir, "package.json"), "{}");

    expect(findInstalledResvgPackages([nodeModules])).toEqual([
      { packageName: "resvg-js", packageDir },
      { packageName: "resvg-js-linux-x64-gnu", packageDir: nativeDir },
    ]);
  });

  it("finds resvg packages in pnpm's nested store layout", () => {
    const nodeModules = setupNodeModules();
    const packageDir = path.join(
      nodeModules,
      ".pnpm",
      "@resvg+resvg-js@2.6.2",
      "node_modules",
      "@resvg",
      "resvg-js",
    );
    const nativeDir = path.join(
      nodeModules,
      ".pnpm",
      "@resvg+resvg-js-linux-x64-gnu@2.6.2",
      "node_modules",
      "@resvg",
      "resvg-js-linux-x64-gnu",
    );
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(nativeDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, "package.json"), "{}");
    fs.writeFileSync(path.join(nativeDir, "package.json"), "{}");

    expect(findInstalledResvgPackages([nodeModules])).toEqual([
      { packageName: "resvg-js", packageDir },
      { packageName: "resvg-js-linux-x64-gnu", packageDir: nativeDir },
    ]);
  });
});

describe("runNitroBuildPipeline", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function setupFixture() {
    const cwd = fs.mkdtempSync(
      path.join(process.cwd(), ".tmp-nitro-pipeline-"),
    );
    dirs.push(cwd);

    // Simulate a React Router client build with a hashed asset chunk.
    const clientDir = path.join(cwd, "build", "client");
    fs.mkdirSync(path.join(clientDir, "assets"), { recursive: true });
    fs.writeFileSync(
      path.join(clientDir, "assets", "entry.client-abc.js"),
      "console.log('rr-client')",
    );
    fs.writeFileSync(
      path.join(clientDir, "assets", "entry.client-aB12_cdE.js"),
      "console.log('hashed-client')",
    );
    fs.writeFileSync(path.join(clientDir, "assets", "logo.png"), "png");

    // Simulate the cleared publicDir Nitro would set up in `prepare`.
    const publicOutputDir = path.join(cwd, ".output", "public");
    fs.mkdirSync(publicOutputDir, { recursive: true });

    return { cwd, clientDir, publicOutputDir };
  }

  it("copies the React Router client build into publicDir before nitroBuild scans it", async () => {
    const { cwd, clientDir, publicOutputDir } = setupFixture();

    const calls: string[] = [];
    let routeRuleAtPrepare: unknown;
    let publicDirContentsAtNitroBuild: string[] = [];
    const nitro: any = {
      options: { output: { publicDir: publicOutputDir } },
    };

    await runNitroBuildPipeline({
      nitro,
      hooks: {
        prepare: async () => {
          calls.push("prepare");
          routeRuleAtPrepare =
            nitro.options.routeRules?.["/assets/entry.client-aB12_cdE.js"];
        },
        copyPublicAssets: async () => {
          calls.push("copyPublicAssets");
        },
        nitroBuild: async () => {
          calls.push("nitroBuild");
          // This is where Nitro globs publicDir to bake the static manifest
          // into the server bundle. Record what's visible at this point.
          publicDirContentsAtNitroBuild = fs.readdirSync(
            path.join(publicOutputDir, "assets"),
          );
        },
      },
      clientDir,
      publicOutputDir,
      appBasePath: "",
      cwd,
    });

    expect(calls).toEqual(["prepare", "copyPublicAssets", "nitroBuild"]);
    expect(routeRuleAtPrepare).toMatchObject({
      headers: { "cache-control": IMMUTABLE_ASSET_CACHE_CONTROL },
    });
    // The regression we're guarding against: if the client build is copied
    // *after* nitroBuild, the manifest is empty here and /assets/* 404s at
    // runtime even though the files exist on disk.
    expect(publicDirContentsAtNitroBuild).toContain("entry.client-abc.js");
  });

  it("mirrors client assets under the app base path when configured", async () => {
    const { cwd, clientDir, publicOutputDir } = setupFixture();

    await runNitroBuildPipeline({
      nitro: { options: { output: { publicDir: publicOutputDir } } },
      hooks: {
        prepare: async () => {},
        copyPublicAssets: async () => {},
        nitroBuild: async () => {},
      },
      clientDir,
      publicOutputDir,
      appBasePath: "/docs",
      cwd,
    });

    expect(
      fs.existsSync(
        path.join(publicOutputDir, "assets", "entry.client-abc.js"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(publicOutputDir, "docs", "assets", "entry.client-abc.js"),
      ),
    ).toBe(true);
  });

  it("adds exact immutable route rules for copied hashed client assets", async () => {
    const { cwd, clientDir, publicOutputDir } = setupFixture();
    const nitro: any = {
      options: { output: { publicDir: publicOutputDir } },
    };

    await runNitroBuildPipeline({
      nitro,
      hooks: {
        prepare: async () => {},
        copyPublicAssets: async () => {},
        nitroBuild: async () => {},
      },
      clientDir,
      publicOutputDir,
      appBasePath: "/docs",
      cwd,
    });

    expect(
      nitro.options.routeRules["/assets/entry.client-aB12_cdE.js"].headers[
        "cache-control"
      ],
    ).toBe(IMMUTABLE_ASSET_CACHE_CONTROL);
    expect(
      nitro.options.routeRules["/docs/assets/entry.client-aB12_cdE.js"].headers[
        "cdn-cache-control"
      ],
    ).toBe(IMMUTABLE_ASSET_CACHE_CONTROL);
    expect(
      nitro.options.routeRules["/docs/assets/entry.client-aB12_cdE.js"].headers[
        "netlify-cdn-cache-control"
      ],
    ).toBe(IMMUTABLE_ASSET_CACHE_CONTROL);
    expect(nitro.options.routeRules["/assets/logo.png"]).toBeUndefined();
    expect(
      nitro.options.routeRules["/assets/entry.client-abc.js"],
    ).toBeUndefined();
  });

  it("merges immutable headers into existing route rules", () => {
    const routeRules: Record<string, { headers?: Record<string, string> }> = {
      "/assets/entry.client-aB12_cdE.js": {
        headers: { "cross-origin-resource-policy": "cross-origin" },
      },
    };
    const { clientDir } = setupFixture();

    addImmutableAssetRouteRulesForClientBuild(routeRules, clientDir);

    expect(
      routeRules["/assets/entry.client-aB12_cdE.js"].headers,
    ).toMatchObject({
      "cross-origin-resource-policy": "cross-origin",
      "cache-control": IMMUTABLE_ASSET_CACHE_CONTROL,
      "cdn-cache-control": IMMUTABLE_ASSET_CACHE_CONTROL,
      "netlify-cdn-cache-control": IMMUTABLE_ASSET_CACHE_CONTROL,
    });
  });

  it("skips the client copy when the React Router build is absent", async () => {
    const cwd = fs.mkdtempSync(
      path.join(process.cwd(), ".tmp-nitro-pipeline-"),
    );
    dirs.push(cwd);
    const publicOutputDir = path.join(cwd, ".output", "public");
    fs.mkdirSync(publicOutputDir, { recursive: true });

    await expect(
      runNitroBuildPipeline({
        nitro: { options: { output: { publicDir: publicOutputDir } } },
        hooks: {
          prepare: async () => {},
          copyPublicAssets: async () => {},
          nitroBuild: async () => {},
        },
        clientDir: path.join(cwd, "build", "client"),
        publicOutputDir,
        appBasePath: "",
        cwd,
      }),
    ).resolves.toBeUndefined();
  });
});

describe("durable-background Netlify function emit (single-template, flag-gated)", () => {
  const dirs: string[] = [];
  let previousFlag: string | undefined;
  let previousWorkspaceFlag: string | undefined;
  let previousViteWorkspaceFlag: string | undefined;
  let previousAppBasePath: string | undefined;
  let previousViteAppBasePath: string | undefined;

  beforeEach(() => {
    previousFlag = process.env.AGENT_CHAT_DURABLE_BACKGROUND;
    previousWorkspaceFlag = process.env.AGENT_NATIVE_WORKSPACE;
    previousViteWorkspaceFlag = process.env.VITE_AGENT_NATIVE_WORKSPACE;
    previousAppBasePath = process.env.APP_BASE_PATH;
    previousViteAppBasePath = process.env.VITE_APP_BASE_PATH;
    delete process.env.AGENT_CHAT_DURABLE_BACKGROUND;
    delete process.env.AGENT_NATIVE_WORKSPACE;
    delete process.env.VITE_AGENT_NATIVE_WORKSPACE;
    delete process.env.APP_BASE_PATH;
    delete process.env.VITE_APP_BASE_PATH;
  });

  afterEach(() => {
    const restoreEnv = (key: string, value: string | undefined) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };
    restoreEnv("AGENT_CHAT_DURABLE_BACKGROUND", previousFlag);
    restoreEnv("AGENT_NATIVE_WORKSPACE", previousWorkspaceFlag);
    restoreEnv("VITE_AGENT_NATIVE_WORKSPACE", previousViteWorkspaceFlag);
    restoreEnv("APP_BASE_PATH", previousAppBasePath);
    restoreEnv("VITE_APP_BASE_PATH", previousViteAppBasePath);
    for (const d of dirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  // Reproduce the REAL Nitro v3 `netlify` preset layout the emit reads, grounded
  // in actual build output: .netlify/functions-internal/server/{main.mjs,
  // server.mjs}, where server.mjs declares the in-code `/*` catch-all config with
  // an `excludedPath` array (exactly what generateNetlifyFunction emits).
  const SERVER_ENTRY =
    'export { default } from "./main.mjs";\n' +
    "export const config = {\n" +
    '  name: "server handler",\n' +
    '  generator: "nitro@3.0.0",\n' +
    '  path: "/*",\n' +
    '  nodeBundler: "none",\n' +
    '  includedFiles: ["**"],\n' +
    '  excludedPath: ["/.netlify/*"],\n' +
    "  preferStatic: true,\n" +
    "};\n";

  function setupNetlifyOutput(): string {
    const cwd = fs.mkdtempSync(path.join(process.cwd(), ".tmp-bg-emit-"));
    dirs.push(cwd);
    fs.mkdirSync(path.join(cwd, "dist"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "dist", "assets"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "dist", "assets", "entry.client-abc.js"),
      "export {};\n",
    );
    const serverDir = path.join(
      cwd,
      ".netlify",
      "functions-internal",
      "server",
    );
    fs.mkdirSync(serverDir, { recursive: true });
    fs.writeFileSync(path.join(serverDir, "main.mjs"), "export default {};\n");
    fs.writeFileSync(path.join(serverDir, "server.mjs"), SERVER_ENTRY);
    fs.mkdirSync(path.join(serverDir, "_libs"), { recursive: true });
    fs.writeFileSync(path.join(serverDir, "_libs", "yjs.mjs"), "export {};\n");
    return cwd;
  }

  function serverEntryPath(cwd: string): string {
    return path.join(
      cwd,
      ".netlify",
      "functions-internal",
      "server",
      "server.mjs",
    );
  }

  function backgroundDir(cwd: string): string {
    // Emitted INTO the SCANNED functions-internal dir so Netlify discovers it and
    // honors its `export const config` (the standard functions dir
    // `.netlify/functions/` is the build OUTPUT dir and is never scanned).
    return path.join(
      cwd,
      ".netlify",
      "functions-internal",
      "server-agent-background",
    );
  }

  it("is OFF BY DEFAULT (flag unset) so the -background function is NOT emitted", () => {
    // Default-off (opt-in) matches the runtime gate (isFlagEnabled) — durable is
    // opt-in until the async worker path is proven live, so the 15-min
    // `-background` function is emitted only when an app explicitly opts in.
    expect(isDurableBackgroundDeployEnabled()).toBe(false);
  });

  it("is ON only when explicitly opted in via a truthy flag", () => {
    for (const value of ["1", "true", "TRUE", " yes ", "on"]) {
      process.env.AGENT_CHAT_DURABLE_BACKGROUND = value;
      expect(isDurableBackgroundDeployEnabled()).toBe(true);
    }
  });

  it("is OFF for falsy, unrecognized, or empty flag values (default-off)", () => {
    for (const value of [
      "0",
      "false",
      "no",
      "off",
      "FALSE",
      " Off ",
      "",
      "maybe",
    ]) {
      process.env.AGENT_CHAT_DURABLE_BACKGROUND = value;
      expect(isDurableBackgroundDeployEnabled()).toBe(false);
    }
  });

  it("emits an async background function INTO the scanned functions-internal dir at its DEFAULT url (no custom path)", () => {
    const cwd = setupNetlifyOutput();

    emitSingleTemplateNetlifyBackgroundFunction(cwd);

    const dest = backgroundDir(cwd);
    // Emitted into the SCANNED functions-internal dir (NOT the build-output
    // `.netlify/functions/` dir) so Netlify discovers it and honors its config.
    // The standalone-into-`.netlify/functions/` attempt 404'd because that dir is
    // never scanned.
    expect(dest).toContain(
      path.join(".netlify", "functions-internal", "server-agent-background"),
    );
    // The function name MUST end in -background (Netlify async convention + the
    // runtime guard reads the -background Lambda-name suffix as a fallback).
    expect(path.basename(dest).endsWith("-background")).toBe(true);
    // Shares the SAME built handler bundle (imports ./main.mjs).
    expect(fs.existsSync(path.join(dest, "main.mjs"))).toBe(true);
    // The copied Nitro `/*` `server.mjs` entry is dropped so our entry is the
    // entrypoint (and the catch-all config.path is not re-registered here).
    expect(fs.existsSync(path.join(dest, "server.mjs"))).toBe(false);

    const entry = fs.readFileSync(
      path.join(dest, "server-agent-background.mjs"),
      "utf8",
    );
    expect(entry).toContain('await import("./main.mjs")');
    // background: true makes Netlify invoke it ASYNC (202) with the 15-min budget.
    expect(entry).toContain("background: true");
    // DOC-CORRECT FIX: NO custom config.path. The function keeps its default url
    // /.netlify/functions/server-agent-background; a custom path would REMOVE that
    // default url (and the prod probe of the custom framework-route path 404'd).
    expect(entry).not.toContain("path: PROCESS_RUN_PATH");
    // No `path:` config KEY (assert at line start; the word "path" still appears
    // in comments and in `url.pathname`).
    expect(entry).not.toMatch(/^\s*path:/m);
    expect(entry).toContain('includedFiles: ["**"]');
    // The entry REWRITES the incoming request path to the framework process-run
    // route before delegating to Nitro (it is reached at the default function url,
    // so the Nitro router needs the framework path).
    expect(entry).toContain(
      `const PROCESS_RUN_PATH = ${JSON.stringify(AGENT_CHAT_PROCESS_RUN_PATH)}`,
    );
    expect(entry).toContain(
      "url.pathname = processorPathFromBody(body) || PROCESS_RUN_PATH",
    );
    expect(entry).toContain(
      'const A2A_PROCESS_TASK_PATH = "/_agent-native/a2a/_process-task"',
    );
    expect(entry).toContain(
      'const BACKGROUND_PROCESSOR_FIELD = "__agentNativeProcessor"',
    );
    expect(entry).toContain('const BACKGROUND_PROCESSOR_ROUTE = "route"');
    expect(entry).toContain(
      'const BACKGROUND_PROCESSOR_ROUTE_FIELD = "__agentNativeProcessorRoute"',
    );
    expect(entry).toContain("function processorPathFromBody(body)");
    expect(entry).toContain('route.includes("/api/_agent-native-background/")');
    // It preserves the body (read once) and ALL headers (the HMAC Authorization
    // Bearer MUST survive — the plugin verifies it).
    expect(entry).toContain("await request.text()");
    expect(entry).toContain("headers: request.headers");
    // The entry marks the durable background runtime via a globalThis flag (NOT
    // process.env — that would trip the no-env-mutation guard) so the worker
    // reliably takes the ~13-min soft-timeout (the deployed Lambda name is not
    // guaranteed to end in -background).
    expect(entry).toContain(
      "globalThis.__AGENT_NATIVE_BACKGROUND_RUNTIME__ = true",
    );
    // The wrapper passes Netlify's (request, context) through to the Nitro
    // handler and guards the handoff so a pre-route failure is logged loudly
    // instead of silently swallowed behind the async 202.
    expect(entry).toContain("async function handler(request, context)");
    expect(entry).toContain("cachedHandler(rewritten, context)");
    expect(entry).toMatch(/try\s*\{/);
    expect(entry).toContain("wrapper failed before reaching the route");
  });

  it("does NOT touch the server /* catch-all (no excludedPath patch — default url is never shadowed)", () => {
    const cwd = setupNetlifyOutput();

    emitSingleTemplateNetlifyBackgroundFunction(cwd);

    // The Nitro `server` function's `server.mjs` must be left BYTE-FOR-BYTE
    // unchanged. We no longer patch its catch-all: the background function lives
    // at its default url /.netlify/functions/<name>, and the server catch-all
    // already excludes /.netlify/* — so there is nothing to shadow and no patch.
    const serverEntry = fs.readFileSync(serverEntryPath(cwd), "utf8");
    expect(serverEntry).toBe(SERVER_ENTRY);
    // The process-run framework route must NOT appear in the server entry's
    // excludedPath (the old patch added it; the doc-correct fix does not).
    expect(serverEntry).not.toContain(AGENT_CHAT_PROCESS_RUN_PATH);
    // The /* catch-all and the pre-existing /.netlify/* exclude are intact.
    expect(serverEntry).toContain('path: "/*"');
    expect(serverEntry).toContain('excludedPath: ["/.netlify/*"]');
  });

  it("is idempotent: re-emitting leaves the server entry unchanged", () => {
    const cwd = setupNetlifyOutput();

    emitSingleTemplateNetlifyBackgroundFunction(cwd);
    emitSingleTemplateNetlifyBackgroundFunction(cwd);

    // Re-emit must not accumulate any catch-all changes (there are none to make).
    const serverEntry = fs.readFileSync(serverEntryPath(cwd), "utf8");
    expect(serverEntry).toBe(SERVER_ENTRY);
  });

  it("skips emit (no -background artifact) when Nitro output is missing", () => {
    const cwd = fs.mkdtempSync(path.join(process.cwd(), ".tmp-bg-emit-"));
    dirs.push(cwd);
    // No .netlify/functions-internal/server/main.mjs present.

    expect(() =>
      emitSingleTemplateNetlifyBackgroundFunction(cwd),
    ).not.toThrow();
    expect(fs.existsSync(backgroundDir(cwd))).toBe(false);
  });

  function prepareSingleTemplateNetlifyOutput(cwd: string): void {
    writeSingleTemplateNetlifyRedirects(cwd);
  }

  it("passes a valid single-template Netlify deploy output", () => {
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).not.toThrow();
  });

  it("passes workspace deploy output with client assets under the normalized app base path", () => {
    process.env.AGENT_NATIVE_WORKSPACE = "1";
    process.env.APP_BASE_PATH = " //dispatch// ";
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);
    fs.mkdirSync(path.join(cwd, "dist", "dispatch"), { recursive: true });
    fs.renameSync(
      path.join(cwd, "dist", "assets"),
      path.join(cwd, "dist", "dispatch", "assets"),
    );

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).not.toThrow();
  });

  it("fails workspace deploy output without client assets under the app base path", () => {
    process.env.AGENT_NATIVE_WORKSPACE = "1";
    process.env.APP_BASE_PATH = "/dispatch";
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /dist\/dispatch\/assets is missing hashed client assets/,
    );
  });

  it("removes the incompatible default-function rewrite while keeping real redirects", () => {
    const cwd = setupNetlifyOutput();
    const redirectsPath = path.join(cwd, "dist", "_redirects");
    fs.writeFileSync(
      redirectsPath,
      [
        "https://images.agent-native.com/* https://assets.agent-native.com/:splat 301!",
        "# Generated by agent-native build for Netlify single-template deploys",
        "# Static files are served first; dynamic routes fall through to the server function.",
        "/* /.netlify/functions/server 200",
        "",
      ].join("\n"),
    );

    writeSingleTemplateNetlifyRedirects(cwd);

    const redirects = fs.readFileSync(redirectsPath, "utf-8");
    expect(redirects).toContain(
      "https://images.agent-native.com/* https://assets.agent-native.com/:splat 301!",
    );
    expect(redirects).not.toContain("/* /.netlify/functions/server 200");
  });

  it("fails deploy output that still rewrites to the removed default function URL", () => {
    const cwd = setupNetlifyOutput();
    writeSingleTemplateNetlifyRedirects(cwd);
    fs.writeFileSync(
      path.join(cwd, "dist", "_redirects"),
      "/* /.netlify/functions/server 200\n",
    );

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /must not contain "\/\* \/\.netlify\/functions\/server 200"/,
    );
  });

  it("fails deploy output that would publish without preferStatic true", () => {
    const cwd = setupNetlifyOutput();
    writeSingleTemplateNetlifyRedirects(cwd);
    const entry = fs.readFileSync(serverEntryPath(cwd), "utf8");
    fs.writeFileSync(
      serverEntryPath(cwd),
      entry.replace("preferStatic: true", "preferStatic: false"),
    );

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /preferStatic: true/,
    );
  });

  it("fails deploy output with a bare Yjs runtime import", () => {
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);
    const collabChunk = path.join(
      cwd,
      ".netlify",
      "functions-internal",
      "server",
      "_chunks",
      "collab.mjs",
    );
    fs.mkdirSync(path.dirname(collabChunk), { recursive: true });
    fs.writeFileSync(collabChunk, 'import * as Y from "yjs";\nexport { Y };\n');

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /leaves yjs as a runtime import/,
    );
  });

  it("rewrites bare Yjs imports to the bundled server copy", () => {
    const cwd = setupNetlifyOutput();
    const serverDir = path.join(
      cwd,
      ".netlify",
      "functions-internal",
      "server",
    );
    const collabChunk = path.join(serverDir, "_chunks", "collab.mjs");
    fs.mkdirSync(path.dirname(collabChunk), { recursive: true });
    fs.writeFileSync(
      collabChunk,
      'import * as Y from "yjs";\nconst dynamic = import("yjs");\nexport { Y, dynamic };\n',
    );

    expect(rewriteBareYjsImportsForServerlessOutput(serverDir)).toEqual([
      collabChunk,
    ]);
    const rewritten = fs.readFileSync(collabChunk, "utf-8");
    expect(rewritten).toContain('from "../_libs/yjs.mjs"');
    expect(rewritten).toContain('import("../_libs/yjs.mjs")');
    prepareSingleTemplateNetlifyOutput(cwd);
    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).not.toThrow();
  });

  it("rejects unsupported Yjs subpath imports instead of rewriting their semantics", () => {
    const cwd = setupNetlifyOutput();
    const serverDir = path.join(
      cwd,
      ".netlify",
      "functions-internal",
      "server",
    );
    const collabChunk = path.join(serverDir, "_chunks", "collab.mjs");
    fs.mkdirSync(path.dirname(collabChunk), { recursive: true });
    fs.writeFileSync(
      collabChunk,
      'import * as Y from "yjs/src/index.js";\nexport { Y };\n',
    );

    expect(() => rewriteBareYjsImportsForServerlessOutput(serverDir)).toThrow(
      /unsupported yjs subpath imports/,
    );
  });

  it("fails deploy output that would publish without client assets in dist", () => {
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);
    fs.rmSync(path.join(cwd, "dist", "assets"), {
      recursive: true,
      force: true,
    });

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /dist\/assets is missing hashed client assets/,
    );
  });

  it("passes a mounted (APP_BASE_PATH) build whose client assets live at dist/<app>/assets", () => {
    // Workspace deploys build every app with APP_BASE_PATH=/<app>, which nests
    // the client publish output at dist/<app>/assets. The guard must look for
    // hashed assets there — not at the single-template dist/assets location —
    // or every workspace netlify build fails with a false positive.
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);
    fs.rmSync(path.join(cwd, "dist", "assets"), {
      recursive: true,
      force: true,
    });
    const mountedAssets = path.join(cwd, "dist", "myapp", "assets");
    fs.mkdirSync(mountedAssets, { recursive: true });
    fs.writeFileSync(
      path.join(mountedAssets, "entry.client-abc.js"),
      "export {};\n",
    );
    process.env.APP_BASE_PATH = "/myapp";

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).not.toThrow();
  });

  it("fails a mounted build missing its base-path client assets, naming the mounted path", () => {
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);
    process.env.APP_BASE_PATH = "/myapp";

    // dist/assets exists (single-template location) but the mounted build's
    // real client dir dist/myapp/assets does not — that deploy WOULD spin.
    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /dist\/myapp\/assets is missing hashed client assets/,
    );
  });

  it("strips the incompatible default-function rewrite from a mounted _redirects and passes the guard", () => {
    const cwd = setupNetlifyOutput();
    process.env.APP_BASE_PATH = "/myapp";
    const mountedDir = path.join(cwd, "dist", "myapp");
    const mountedAssets = path.join(mountedDir, "assets");
    fs.mkdirSync(mountedAssets, { recursive: true });
    fs.writeFileSync(
      path.join(mountedAssets, "entry.client-abc.js"),
      "export {};\n",
    );
    fs.writeFileSync(
      path.join(mountedDir, "_redirects"),
      "/* /.netlify/functions/server 200\n",
    );

    writeSingleTemplateNetlifyRedirects(cwd);

    expect(fs.existsSync(path.join(mountedDir, "_redirects"))).toBe(false);
    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).not.toThrow();
  });

  it("fails a mounted build whose base-path _redirects still rewrites to the removed default function URL", () => {
    const cwd = setupNetlifyOutput();
    process.env.APP_BASE_PATH = "/myapp";
    const mountedDir = path.join(cwd, "dist", "myapp");
    const mountedAssets = path.join(mountedDir, "assets");
    fs.mkdirSync(mountedAssets, { recursive: true });
    fs.writeFileSync(
      path.join(mountedAssets, "entry.client-abc.js"),
      "export {};\n",
    );
    fs.writeFileSync(
      path.join(mountedDir, "_redirects"),
      "/* /.netlify/functions/server 200\n",
    );

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /dist\/myapp\/_redirects must not contain/,
    );
  });

  it("fails deploy output that would publish without the server catch-all", () => {
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);
    const entry = fs.readFileSync(serverEntryPath(cwd), "utf8");
    fs.writeFileSync(
      serverEntryPath(cwd),
      entry.replace('  path: "/*",\n', ""),
    );

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /missing the "\/\*" catch-all/,
    );
  });

  it("fails when durable background is enabled but the Netlify background function is missing", () => {
    process.env.AGENT_CHAT_DURABLE_BACKGROUND = "true";
    const cwd = setupNetlifyOutput();
    prepareSingleTemplateNetlifyOutput(cwd);

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).toThrow(
      /durable background is enabled/,
    );
  });

  it("passes durable-background deploy output after the background function is emitted", () => {
    process.env.AGENT_CHAT_DURABLE_BACKGROUND = "true";
    const cwd = setupNetlifyOutput();

    emitSingleTemplateNetlifyBackgroundFunction(cwd);
    prepareSingleTemplateNetlifyOutput(cwd);

    expect(() => assertSingleTemplateNetlifyBuildOutput(cwd)).not.toThrow();
  });
});

describe("Cloudflare worker Yjs lib extraction", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function setupWorkerOut(): { workerOutDir: string; tmpDir: string } {
    const cwd = fs.mkdtempSync(path.join(process.cwd(), ".tmp-yjs-lib-"));
    dirs.push(cwd);
    const workerOutDir = path.join(cwd, "dist", "_worker.js");
    const tmpDir = path.join(cwd, ".deploy-tmp");
    fs.mkdirSync(workerOutDir, { recursive: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    return { workerOutDir, tmpDir };
  }

  function specEsbuildBin(): string {
    const req = createRequire(path.join(process.cwd(), "package.json"));
    return path.join(
      path.dirname(req.resolve("esbuild/package.json")),
      "bin",
      "esbuild",
    );
  }

  it("resolves Yjs's ESM entry through the core package when the project lacks a direct dep", () => {
    const entry = resolveYjsEsmEntry(process.cwd());
    expect(entry).toBeTruthy();
    expect(fs.existsSync(entry!)).toBe(true);
    expect(entry!.endsWith(".mjs")).toBe(true);
  });

  it("is a no-op when the worker output has no bare yjs imports", () => {
    const { workerOutDir, tmpDir } = setupWorkerOut();
    fs.writeFileSync(
      path.join(workerOutDir, "index.js"),
      'import x from "./chunks/a.js";export default x;\n',
    );

    expect(
      bundleSharedYjsLibForWorkerOutput({
        workerOutDir,
        esbuildBin: specEsbuildBin(),
        projectCwd: process.cwd(),
        tmpDir,
      }),
    ).toEqual([]);
    expect(fs.existsSync(path.join(workerOutDir, "_libs", "yjs.mjs"))).toBe(
      false,
    );
  });

  it("fails loud on CJS require('yjs') sites the rewrite cannot fix", () => {
    const { workerOutDir, tmpDir } = setupWorkerOut();
    fs.writeFileSync(
      path.join(workerOutDir, "index.js"),
      'const Y = require("yjs");module.exports = Y;\n',
    );

    expect(() =>
      bundleSharedYjsLibForWorkerOutput({
        workerOutDir,
        esbuildBin: specEsbuildBin(),
        projectCwd: process.cwd(),
        tmpDir,
      }),
    ).toThrow(/require\("yjs"\) sites/);
  });

  it("bundles Yjs into _libs/yjs.mjs and rewrites the bare imports to it", () => {
    const { workerOutDir, tmpDir } = setupWorkerOut();
    const indexFile = path.join(workerOutDir, "index.js");
    fs.writeFileSync(indexFile, 'import*as Y from"yjs";console.log(Y.Doc);\n');

    const rewritten = bundleSharedYjsLibForWorkerOutput({
      workerOutDir,
      esbuildBin: specEsbuildBin(),
      projectCwd: process.cwd(),
      tmpDir,
    });

    expect(rewritten).toEqual([indexFile]);
    const lib = fs.readFileSync(
      path.join(workerOutDir, "_libs", "yjs.mjs"),
      "utf-8",
    );
    // The real Yjs module (its double-import guard string proves it's the
    // genuine package, not a stub).
    expect(lib).toContain("Yjs was already imported");
    const index = fs.readFileSync(indexFile, "utf-8");
    expect(index).toContain('from"./_libs/yjs.mjs"');
    expect(index).not.toMatch(/from\s*["']yjs["']/);
  });
});

describe("bundleSharedYjsLibForNodeServerOutput (unified workspace Node yjs)", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function setupServerDir(): string {
    const base = fs.mkdtempSync(path.join(process.cwd(), ".tmp-node-yjs-"));
    tmpDirs.push(base);
    const serverDir = path.join(base, "server");
    fs.mkdirSync(path.join(serverDir, "_chunks"), { recursive: true });
    return serverDir;
  }

  it("is a no-op when the server output has no bare yjs imports", () => {
    const serverDir = setupServerDir();
    fs.writeFileSync(
      path.join(serverDir, "index.mjs"),
      'import x from "./_chunks/a.mjs";export default x;\n',
    );

    expect(
      bundleSharedYjsLibForNodeServerOutput({
        serverDir,
        projectCwd: process.cwd(),
      }),
    ).toEqual([]);
    expect(fs.existsSync(path.join(serverDir, "_libs", "yjs.mjs"))).toBe(false);
  });

  it("bundles Yjs into _libs/yjs.mjs and rewrites bare imports in split chunks", () => {
    const serverDir = setupServerDir();
    const chunkFile = path.join(serverDir, "_chunks", "server-abc.mjs");
    fs.writeFileSync(chunkFile, 'import*as Y from"yjs";console.log(Y.Doc);\n');

    const rewritten = bundleSharedYjsLibForNodeServerOutput({
      serverDir,
      projectCwd: process.cwd(),
    });

    expect(rewritten).toEqual([chunkFile]);
    const lib = fs.readFileSync(
      path.join(serverDir, "_libs", "yjs.mjs"),
      "utf-8",
    );
    // The real Yjs module (its double-import guard string proves it's the
    // genuine package, not a stub).
    expect(lib).toContain("Yjs was already imported");
    const chunk = fs.readFileSync(chunkFile, "utf-8");
    expect(chunk).toContain('from"../_libs/yjs.mjs"');
    expect(chunk).not.toMatch(/from\s*["']yjs["']/);
  });

  it("fails loud on CJS require('yjs') sites the rewrite cannot fix", () => {
    const serverDir = setupServerDir();
    fs.writeFileSync(
      path.join(serverDir, "index.mjs"),
      'const Y = require("yjs");module.exports = Y;\n',
    );

    expect(() =>
      bundleSharedYjsLibForNodeServerOutput({
        serverDir,
        projectCwd: process.cwd(),
      }),
    ).toThrow(/require\("yjs"\) sites/);
  });
});

describe("esbuildSpawnCommand (Windows-safe esbuild spawn)", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs.splice(0)) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  function writeScript(name: string, content: string): string {
    const dir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-esbuild-bin-"));
    dirs.push(dir);
    const file = path.join(dir, name);
    fs.writeFileSync(file, content);
    return file;
  }

  it("runs esbuild's node-shebang JS shim through the current Node executable", () => {
    // esbuild/bin/esbuild is `#!/usr/bin/env node` — shebangs don't exist on
    // Windows, so execFileSync(shim) fails ENOENT there. Spawning
    // `node <shim> ...args` works on every platform.
    const shim = writeScript(
      "esbuild",
      '#!/usr/bin/env node\n"use strict";\nconsole.log("shim");\n',
    );

    const spawn = esbuildSpawnCommand(shim, ["--bundle", "--minify"]);

    expect(spawn.file).toBe(process.execPath);
    expect(spawn.args).toEqual([shim, "--bundle", "--minify"]);
  });

  it("spawns a POSIX sh wrapper directly even when its body mentions node", () => {
    // pnpm's node_modules/.bin/esbuild on POSIX is a `#!/bin/sh` script whose
    // body execs node — running IT through node would break. Only the shebang
    // line decides.
    const wrapper = writeScript(
      "esbuild",
      '#!/bin/sh\nexec node "$basedir/../esbuild/bin/esbuild" "$@"\n',
    );

    const spawn = esbuildSpawnCommand(wrapper, ["--bundle"]);

    expect(spawn.file).toBe(wrapper);
    expect(spawn.args).toEqual(["--bundle"]);
  });

  it("spawns a bare PATH lookup and native executables directly", () => {
    const bare = esbuildSpawnCommand("esbuild", ["--version"]);
    expect(bare.file).toBe("esbuild");
    expect(bare.args).toEqual(["--version"]);

    const exe = writeScript("esbuild.exe", "MZ\u0090\u0000binary");
    const native = esbuildSpawnCommand(exe, ["--version"]);
    expect(native.file).toBe(exe);
    expect(native.args).toEqual(["--version"]);
  });
});
