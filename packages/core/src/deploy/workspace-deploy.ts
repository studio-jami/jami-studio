/**
 * `agent-native deploy` — build and deploy every app in a workspace to a
 * single origin. Each app is served from `/<app-name>/*`, so:
 *
 *   https://your-agents.com/mail/*       → apps/mail
 *   https://your-agents.com/calendar/*   → apps/calendar
 *
 * Benefits of same-origin deploy:
 *   - Shared auth cookie → log in once, every app is signed in
 *   - Cross-app A2A is a same-origin fetch (no CORS, no JWT for siblings)
 *   - One DNS record, one TLS cert, one CDN cache
 *
 * Per-app independent deploy is still supported — just cd into the app and
 * run `agent-native build` as before. This orchestrator is for teams that
 * want the whole workspace behind one domain.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Windows-safe pnpm exec. On Windows, pnpm typically exists only as
 * `.cmd`/`.ps1` shims (corepack, standalone installer, npm -g) — there is no
 * `pnpm.exe`, so `execFileSync("pnpm", ...)` fails ENOENT (libuv resolves
 * only `.exe`/`.com` without a shell). Same constraint already documented on
 * `windowsSafePnpmSpawn` in cli/workspace-dev.ts. Resolution order:
 *   1. `npm_execpath` pointing at a JS entry → run through this Node binary
 *      (exact interpreter, no shell).
 *   2. Fall back to `shell: true` so cmd.exe resolves the `.cmd` shim. The
 *      command line is joined here (avoids DEP0190); tokens are workspace
 *      app ids (directory names, reserved-id-checked) and fixed flags —
 *      never user input — so no shell escaping is required.
 * POSIX spawns pnpm directly, unchanged. Exported for tests.
 */
export function createWindowsSafePnpmExecFileSync(
  base: typeof execFileSync,
  platform: NodeJS.Platform = process.platform,
  npmExecPath: () => string | undefined = () => process.env.npm_execpath,
): typeof execFileSync {
  return ((command: string, args?: readonly string[], options?: object) => {
    if (platform === "win32" && command === "pnpm" && Array.isArray(args)) {
      const execPath = npmExecPath();
      if (execPath && /\.[cm]?js$/i.test(execPath)) {
        return base(process.execPath, [execPath, ...args], options);
      }
      return base([command, ...args].join(" "), {
        ...(options ?? {}),
        shell: true,
      });
    }
    return base(command, args as string[] | undefined, options);
  }) as typeof execFileSync;
}

const windowsSafePnpmExecFileSync =
  createWindowsSafePnpmExecFileSync(execFileSync);

import {
  AGENT_BACKGROUND_PROCESSOR_A2A,
  AGENT_BACKGROUND_PROCESSOR_FIELD,
  AGENT_BACKGROUND_PROCESSOR_ROUTE,
  AGENT_BACKGROUND_PROCESSOR_ROUTE_FIELD,
  AGENT_CHAT_PROCESS_RUN_PATH,
} from "../agent/durable-background.js";
import { findWorkspaceRoot } from "../scripts/utils.js";
import {
  DEFAULT_WORKSPACE_APP_AUDIENCE,
  normalizeWorkspaceAppAudience,
  normalizeWorkspaceAppPathList,
  workspaceAppAudienceFromPackageJson,
  workspaceAppRouteAccessFromPackageJson,
  type WorkspaceAppRouteAccess,
  type WorkspaceAppAudience,
} from "../shared/workspace-app-audience.js";
import { DISPATCH_WORKSPACE_ROOT_REDIRECTS } from "../shared/workspace-app-id.js";
import {
  collectImmutableAssetPaths,
  IMMUTABLE_ASSET_CACHE_HEADERS,
} from "./immutable-assets.js";
import {
  computeWorkspaceAppBuildHash,
  isWorkspaceBuildCacheEnabled,
  workspaceAppBuildCacheHit,
  writeWorkspaceAppBuildStamp,
} from "./workspace-build-cache.js";

export type WorkspaceDeployPreset =
  | "cloudflare_pages"
  | "netlify"
  | "vercel"
  | "node";

const NETLIFY_WORKSPACE_STATIC_DIR = "_workspace_static";
const NETLIFY_PUBLIC_ASSET_EXTENSIONS = new Set([
  "avif",
  "css",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "js",
  "json",
  "map",
  "mp4",
  "pdf",
  "png",
  "svg",
  "txt",
  "wasm",
  "webm",
  "webmanifest",
  "webp",
  "xml",
]);
const WORKSPACE_APPS_ENV_KEY = "AGENT_NATIVE_WORKSPACE_APPS_JSON";
const WORKSPACE_APPS_MANIFEST_DIR = ".agent-native";
const WORKSPACE_APPS_MANIFEST_FILE = "workspace-apps.json";
const VERCEL_OUTPUT_DIR = ".vercel/output";

// Version of this package — folds into the build-cache key so upgrading the
// framework invalidates every cached app build.
let BUILDER_VERSION = "unknown";
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // dist/deploy/workspace-deploy.js → ../../package.json
  BUILDER_VERSION =
    (
      JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8"),
      ) as { version?: string }
    ).version ?? "unknown";
} catch {}

interface WorkspaceAppManifestEntry {
  id: string;
  name: string;
  description: string;
  path: string;
  url?: string;
  isDispatch: boolean;
  audience: WorkspaceAppAudience;
  publicPaths: string[];
  protectedPaths: string[];
}

interface WorkspaceAppManifestOverride {
  id: string;
  url?: string;
  audience?: WorkspaceAppAudience;
  publicPaths?: string[];
  protectedPaths?: string[];
}

export interface WorkspaceDeployOptions {
  args?: string[];
  /** Override the workspace root (defaults to walking up from cwd). */
  workspaceRoot?: string;
  /** Only build — don't invoke the deploy platform CLI. */
  buildOnly?: boolean;
  /** Target preset. Defaults to `cloudflare_pages`. */
  preset?: WorkspaceDeployPreset;
  /** @internal Override process execution in tests. */
  execFile?: typeof execFileSync;
}

export async function runWorkspaceDeploy(
  opts: WorkspaceDeployOptions = {},
): Promise<void> {
  const workspaceRoot =
    opts.workspaceRoot ?? findWorkspaceRoot(process.cwd()) ?? process.cwd();
  const appsDir = path.join(workspaceRoot, "apps");
  if (!fs.existsSync(appsDir)) {
    throw new Error(
      `No apps/ directory found at ${workspaceRoot}. Run this inside an agent-native workspace.`,
    );
  }

  const rawArgs = opts.args ?? [];
  const args = new Set(rawArgs);
  const buildOnly = opts.buildOnly ?? args.has("--build-only");

  const apps = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => fs.existsSync(path.join(appsDir, n, "package.json")))
    .sort(compareWorkspaceAppIds);

  if (apps.length === 0) {
    throw new Error(
      `Workspace has no apps. Run \`agent-native add-app\` to add one.`,
    );
  }
  assertNoReservedWorkspaceAppIds(apps);
  const workspaceApps = readWorkspaceAppManifest(workspaceRoot, apps);

  const preset = resolvePreset(opts.preset, rawArgs);
  assertWorkspaceDeployProductionEnv({ buildOnly, preset });
  const distDir = path.join(workspaceRoot, "dist");
  const vercelOutputDir = path.join(workspaceRoot, VERCEL_OUTPUT_DIR);
  if (preset === "vercel") {
    fs.rmSync(vercelOutputDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(vercelOutputDir, "static"), { recursive: true });
    fs.mkdirSync(path.join(vercelOutputDir, "functions"), {
      recursive: true,
    });
  } else {
    fs.rmSync(distDir, { recursive: true, force: true });
    fs.mkdirSync(distDir, { recursive: true });
  }

  if (preset === "netlify") {
    const functionsDir = netlifyFunctionsDir(workspaceRoot);
    fs.rmSync(functionsDir, { recursive: true, force: true });
    fs.mkdirSync(functionsDir, { recursive: true });
  }

  console.log(
    `[workspace-deploy] Building ${apps.length} app(s) for preset=${preset}`,
  );

  const buildCacheEnabled = isWorkspaceBuildCacheEnabled(rawArgs);
  if (!buildCacheEnabled) {
    console.log(
      `[workspace-deploy] Build cache disabled — rebuilding every app.`,
    );
  }
  let cachedCount = 0;
  const execFile = opts.execFile ?? windowsSafePnpmExecFileSync;
  for (const app of apps) {
    const skipped = buildOneApp(
      workspaceRoot,
      app,
      preset,
      execFile,
      workspaceApps,
      buildCacheEnabled,
    );
    if (skipped) cachedCount++;
    moveAppBuildIntoWorkspaceOutput(
      workspaceRoot,
      app,
      preset,
      distDir,
      vercelOutputDir,
      workspaceApps,
    );
  }
  if (buildCacheEnabled && cachedCount > 0) {
    console.log(
      `[workspace-deploy] Build cache: reused ${cachedCount}/${apps.length} unchanged app build(s), rebuilt ${apps.length - cachedCount}.`,
    );
  }
  writeWorkspaceAppManifests(
    workspaceRoot,
    distDir,
    apps,
    workspaceApps,
    preset,
  );

  if (preset === "netlify") {
    writeNetlifyRedirects(distDir, apps);
    writeNetlifyHeaders(distDir, apps);
  } else if (preset === "vercel") {
    writeVercelBuildConfig(vercelOutputDir, apps);
  } else if (preset === "node") {
    writeNodeServerEntry(distDir, apps, workspaceApps);
  } else {
    dedupeCloudflareWorkspaceYjs(distDir, apps);
    writeCloudflareRoutingManifest(distDir, apps);
  }

  if (buildOnly) {
    const outputDir = preset === "vercel" ? vercelOutputDir : distDir;
    console.log(
      `\n[workspace-deploy] Build complete at ${outputDir}. Skipping publish (--build-only).`,
    );
    return;
  }

  console.log(`\n[workspace-deploy] Build complete. Publish with:\n`);
  console.log(`  cd ${path.relative(process.cwd(), workspaceRoot) || "."}`);
  if (preset === "netlify") {
    console.log(
      `  netlify deploy --prod --dir=dist --functions=.netlify/functions-internal\n`,
    );
  } else if (preset === "vercel") {
    console.log(`  vercel deploy --prebuilt\n`);
  } else if (preset === "node") {
    console.log(`  node --env-file=.env dist/server.mjs\n`);
  } else {
    console.log(`  wrangler pages deploy dist\n`);
  }
  console.log(
    `All apps live at https://<origin>/<app-name>/*. Log in once on any app\nand the session is shared across the workspace.`,
  );
}

function buildOneApp(
  workspaceRoot: string,
  app: string,
  preset: WorkspaceDeployPreset,
  execFile: typeof execFileSync,
  workspaceApps: WorkspaceAppManifestEntry[],
  buildCacheEnabled: boolean,
): boolean {
  const appDir = path.join(workspaceRoot, "apps", app);
  const workspaceAppAudience = workspaceAppAudienceForApp(workspaceApps, app);
  const workspaceAppRouteAccess = workspaceAppRouteAccessForApp(
    workspaceApps,
    app,
  );
  const workspaceGatewayUrl =
    process.env.VITE_WORKSPACE_GATEWAY_URL || workspaceBaseUrl();
  const workspaceOAuthUrl = workspaceOAuthOrigin(workspaceGatewayUrl);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // The workspace `node` preset builds each app with Nitro's
    // `node-middleware` runtime: the entry exports a Node request handler
    // (no listen call), so the generated dist/server.mjs dispatcher can
    // mount all apps in ONE process. `node`/`node-server` would self-listen
    // at import time — one listener per app.
    NITRO_PRESET: preset === "node" ? "node-middleware" : preset,
    // Windows: rolldown's rayon thread pool has a native race that
    // intermittently (and for some apps deterministically) kills the build
    // with an access violation (0xC0000005). Capping the pool avoids the
    // race entirely; verified: chat's cloudflare_pages build crashed 100%
    // in-sequence at default threads and STILL crashed at 2 (forms died at
    // 2 in a full 14-app sequence) — only a single rayon thread has proven
    // green across the whole workspace. Respect an explicit operator
    // override.
    ...(process.platform === "win32"
      ? { RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS ?? "1" }
      : {}),
    AGENT_NATIVE_WORKSPACE: "1",
    AGENT_NATIVE_WORKSPACE_APP_ID: app,
    VITE_AGENT_NATIVE_WORKSPACE: "1",
    VITE_AGENT_NATIVE_WORKSPACE_APP_ID: app,
    APP_BASE_PATH: `/${app}`,
    VITE_APP_BASE_PATH: `/${app}`,
    AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: workspaceAppAudience,
    AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: JSON.stringify(
      workspaceAppRouteAccess.publicPaths,
    ),
    AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: JSON.stringify(
      workspaceAppRouteAccess.protectedPaths,
    ),
    VITE_AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: workspaceAppAudience,
    VITE_AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: JSON.stringify(
      workspaceAppRouteAccess.publicPaths,
    ),
    VITE_AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: JSON.stringify(
      workspaceAppRouteAccess.protectedPaths,
    ),
    VITE_AGENT_NATIVE_WORKSPACE_APPS_JSON: JSON.stringify(workspaceApps),
    ...(workspaceGatewayUrl
      ? {
          WORKSPACE_GATEWAY_URL:
            process.env.WORKSPACE_GATEWAY_URL || workspaceGatewayUrl,
          VITE_WORKSPACE_GATEWAY_URL: workspaceGatewayUrl,
          ...(workspaceOAuthUrl
            ? { VITE_WORKSPACE_OAUTH_ORIGIN: workspaceOAuthUrl }
            : {}),
        }
      : {}),
    [WORKSPACE_APPS_ENV_KEY]: JSON.stringify(workspaceApps),
  };

  if (preset === "netlify" && appUsesNetlifyUnpooledDatabaseUrl(appDir)) {
    env.DATABASE_URL =
      process.env.NETLIFY_DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      env.DATABASE_URL;
  }

  // Content-hash cache: when the app's sources, workspace deps, lockfile,
  // and invocation env are byte-identical to the previous successful build
  // (and its output still exists), reuse it instead of rebuilding.
  const cacheOpts = {
    workspaceRoot,
    appDir,
    app,
    preset,
    buildEnv: buildCacheEnvDelta(env),
    builderVersion: BUILDER_VERSION,
  };
  const buildHash = buildCacheEnabled
    ? computeWorkspaceAppBuildHash(cacheOpts)
    : null;
  if (buildCacheEnabled && workspaceAppBuildCacheHit(cacheOpts, buildHash)) {
    console.log(
      `[workspace-deploy] ${app} unchanged — reusing cached build (base=/${app}, preset=${preset})`,
    );
    return true;
  }

  console.log(
    `[workspace-deploy] Building ${app} (base=/${app}, preset=${preset})`,
  );

  cleanAppBuildOutputs(appDir);

  // Windows: app builds occasionally die with a native access violation
  // (0xC0000005 / exit 3221225477) inside the bundler's native bindings.
  // It is a timing race, not a code failure — the same build passes on
  // retry (and reliably passes with DEBUG logging enabled, which shifts
  // the timing). Retry native-crash exits a bounded number of times;
  // real build failures exit with ordinary codes and are NOT retried.
  const NATIVE_CRASH_EXIT_CODES = new Set([3221225477, -1073741819]);
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt++) {
    try {
      execFile("pnpm", ["--filter", app, "build"], {
        cwd: workspaceRoot,
        env,
        stdio: "inherit",
      });
      if (buildCacheEnabled) {
        writeWorkspaceAppBuildStamp(cacheOpts, buildHash);
      }
      return false;
    } catch (error) {
      const status = (error as { status?: number | null })?.status ?? null;
      const isNativeCrash =
        typeof status === "number" && NATIVE_CRASH_EXIT_CODES.has(status);
      if (!isNativeCrash || attempt >= maxAttempts) throw error;
      console.warn(
        `[workspace-deploy] ${app} build died with a native crash ` +
          `(exit ${status}); retrying (${attempt}/${maxAttempts - 1})...`,
      );
      cleanAppBuildOutputs(appDir);
    }
  }
}

function moveAppBuildIntoWorkspaceOutput(
  workspaceRoot: string,
  app: string,
  preset: WorkspaceDeployPreset,
  distDir: string,
  vercelOutputDir: string,
  workspaceApps: WorkspaceAppManifestEntry[],
): void {
  const appDir = path.join(workspaceRoot, "apps", app);
  if (preset === "vercel") {
    copyVercelAppBuildIntoWorkspace(
      workspaceRoot,
      app,
      vercelOutputDir,
      workspaceApps,
    );
    return;
  }

  // Resolve the per-app build output: prefer dist/ (standard), fall back to
  // .output/ (Nitro's default). The Cloudflare preset emits into dist/
  // containing the worker + assets.
  const candidates = ["dist", ".output"];
  const src = candidates
    .map((c) => path.join(appDir, c))
    .find((p) => fs.existsSync(p));
  if (!src) {
    throw new Error(
      `Expected ${candidates.join(" or ")} under ${appDir} but none existed. Check the app's build script.`,
    );
  }
  if (preset === "netlify") {
    const mountedSrc = path.join(src, app);
    const staticSrc = fs.existsSync(mountedSrc) ? mountedSrc : src;
    const target = path.join(distDir, NETLIFY_WORKSPACE_STATIC_DIR, app);
    fs.mkdirSync(target, { recursive: true });
    copyDir(staticSrc, target);
    // Nitro/Vite mounted builds can contain a nested copy of public assets at
    // dist/<app>/<app>/...; the workspace root already supplies the outer
    // mount path, so keeping it would publish duplicate /<app>/<app> URLs.
    fs.rmSync(path.join(target, app), { recursive: true, force: true });
    copyNetlifyFunctionIntoWorkspace(workspaceRoot, app, workspaceApps, target);
  } else {
    const target = path.join(distDir, app);
    fs.mkdirSync(target, { recursive: true });
    copyDir(src, target);
  }
}

function copyVercelAppBuildIntoWorkspace(
  workspaceRoot: string,
  app: string,
  vercelOutputDir: string,
  workspaceApps: WorkspaceAppManifestEntry[],
): void {
  const appDir = path.join(workspaceRoot, "apps", app);
  const src = path.join(appDir, VERCEL_OUTPUT_DIR);
  if (!fs.existsSync(src)) {
    throw new Error(
      `Expected Vercel output at ${src} after building ${app}. Check the app's build script and NITRO_PRESET.`,
    );
  }

  const staticSrc = path.join(src, "static");
  const staticDest = path.join(vercelOutputDir, "static");
  if (fs.existsSync(staticSrc)) {
    copyDir(staticSrc, staticDest);
    // Nitro's Vercel preset already nests assets under baseURL. The shared
    // deploy build also mirrors client assets under baseURL for other Nitro
    // presets, so mounted apps can contain a duplicate /<app>/<app> copy.
    fs.rmSync(path.join(staticDest, app, app), {
      recursive: true,
      force: true,
    });
  }

  const functionSrc = path.join(src, "functions", "__server.func");
  if (!fs.existsSync(functionSrc)) {
    throw new Error(
      `Expected Vercel function at ${functionSrc} after building ${app}. Check the app's build script and NITRO_PRESET.`,
    );
  }

  const functionDest = path.join(
    vercelOutputDir,
    "functions",
    `${app}-server.func`,
  );
  fs.rmSync(functionDest, { recursive: true, force: true });
  copyDir(functionSrc, functionDest);
  patchVercelFunctionEntry(functionDest, app, workspaceApps);
}

/**
 * Collapse every app's Yjs copy onto ONE shared module in the unified
 * Cloudflare artifact. wrangler re-bundles all app workers into a single
 * final bundle behind the dispatcher, so per-app Yjs copies all land in one
 * isolate — Yjs's own guard logs "Yjs was already imported. This breaks
 * constructor checks" once per extra copy, and Yjs objects crossing copies
 * fail instanceof checks (real-time collab risk). Per-app builds emit Yjs as
 * a standalone `dist/<app>/_worker.js/_libs/yjs.mjs` (see deploy/build.ts);
 * here the first copy is hoisted to `dist/_yjs/yjs.mjs` and every app's lib
 * becomes a re-export shim of it, so esbuild's path-keyed module dedupe
 * instantiates Yjs exactly once.
 */
export function dedupeCloudflareWorkspaceYjs(
  distDir: string,
  apps: string[],
): string[] {
  const libPaths = apps
    .map((app) => path.join(distDir, app, "_worker.js", "_libs", "yjs.mjs"))
    .filter((libPath) => fs.existsSync(libPath));
  if (libPaths.length === 0) return [];

  const sharedFile = path.join(distDir, "_yjs", "yjs.mjs");
  fs.mkdirSync(path.dirname(sharedFile), { recursive: true });
  fs.copyFileSync(libPaths[0], sharedFile);
  for (const libPath of libPaths) {
    const rel = path
      .relative(path.dirname(libPath), sharedFile)
      .split(path.sep)
      .join("/");
    fs.writeFileSync(
      libPath,
      `export * from "${rel.startsWith(".") ? rel : `./${rel}`}";\n`,
    );
  }

  // Keep the shared module (and the dispatcher worker) out of the public
  // static asset set. `.assetsignore` is only honored at the output root.
  const assetsIgnorePath = path.join(distDir, ".assetsignore");
  const existing = fs.existsSync(assetsIgnorePath)
    ? fs.readFileSync(assetsIgnorePath, "utf-8")
    : "";
  const lines = new Set(existing.split(/\r?\n/).filter(Boolean));
  lines.add("_worker.js");
  lines.add("_yjs");
  fs.writeFileSync(assetsIgnorePath, [...lines].join("\n") + "\n");

  console.log(
    `[workspace-deploy] Deduped yjs across ${libPaths.length} app worker(s) into _yjs/yjs.mjs`,
  );
  return libPaths;
}

/**
 * Write the Cloudflare Pages `_routes.json` and a dispatcher `_worker.js` at
 * the workspace dist root so each app is reachable under /<app>/*.
 */
function writeCloudflareRoutingManifest(distDir: string, apps: string[]): void {
  const dispatchFaviconAsset = apps.includes("dispatch")
    ? dispatchRootFaviconAsset(distDir)
    : null;
  // _routes.json tells Cloudflare which paths are dynamic (Functions) vs
  // static. Mark both /<app> and /<app>/* as include so every app's worker
  // handles its root and subtree.
  const include = apps.flatMap((a) => [`/${a}`, `/${a}/*`]).concat(["/"]);
  if (apps.includes("dispatch")) {
    include.push("/_agent-native/*");
    include.push("/.well-known/*");
    include.push(
      ...DISPATCH_WORKSPACE_ROOT_REDIRECTS.map(([from]) => `/${from}`),
    );
    include.push("/apps/*");
    if (dispatchFaviconAsset) include.push("/favicon.ico");
  }
  // Cloudflare rejects a _routes.json where a splat rule overlaps any other
  // rule (e.g. "/apps/*" + "/apps/new-app"). Drop every rule already covered
  // by another rule's splat, and exact duplicates.
  const splatPrefixes = include
    .filter((r) => r.endsWith("/*"))
    .map((r) => r.slice(0, -1));
  const dedupedInclude = [
    ...new Set(
      include.filter(
        (r) => !splatPrefixes.some((p) => r !== `${p}*` && r.startsWith(p)),
      ),
    ),
  ];
  const routes = {
    version: 1,
    include: dedupedInclude,
    exclude: [],
  };
  fs.writeFileSync(
    path.join(distDir, "_routes.json"),
    JSON.stringify(routes, null, 2) + "\n",
  );

  // Dispatcher worker: inspects the path and forwards to the matching
  // per-app worker.
  const imports = apps
    .map((a) => `import ${moduleIdent(a)} from "./${a}/_worker.js";`)
    .join("\n");
  const dispatch = apps
    .map(
      (a) =>
        `  if (pathname === "/${a}" || pathname.startsWith("/${a}/")) return ${moduleIdent(a)}.fetch(requestForMountedApp(request, "/${a}"), env, ctx);`,
    )
    .join("\n");
  const dispatchRootFrameworkRoutes = apps.includes("dispatch")
    ? `    if (pathname === "/_agent-native" || pathname.startsWith("/_agent-native/") || pathname === "/.well-known" || pathname.startsWith("/.well-known/")) return ${moduleIdent("dispatch")}.fetch(request, env, ctx);
`
    : "";
  const dispatchRootFaviconRoute = dispatchFaviconAsset
    ? `    if (pathname === "/favicon.ico") return Response.redirect(new URL("/dispatch/${dispatchFaviconAsset}", request.url).toString(), 302);
`
    : "";
  const dispatchRootAliasRoutes = apps.includes("dispatch")
    ? DISPATCH_WORKSPACE_ROOT_REDIRECTS.map(
        ([from, to]) =>
          `    if (pathname === "/${from}") return Response.redirect(new URL("/dispatch/${to}" + search, request.url).toString(), 302);`,
      ).join("\n") + "\n"
    : "";
  const dispatchRootDynamicAliasRoutes = apps.includes("dispatch")
    ? `    if (pathname.startsWith("/apps/")) return Response.redirect(new URL("/dispatch" + pathname + search, request.url).toString(), 302);
`
    : "";
  const dispatchMountedRootRedirect = apps.includes("dispatch")
    ? `    if (pathname === "/dispatch" || pathname === "/dispatch/") return Response.redirect(new URL("/dispatch/overview" + search, request.url).toString(), 302);
`
    : "";

  const worker = `${imports}

function requestForMountedApp(request, basePath) {
  const url = new URL(request.url);
  if (url.pathname !== basePath && url.pathname !== \`\${basePath}/\`) {
    return request;
  }
  url.pathname = \`\${basePath}//\`;
  return new Request(url, request);
}

export default {
  async fetch(request, env, ctx) {
    const { pathname, search } = new URL(request.url);
${dispatchRootFrameworkRoutes}${dispatchRootFaviconRoute}${dispatchRootAliasRoutes}${dispatchRootDynamicAliasRoutes}${dispatchMountedRootRedirect}${dispatch}
    if (pathname === "/") {
      return Response.redirect(new URL("${cloudflareRootRedirectPath(apps)}", request.url).toString(), 302);
    }
    return new Response("Not found", { status: 404 });
  },
};
`;
  fs.writeFileSync(path.join(distDir, "_worker.js"), worker);
}

function cloudflareRootRedirectPath(apps: string[]): string {
  return apps.includes("dispatch") ? "/dispatch/overview" : `/${apps[0]}/`;
}

/**
 * Write the unified Node dispatcher `dist/server.mjs` so one bare Node
 * process serves every app at /<app>/*.
 *
 * Each app is built with Nitro's `node-middleware` runtime (wrapped by
 * core's scope-init entry — see `workspaceNodeMiddlewareEntry` in
 * deploy/build.ts), so `./<app>/server/index.mjs` exports a request handler
 * without listening. The dispatcher owns the single listener and mirrors the
 * Cloudflare `_worker.js` routing semantics: root framework routes to
 * dispatch, root/alias redirects, mounted-app root normalization, and
 * per-app path routing.
 *
 * App bundles are loaded with SEQUENTIAL dynamic imports behind the
 * module-graph handshake globals (`__AGENT_NATIVE_MODULE_GRAPH_SCOPE__` /
 * `__AGENT_NATIVE_MODULE_GRAPH_ENV__`, consumed by core's global-scope
 * module at its own evaluation): Rolldown chunk splitting can evaluate
 * registry chunks before the entry body's inlined scope-init call, so static
 * imports could register one app's built-ins into an unscoped (or sibling's)
 * registry. The handshake guarantees the scope id and per-app env defaults
 * are live before ANY module of that app's graph evaluates.
 *
 * Static assets are served by the dispatcher from `./<app>/public` (checking
 * the baseURL-nested copy first, then the root copy). Nitro's own
 * `serveStatic` is intentionally NOT used: its fs reader resolves against
 * `globalThis.__nitro_main__`, which every app's bundle overwrites at import
 * time — the last app loaded would capture every sibling's asset reads.
 */
export function writeNodeServerEntry(
  distDir: string,
  apps: string[],
  workspaceApps: WorkspaceAppManifestEntry[] = [],
): void {
  const dispatchFaviconAsset = apps.includes("dispatch")
    ? dispatchRootFaviconAsset(distDir)
    : null;

  const appEntries = apps
    .map((a) => {
      const audience = workspaceAppAudienceForApp(workspaceApps, a);
      const routeAccess = workspaceAppRouteAccessForApp(workspaceApps, a);
      const env: Record<string, string> = {
        AGENT_NATIVE_WORKSPACE_APP_ID: a,
        APP_BASE_PATH: `/${a}`,
        AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: audience,
        AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: JSON.stringify(
          routeAccess.publicPaths,
        ),
        AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: JSON.stringify(
          routeAccess.protectedPaths,
        ),
        VITE_AGENT_NATIVE_WORKSPACE_APP_ID: a,
        VITE_APP_BASE_PATH: `/${a}`,
        VITE_AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: audience,
        VITE_AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: JSON.stringify(
          routeAccess.publicPaths,
        ),
        VITE_AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: JSON.stringify(
          routeAccess.protectedPaths,
        ),
      };
      return `  {
    id: ${JSON.stringify(a)},
    basePath: ${JSON.stringify(`/${a}`)},
    entry: ${JSON.stringify(`./${a}/server/index.mjs`)},
    publicDir: path.join(distDir, ${JSON.stringify(a)}, "public"),
    env: ${JSON.stringify(env)},
    middleware: null,
    handleUpgrade: null,
  },`;
    })
    .join("\n");

  const dispatchRootFrameworkRoutes = apps.includes("dispatch")
    ? `  if (pathname === "/_agent-native" || pathname.startsWith("/_agent-native/") || pathname === "/.well-known" || pathname.startsWith("/.well-known/")) return dispatchApp.middleware(req, res);
`
    : "";
  const dispatchRootFaviconRoute = dispatchFaviconAsset
    ? `  if (pathname === "/favicon.ico") return redirect(res, "/dispatch/${dispatchFaviconAsset}");
`
    : "";
  const dispatchRootAliasRoutes = apps.includes("dispatch")
    ? DISPATCH_WORKSPACE_ROOT_REDIRECTS.map(
        ([from, to]) =>
          `  if (pathname === "/${from}") return redirect(res, "/dispatch/${to}" + search);`,
      ).join("\n") + "\n"
    : "";
  const dispatchRootDynamicAliasRoutes = apps.includes("dispatch")
    ? `  if (pathname.startsWith("/apps/")) return redirect(res, "/dispatch" + pathname + search);
`
    : "";
  const dispatchMountedRootRedirect = apps.includes("dispatch")
    ? `  if (pathname === "/dispatch" || pathname === "/dispatch/") return redirect(res, "/dispatch/overview" + search);
`
    : "";
  const dispatchAppLookup = apps.includes("dispatch")
    ? `const dispatchApp = apps.find((app) => app.id === "dispatch");
`
    : "";

  const server = `// AUTO-GENERATED by agent-native deploy --preset node
// One Node process serving every workspace app at /<app>/*.
// Run with: node --env-file=.env server.mjs   (PORT/NITRO_PORT, HOST/NITRO_HOST)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.dirname(fileURLToPath(import.meta.url));

const apps = [
${appEntries}
];
${dispatchAppLookup}
// Module-graph handshake: core's global-scope module (a dependency of every
// registry module in an app bundle) consumes these globals at its own
// evaluation, so the per-app registry scope and identity env are live before
// ANY module of the app's graph runs — including registry chunks Rolldown
// evaluates ahead of the entry body's inlined scope-init call. Apps are
// imported SEQUENTIALLY so the handshake can never leak across siblings.
const HANDSHAKE_SCOPE_KEY = "__AGENT_NATIVE_MODULE_GRAPH_SCOPE__";
const HANDSHAKE_ENV_KEY = "__AGENT_NATIVE_MODULE_GRAPH_ENV__";
for (const app of apps) {
  globalThis[HANDSHAKE_SCOPE_KEY] = app.id;
  globalThis[HANDSHAKE_ENV_KEY] = app.env;
  try {
    const mod = await import(app.entry);
    app.middleware = mod.middleware;
    app.handleUpgrade = mod.handleUpgrade;
  } finally {
    delete globalThis[HANDSHAKE_SCOPE_KEY];
    delete globalThis[HANDSHAKE_ENV_KEY];
  }
  if (typeof app.middleware !== "function") {
    throw new Error(
      \`[workspace] \${app.entry} did not export a middleware function. \` +
        \`Rebuild the workspace with agent-native deploy --preset node.\`,
    );
  }
}

const MIME_TYPES = {
  avif: "image/avif",
  css: "text/css; charset=utf-8",
  gif: "image/gif",
  htm: "text/html; charset=utf-8",
  html: "text/html; charset=utf-8",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  ttf: "font/ttf",
  txt: "text/plain; charset=utf-8",
  wasm: "application/wasm",
  webm: "video/webm",
  webmanifest: "application/manifest+json",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xml: "application/xml; charset=utf-8",
};
const IMMUTABLE_HEADERS = ${JSON.stringify(IMMUTABLE_ASSET_CACHE_HEADERS)};

function appForPathname(pathname) {
  for (const app of apps) {
    if (pathname === app.basePath || pathname.startsWith(app.basePath + "/")) {
      return app;
    }
  }
  return null;
}

function staticFileFor(app, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  // Nitro output keeps a baseURL-nested asset copy (public/<app>/...) and a
  // root copy (public/...); check nested first to mirror the platform CDNs.
  const candidates = [decoded, decoded.slice(app.basePath.length) || "/"];
  const publicRoot = path.resolve(app.publicDir);
  for (const rel of candidates) {
    const resolved = path.resolve(path.join(app.publicDir, rel));
    if (resolved !== publicRoot && !resolved.startsWith(publicRoot + path.sep)) {
      continue;
    }
    try {
      if (fs.statSync(resolved).isFile()) return resolved;
    } catch {}
  }
  return null;
}

function serveStatic(app, pathname, req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const file = staticFileFor(app, pathname);
  if (!file) return false;
  const ext = path.extname(file).slice(1).toLowerCase();
  const headers = {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
  };
  if (pathname.includes("/assets/")) Object.assign(headers, IMMUTABLE_HEADERS);
  res.writeHead(200, headers);
  if (req.method === "HEAD") {
    res.end();
    return true;
  }
  fs.createReadStream(file).pipe(res);
  return true;
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

const server = http.createServer((req, res) => {
  const { pathname, search } = new URL(req.url || "/", "http://workspace.internal");
${dispatchRootFrameworkRoutes}${dispatchRootFaviconRoute}${dispatchRootAliasRoutes}${dispatchRootDynamicAliasRoutes}${dispatchMountedRootRedirect}  const app = appForPathname(pathname);
  if (app) {
    if (serveStatic(app, pathname, req, res)) return;
    if (pathname === app.basePath || pathname === app.basePath + "/") {
      // Mounted-app root normalization (matches the Cloudflare dispatcher's
      // requestForMountedApp and the Netlify entry's normalizeBasePathArgs).
      req.url = app.basePath + "//" + search;
    }
    return app.middleware(req, res);
  }
  if (pathname === "/") {
    return redirect(res, ${JSON.stringify(cloudflareRootRedirectPath(apps))} + search);
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url || "/", "http://workspace.internal");
  const app = appForPathname(pathname);
  if (app && typeof app.handleUpgrade === "function") {
    return app.handleUpgrade(req, socket, head);
  }
  socket.destroy();
});

const parsedPort = Number.parseInt(
  process.env.NITRO_PORT ?? process.env.PORT ?? "",
  10,
);
const port = Number.isNaN(parsedPort) ? 3000 : parsedPort;
const host = process.env.NITRO_HOST || process.env.HOST || undefined;
server.listen(port, host, () => {
  console.log(
    \`[workspace] Serving \${apps.length} app(s) at http://\${host || "localhost"}:\${port} (\${apps.map((a) => a.basePath).join(", ")})\`,
  );
});
`;
  fs.writeFileSync(path.join(distDir, "server.mjs"), server);
  console.log(
    `[workspace-deploy] Wrote Node dispatcher dist/server.mjs for ${apps.length} app(s).`,
  );
}

function writeNetlifyRedirects(distDir: string, apps: string[]): void {
  const lines: string[] = [
    "# Generated by agent-native deploy --preset netlify",
    "# Static app assets are stored under a safe namespace; dynamic app routes are handled by function route config.",
  ];

  if (apps.includes("dispatch")) {
    lines.push("/_agent-native/* /.netlify/functions/dispatch-server 200");
    lines.push("/.well-known/* /.netlify/functions/dispatch-server 200");
    const faviconAsset = dispatchRootFaviconAsset(distDir);
    if (faviconAsset) {
      lines.push(`/favicon.ico /dispatch/${faviconAsset} 302`);
    }
  }

  for (const app of apps) {
    lines.push(...netlifyAssetRedirectsFor(app, distDir));
  }

  if (apps.includes("dispatch")) {
    lines.push("/ /dispatch/overview 302");
    lines.push("/dispatch /dispatch/overview 302");
    lines.push("/dispatch/ /dispatch/overview 302");
    for (const [from, to] of DISPATCH_WORKSPACE_ROOT_REDIRECTS) {
      lines.push(`/${from} /dispatch/${to} 302`);
    }
    lines.push("/apps/* /dispatch/apps/:splat 302");
  } else {
    lines.push(`/ /${apps[0]}/ 302`);
  }

  fs.writeFileSync(path.join(distDir, "_redirects"), lines.join("\n") + "\n");
}

function writeNetlifyHeaders(distDir: string, apps: string[]): void {
  const blocks = apps.flatMap((app) => {
    const staticDir = path.join(distDir, NETLIFY_WORKSPACE_STATIC_DIR, app);
    return collectImmutableAssetPaths(staticDir).flatMap((assetPath) => [
      netlifyHeaderBlock(`/${app}${assetPath}`),
      netlifyHeaderBlock(`/${NETLIFY_WORKSPACE_STATIC_DIR}/${app}${assetPath}`),
    ]);
  });

  if (blocks.length === 0) return;
  fs.writeFileSync(path.join(distDir, "_headers"), blocks.join("\n\n") + "\n");
}

function netlifyHeaderBlock(pathname: string): string {
  return [
    pathname,
    ...Object.entries(IMMUTABLE_ASSET_CACHE_HEADERS).map(
      ([name, value]) => `  ${name}: ${value}`,
    ),
  ].join("\n");
}

function writeVercelBuildConfig(outputDir: string, apps: string[]): void {
  const routes: Array<Record<string, any>> = [
    ...vercelImmutableAssetHeaderRoutes(outputDir, apps),
    { handle: "filesystem" },
  ];

  if (apps.includes("dispatch")) {
    routes.push(
      { src: "/_agent-native", dest: "/dispatch-server" },
      { src: "/_agent-native/(.*)", dest: "/dispatch-server" },
      { src: "/\\.well-known", dest: "/dispatch-server" },
      { src: "/\\.well-known/(.*)", dest: "/dispatch-server" },
    );

    const faviconAsset = dispatchRootFaviconAsset(
      path.join(outputDir, "static"),
    );
    if (faviconAsset) {
      routes.push(vercelRedirect("/favicon.ico", `/dispatch/${faviconAsset}`));
    }

    routes.push(
      vercelRedirect("/", "/dispatch/overview"),
      vercelRedirect("/dispatch", "/dispatch/overview"),
      vercelRedirect("/dispatch/", "/dispatch/overview"),
    );
    for (const [from, to] of DISPATCH_WORKSPACE_ROOT_REDIRECTS) {
      routes.push(vercelRedirect(`/${from}`, `/dispatch/${to}`));
    }
    routes.push(vercelRedirect("/apps/(.*)", "/dispatch/apps/$1"));
  } else {
    routes.push(vercelRedirect("/", `/${apps[0]}/`));
  }

  for (const app of apps) {
    if (app !== "dispatch") {
      routes.push({ src: `/${app}`, dest: `/${app}-server` });
    }
    routes.push({ src: `/${app}/(.*)`, dest: `/${app}-server` });
  }

  const config = {
    version: 3,
    routes,
  };
  fs.writeFileSync(
    path.join(outputDir, "config.json"),
    JSON.stringify(config, null, 2) + "\n",
  );
}

function vercelImmutableAssetHeaderRoutes(
  outputDir: string,
  apps: string[],
): Array<Record<string, any>> {
  return apps.flatMap((app) => {
    const staticDir = path.join(outputDir, "static", app);
    return collectImmutableAssetPaths(staticDir).map((assetPath) => ({
      src: vercelRouteSrc(`/${app}${assetPath}`),
      headers: IMMUTABLE_ASSET_CACHE_HEADERS,
      continue: true,
    }));
  });
}

function vercelRouteSrc(pathname: string): string {
  return pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function vercelRedirect(src: string, location: string): Record<string, any> {
  return {
    src,
    status: 302,
    headers: { Location: location },
  };
}

function netlifyAssetRedirectsFor(app: string, distDir: string): string[] {
  const from = `/${app}`;
  const to = `/${NETLIFY_WORKSPACE_STATIC_DIR}/${app}`;
  return [
    `${from}/assets/* ${to}/assets/:splat 200`,
    ...netlifyPublicRootAssetPaths(
      app,
      path.join(distDir, NETLIFY_WORKSPACE_STATIC_DIR, app),
    ).map((assetPath) => {
      const assetName = assetPath.slice(from.length + 1);
      return `${assetPath} ${to}/${assetName} 200`;
    }),
  ];
}

function dispatchRootFaviconAsset(distDir: string): string | null {
  for (const asset of ["favicon.ico", "favicon.svg", "favicon.png"]) {
    if (workspaceAppAssetExists(distDir, "dispatch", asset)) return asset;
  }
  return null;
}

function workspaceAppAssetExists(
  distDir: string,
  app: string,
  asset: string,
): boolean {
  return [
    path.join(distDir, NETLIFY_WORKSPACE_STATIC_DIR, app, asset),
    path.join(distDir, app, app, asset),
    path.join(distDir, app, asset),
    // Node preset: assets live under the app's Nitro public output
    // (baseURL-nested copy first, then the root copy).
    path.join(distDir, app, "public", app, asset),
    path.join(distDir, app, "public", asset),
  ].some((candidate) => fs.existsSync(candidate));
}

const RESERVED_WORKSPACE_APP_IDS = new Set([
  "_agent-native",
  "_workspace_static",
  "netlify",
  ...DISPATCH_WORKSPACE_ROOT_REDIRECTS.map(([from]) => from),
]);

function assertNoReservedWorkspaceAppIds(apps: string[]): void {
  const conflicts = apps.filter(
    (app) => app !== "dispatch" && RESERVED_WORKSPACE_APP_IDS.has(app),
  );
  if (conflicts.length === 0) return;
  throw new Error(
    `Workspace app id ${conflicts.map((id) => `"${id}"`).join(", ")} conflicts with reserved workspace routes. Choose a different app id.`,
  );
}

function copyNetlifyFunctionIntoWorkspace(
  workspaceRoot: string,
  app: string,
  workspaceApps: WorkspaceAppManifestEntry[],
  staticDir: string,
): void {
  const appDir = path.join(workspaceRoot, "apps", app);
  const src = path.join(appDir, ".netlify", "functions-internal", "server");
  if (!fs.existsSync(src)) {
    throw new Error(
      `Expected Netlify function at ${src} after building ${app}. Check the app's build script and NITRO_PRESET.`,
    );
  }

  const dest = path.join(netlifyFunctionsDir(workspaceRoot), `${app}-server`);
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(src, dest);
  patchNetlifyFunctionEntry(dest, app, workspaceApps, staticDir);

  // Durable background agent runs (default-ON; opt out with a falsy
  // AGENT_CHAT_DURABLE_BACKGROUND). Additive ONLY: when explicitly opted out
  // this emits nothing and the single-function deploy is unchanged.
  if (isDurableBackgroundDeployEnabled()) {
    emitNetlifyBackgroundFunction(workspaceRoot, app, src, workspaceApps);
  }
}

/**
 * Deploy-time gate for emitting the second `-background` Netlify function. Reads
 * the same env flag the runtime gate uses (`AGENT_CHAT_DURABLE_BACKGROUND`).
 *
 * DEFAULT-ON, matching the runtime gate (`isFlagEnabled` in
 * durable-background.ts) and the single-template gate
 * (`isDurableBackgroundDeployEnabled` in deploy/build.ts): unset/empty/unknown
 * means enabled; an app opts OUT only with an explicit falsy value
 * (`false`/`0`/`no`/`off`). This emits the per-app 15-min `-background` function
 * so the chat `_process-run` dispatch lands on it with the real long budget.
 */
function isDurableBackgroundDeployEnabled(): boolean {
  const raw = process.env.AGENT_CHAT_DURABLE_BACKGROUND;
  if (raw == null) return true;
  const v = raw.trim().toLowerCase();
  return !(v === "0" || v === "false" || v === "no" || v === "off");
}

/**
 * Emit a SECOND Netlify function for `app` whose name ends in `-background`,
 * re-exporting the SAME `main.mjs` handler bundle. Netlify invokes any function
 * with `config.background: true` asynchronously (202 immediately, up to 15-min
 * budget), which is exactly what the durable-background chat dispatch
 * (`fireInternalDispatch` → the function's default url) needs.
 *
 * DOC-CORRECT DEFAULT-URL APPROACH (mirrors the single-template emit in
 * deploy/build.ts): the function declares NO custom `config.path`, so it keeps
 * its DEFAULT url `/.netlify/functions/<app>-agent-background`. The `<app>-server`
 * function's catch-all already excludes `/.netlify/*`, so that default-url
 * namespace is NEVER shadowed by the synchronous function — no overlapping
 * `config.path` and no catch-all patch are needed. The foreground dispatches to
 * that default url (`resolveAgentChatProcessRunDispatchPath` resolves the per-app
 * name from `AGENT_NATIVE_WORKSPACE_APP_ID`); `fireInternalDispatch` strips the
 * app base path for `/.netlify/*` targets so the request reaches the host-root
 * function url. The entry then REWRITES the incoming pathname to the
 * base-path-prefixed `_process-run` route before delegating to the Nitro router.
 *
 * It shares the same bundle (`includedFiles: ["**"]`) so `A2A_SECRET`, the DB
 * URL, and the rest of the env/bundle are present. A prior attempt gave the
 * function a custom `config.path` (the framework route) that overlapped the
 * synchronous `<app>-server` catch-all; that path was not honored as a route in
 * prod (probe → 404). The default url is the doc-correct fix.
 *
 * Safety net: if the dispatch fast-fails the foreground degrades to an inline
 * 40s synchronous run (see production-agent.ts).
 */
function emitNetlifyBackgroundFunction(
  workspaceRoot: string,
  app: string,
  srcServerDir: string,
  workspaceApps: WorkspaceAppManifestEntry[],
): void {
  // Name MUST end in `-background` (Netlify async convention + the runtime guard
  // reads the -background Lambda-name suffix as a fallback). It is reached at its
  // DEFAULT url /.netlify/functions/<app>-agent-background.
  const backgroundName = `${app}-agent-background`;
  const dest = path.join(netlifyFunctionsDir(workspaceRoot), backgroundName);
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(srcServerDir, dest);

  const basePath = `/${app}`;
  const workspaceAppAudience = workspaceAppAudienceForApp(workspaceApps, app);
  const workspaceAppRouteAccess = workspaceAppRouteAccessForApp(
    workspaceApps,
    app,
  );
  // The Nitro router for this app expects the base-path-prefixed framework route.
  // The function is reached at its default url, so the entry rewrites the
  // incoming pathname to `/<app>/_agent-native/agent-chat/_process-run`.
  const processRunPath = `${basePath}${AGENT_CHAT_PROCESS_RUN_PATH}`;
  const a2aProcessTaskPath = `${basePath}/_agent-native/a2a/_process-task`;
  const server = `// Mark this isolate as the durable background runtime BEFORE the handler bundle
// is imported, so isInBackgroundFunctionRuntime() reliably returns true in this
// function (the deployed Lambda name is not guaranteed to end in -background). A
// globalThis flag (NOT process.env) avoids the no-env-mutation guard and carries
// no cross-request state.
globalThis.__AGENT_NATIVE_BACKGROUND_RUNTIME__ = true;

const basePath = ${JSON.stringify(basePath)};
// The base-path-prefixed framework route the Nitro router dispatches to.
const PROCESS_RUN_PATH = ${JSON.stringify(processRunPath)};
const A2A_PROCESS_TASK_PATH = ${JSON.stringify(a2aProcessTaskPath)};
const BACKGROUND_PROCESSOR_FIELD = ${JSON.stringify(AGENT_BACKGROUND_PROCESSOR_FIELD)};
const BACKGROUND_PROCESSOR_A2A = ${JSON.stringify(AGENT_BACKGROUND_PROCESSOR_A2A)};
const BACKGROUND_PROCESSOR_ROUTE = ${JSON.stringify(AGENT_BACKGROUND_PROCESSOR_ROUTE)};
const BACKGROUND_PROCESSOR_ROUTE_FIELD = ${JSON.stringify(AGENT_BACKGROUND_PROCESSOR_ROUTE_FIELD)};

function processorPathFromBody(body) {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body);
    if (parsed?.[BACKGROUND_PROCESSOR_FIELD] === BACKGROUND_PROCESSOR_A2A) {
      return A2A_PROCESS_TASK_PATH;
    }
    const route = parsed?.[BACKGROUND_PROCESSOR_ROUTE_FIELD];
    if (
      parsed?.[BACKGROUND_PROCESSOR_FIELD] === BACKGROUND_PROCESSOR_ROUTE &&
      typeof route === "string" &&
      route.startsWith(basePath + "/api/_agent-native-background/") &&
      !route.includes("?") &&
      !route.includes("#")
    ) {
      return route;
    }
    return null;
  } catch {
    return null;
  }
}

function setBasePathEnv() {
  const processRef = globalThis.process ??= { env: {} };
  processRef.env ??= {};
  Object.assign(processRef.env, {
    AGENT_NATIVE_WORKSPACE: "1",
    AGENT_NATIVE_WORKSPACE_APP_ID: ${JSON.stringify(app)},
    APP_BASE_PATH: basePath,
    AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: ${JSON.stringify(workspaceAppAudience)},
    AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.publicPaths))},
    AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.protectedPaths))},
    VITE_AGENT_NATIVE_WORKSPACE: "1",
    VITE_AGENT_NATIVE_WORKSPACE_APP_ID: ${JSON.stringify(app)},
    VITE_APP_BASE_PATH: basePath,
    VITE_AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: ${JSON.stringify(workspaceAppAudience)},
    VITE_AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.publicPaths))},
    VITE_AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.protectedPaths))},
    VITE_AGENT_NATIVE_WORKSPACE_APPS_JSON: ${JSON.stringify(JSON.stringify(workspaceApps))},
    ${JSON.stringify(WORKSPACE_APPS_ENV_KEY)}: ${JSON.stringify(JSON.stringify(workspaceApps))},
  });
}

setBasePathEnv();

let cachedHandler;

// Reached at the DEFAULT url /.netlify/functions/${backgroundName}; REWRITE the
// incoming pathname to the base-path-prefixed _process-run route so the Nitro
// router runs the plugin. Method, ALL headers (the HMAC Authorization: Bearer
// MUST survive) and the body are preserved.
export default async function handler(request) {
  setBasePathEnv();
  cachedHandler ??= (await import("./main.mjs")).default;
  const url = new URL(request.url);
  const method = request.method || "POST";
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;
  url.pathname = processorPathFromBody(body) || PROCESS_RUN_PATH;
  const rewritten = new Request(url.toString(), {
    method,
    headers: request.headers,
    body,
  });
  return cachedHandler(rewritten);
}

export const config = {
  name: ${JSON.stringify(`${app} agent background handler`)},
  generator: "agent-native workspace deploy",
  // background: true → async invoke (202, 15-min budget). NO custom path: the
  // function keeps its default url /.netlify/functions/${backgroundName}, which
  // the <app>-server catch-all never shadows (it excludes /.netlify/*).
  background: true,
  nodeBundler: "none",
  includedFiles: ["**"],
  preferStatic: false,
};
`;
  // Remove the original Nitro entry (server.mjs) so only our background entry
  // is the function entrypoint, mirroring patchNetlifyFunctionEntry.
  fs.rmSync(path.join(dest, "server.mjs"), { force: true });
  fs.writeFileSync(path.join(dest, `${backgroundName}.mjs`), server);
  console.log(
    `[workspace-deploy] Emitted durable-background function "${backgroundName}" ` +
      `for app "${app}" with config { background:true } and NO custom path — ` +
      `reachable at its default url /.netlify/functions/${backgroundName} ` +
      `(rewrites to ${processRunPath}). REQUIRES real-deploy verification of ` +
      `Netlify async (202) invocation — see docs/design/durable-agent-runs.md.`,
  );
}

function patchNetlifyFunctionEntry(
  functionDir: string,
  app: string,
  workspaceApps: WorkspaceAppManifestEntry[],
  staticDir: string,
): void {
  const serverPath = path.join(functionDir, "server.mjs");
  if (!fs.existsSync(serverPath)) return;

  const basePath = `/${app}`;
  const workspaceAppAudience = workspaceAppAudienceForApp(workspaceApps, app);
  const workspaceAppRouteAccess = workspaceAppRouteAccessForApp(
    workspaceApps,
    app,
  );
  const pathConfig =
    app === "dispatch"
      ? ["/_agent-native/*", "/.well-known/*", `${basePath}/*`]
      : [basePath, `${basePath}/*`];
  const normalizeBasePathHelper =
    app === "dispatch"
      ? ""
      : `
function normalizeBasePathArgs(args) {
  const request = args[0];
  if (!request || typeof request.url !== "string" || typeof Request !== "function") {
    return args;
  }
  const url = new URL(request.url);
  if (url.pathname === basePath || url.pathname === \`\${basePath}/\`) {
    url.pathname = \`\${basePath}//\`;
    return [new Request(url, request), ...args.slice(1)];
  }
  return args;
}
`;
  const handlerArgs =
    app === "dispatch" ? "...args" : "...normalizeBasePathArgs(args)";
  const server = `const basePath = ${JSON.stringify(basePath)};

function setBasePathEnv() {
  const processRef = globalThis.process ??= { env: {} };
  processRef.env ??= {};
  Object.assign(processRef.env, {
    AGENT_NATIVE_WORKSPACE: "1",
    AGENT_NATIVE_WORKSPACE_APP_ID: ${JSON.stringify(app)},
    APP_BASE_PATH: basePath,
    AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: ${JSON.stringify(workspaceAppAudience)},
    AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.publicPaths))},
    AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.protectedPaths))},
    VITE_AGENT_NATIVE_WORKSPACE: "1",
    VITE_AGENT_NATIVE_WORKSPACE_APP_ID: ${JSON.stringify(app)},
    VITE_APP_BASE_PATH: basePath,
    VITE_AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: ${JSON.stringify(workspaceAppAudience)},
    VITE_AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.publicPaths))},
    VITE_AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.protectedPaths))},
    VITE_AGENT_NATIVE_WORKSPACE_APPS_JSON: ${JSON.stringify(JSON.stringify(workspaceApps))},
    ${JSON.stringify(WORKSPACE_APPS_ENV_KEY)}: ${JSON.stringify(JSON.stringify(workspaceApps))},
  });
}

setBasePathEnv();
${normalizeBasePathHelper}

let cachedHandler;

export default async function handler(...args) {
  setBasePathEnv();
  cachedHandler ??= (await import("./main.mjs")).default;
  return cachedHandler(${handlerArgs});
}

export const config = {
  name: ${JSON.stringify(`${app} server handler`)},
  generator: "agent-native workspace deploy",
  path: ${JSON.stringify(pathConfig)},
  nodeBundler: "none",
  includedFiles: ["**"],
  excludedPath: ${JSON.stringify(
    netlifyFunctionExcludedPaths(app, staticDir),
    null,
    2,
  )
    .split("\n")
    .join("\n  ")},
  preferStatic: false,
};
`;
  fs.rmSync(serverPath, { force: true });
  fs.writeFileSync(path.join(functionDir, `${app}-server.mjs`), server);
}

function patchVercelFunctionEntry(
  functionDir: string,
  app: string,
  workspaceApps: WorkspaceAppManifestEntry[],
): void {
  const entryPath = path.join(functionDir, "index.mjs");
  if (!fs.existsSync(entryPath)) return;

  const mainPath = path.join(functionDir, "main.mjs");
  fs.rmSync(mainPath, { force: true });
  fs.renameSync(entryPath, mainPath);

  const basePath = `/${app}`;
  const workspaceAppAudience = workspaceAppAudienceForApp(workspaceApps, app);
  const workspaceAppRouteAccess = workspaceAppRouteAccessForApp(
    workspaceApps,
    app,
  );
  const entry = `const basePath = ${JSON.stringify(basePath)};

function setBasePathEnv() {
  const processRef = globalThis.process ??= { env: {} };
  processRef.env ??= {};
  Object.assign(processRef.env, {
    AGENT_NATIVE_WORKSPACE: "1",
    AGENT_NATIVE_WORKSPACE_APP_ID: ${JSON.stringify(app)},
    APP_BASE_PATH: basePath,
    AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: ${JSON.stringify(workspaceAppAudience)},
    AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.publicPaths))},
    AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.protectedPaths))},
    VITE_AGENT_NATIVE_WORKSPACE: "1",
    VITE_AGENT_NATIVE_WORKSPACE_APP_ID: ${JSON.stringify(app)},
    VITE_APP_BASE_PATH: basePath,
    VITE_AGENT_NATIVE_WORKSPACE_APP_AUDIENCE: ${JSON.stringify(workspaceAppAudience)},
    VITE_AGENT_NATIVE_WORKSPACE_APP_PUBLIC_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.publicPaths))},
    VITE_AGENT_NATIVE_WORKSPACE_APP_PROTECTED_PATHS: ${JSON.stringify(JSON.stringify(workspaceAppRouteAccess.protectedPaths))},
    VITE_AGENT_NATIVE_WORKSPACE_APPS_JSON: ${JSON.stringify(JSON.stringify(workspaceApps))},
    ${JSON.stringify(WORKSPACE_APPS_ENV_KEY)}: ${JSON.stringify(JSON.stringify(workspaceApps))},
  });
}

function normalizeBasePathArgs(args) {
  const request = args[0];
  if (!request) return args;

  if (typeof Request === "function" && request instanceof Request) {
    const url = new URL(request.url);
    if (url.pathname === basePath || url.pathname === \`\${basePath}/\`) {
      url.pathname = \`\${basePath}//\`;
      return [new Request(url, request), ...args.slice(1)];
    }
    return args;
  }

  if (typeof request.url !== "string") return args;
  const url = new URL(request.url, "http://agent-native.local");
  if (url.pathname === basePath || url.pathname === \`\${basePath}/\`) {
    request.url = \`\${basePath}//\${url.search}\`;
  }
  return args;
}

setBasePathEnv();

let cachedHandler;

export default async function handler(...args) {
  setBasePathEnv();
  cachedHandler ??= (await import("./main.mjs")).default;
  return cachedHandler(...normalizeBasePathArgs(args));
}
`;
  fs.writeFileSync(entryPath, entry);
}

function netlifyFunctionExcludedPaths(
  app: string,
  staticDir: string,
): string[] {
  return [
    "/.netlify/*",
    `/${app}/assets/*`,
    ...netlifyPublicRootAssetPaths(app, staticDir),
  ];
}

function netlifyPublicRootAssetPaths(app: string, staticDir: string): string[] {
  if (!fs.existsSync(staticDir)) return [];
  return fs
    .readdirSync(staticDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => {
      const ext = path.extname(name).slice(1).toLowerCase();
      return NETLIFY_PUBLIC_ASSET_EXTENSIONS.has(ext);
    })
    .sort()
    .map((name) => `/${app}/${encodeURI(name)}`);
}

function netlifyFunctionsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, ".netlify", "functions-internal");
}

/** The per-app build env is `{...process.env, ...computed}` — only the
 * computed delta belongs in the cache key (ambient env is covered by the
 * cache module's own prefix filter, machine noise like PATH stays out). */
function buildCacheEnvDelta(
  env: NodeJS.ProcessEnv,
): Record<string, string | undefined> {
  const delta: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] !== value) delta[key] = value;
  }
  return delta;
}

function cleanAppBuildOutputs(appDir: string): void {
  // .deploy-tmp: a crashed prior per-app build leaves partial artifacts that
  // silently poison the next build for that app (observed on Windows: stale
  // state made a cloudflare_pages build die after the vite phases with no
  // error output). The deploy post-build also sweeps it, but clean here too
  // so the unified build never depends on the child's hygiene.
  for (const name of ["dist", ".output", "build", ".deploy-tmp"]) {
    fs.rmSync(path.join(appDir, name), { recursive: true, force: true });
  }
  fs.rmSync(path.join(appDir, ".netlify", "functions-internal"), {
    recursive: true,
    force: true,
  });
  fs.rmSync(path.join(appDir, ".vercel", "output"), {
    recursive: true,
    force: true,
  });
}

function appUsesNetlifyUnpooledDatabaseUrl(appDir: string): boolean {
  const netlifyPath = path.join(appDir, "netlify.toml");
  if (!fs.existsSync(netlifyPath)) return false;
  try {
    return fs
      .readFileSync(netlifyPath, "utf-8")
      .includes("NETLIFY_DATABASE_URL_UNPOOLED");
  } catch {
    return false;
  }
}

function writeWorkspaceAppManifests(
  workspaceRoot: string,
  distDir: string,
  apps: string[],
  workspaceApps: WorkspaceAppManifestEntry[],
  preset: WorkspaceDeployPreset,
): void {
  const manifest = JSON.stringify(
    {
      version: 1,
      apps: workspaceApps,
    },
    null,
    2,
  );

  const targets =
    preset === "netlify"
      ? apps.map((app) =>
          path.join(
            netlifyFunctionsDir(workspaceRoot),
            `${app}-server`,
            WORKSPACE_APPS_MANIFEST_DIR,
            WORKSPACE_APPS_MANIFEST_FILE,
          ),
        )
      : preset === "vercel"
        ? apps.map((app) =>
            path.join(
              workspaceRoot,
              VERCEL_OUTPUT_DIR,
              "functions",
              `${app}-server.func`,
              WORKSPACE_APPS_MANIFEST_DIR,
              WORKSPACE_APPS_MANIFEST_FILE,
            ),
          )
        : apps.map((app) =>
            path.join(
              distDir,
              app,
              WORKSPACE_APPS_MANIFEST_DIR,
              WORKSPACE_APPS_MANIFEST_FILE,
            ),
          );

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${manifest}\n`);
  }
}

function readWorkspaceAppManifest(
  workspaceRoot: string,
  apps: string[],
): WorkspaceAppManifestEntry[] {
  const explicitApps = readExistingWorkspaceAppManifest(workspaceRoot);

  return apps
    .map((app) => {
      const appDir = path.join(workspaceRoot, "apps", app);
      const pkg = readPackageJson(path.join(appDir, "package.json"));
      const appPath = `/${app}`;
      const explicit = explicitApps.get(app);
      const url =
        normalizeWorkspaceAppUrl(explicit?.url) ?? workspaceAppUrl(appPath);
      const audience =
        workspaceAppAudienceFromPackageJson(pkg) ??
        explicit?.audience ??
        DEFAULT_WORKSPACE_APP_AUDIENCE;
      const packageRouteAccess = workspaceAppRouteAccessFromPackageJson(pkg);
      // Prefer the package.json value whenever the field was set — including
      // an explicit empty array, which is how a per-app package.json signals
      // "clear any previously-published manifest override." Falling back on
      // length > 0 would silently keep the explicit override even after the
      // app owner blanked their list.
      const publicPaths =
        packageRouteAccess.publicPaths ?? explicit?.publicPaths ?? [];
      const protectedPaths =
        packageRouteAccess.protectedPaths ?? explicit?.protectedPaths ?? [];
      return {
        id: app,
        name: pkg?.displayName || titleCase(app),
        description: pkg?.description || "",
        path: appPath,
        ...(url ? { url } : {}),
        isDispatch: app === "dispatch",
        audience,
        publicPaths,
        protectedPaths,
      };
    })
    .sort((a, b) => {
      if (a.id === "dispatch") return -1;
      if (b.id === "dispatch") return 1;
      return a.name.localeCompare(b.name);
    });
}

function readExistingWorkspaceAppManifest(
  workspaceRoot: string,
): Map<string, WorkspaceAppManifestOverride> {
  const fromEnv = parseWorkspaceAppsJson(process.env[WORKSPACE_APPS_ENV_KEY]);
  const fromFile =
    readWorkspaceAppsFromFile(
      path.join(
        workspaceRoot,
        WORKSPACE_APPS_MANIFEST_DIR,
        WORKSPACE_APPS_MANIFEST_FILE,
      ),
    ) ??
    readWorkspaceAppsFromFile(
      path.join(workspaceRoot, WORKSPACE_APPS_MANIFEST_FILE),
    );
  const apps = fromEnv ?? fromFile ?? [];
  return new Map(apps.map((app) => [app.id, app]));
}

function parseWorkspaceAppsJson(
  raw: string | undefined,
): WorkspaceAppManifestOverride[] | null {
  if (!raw) return null;
  try {
    return parseWorkspaceAppsManifest(JSON.parse(raw));
  } catch {
    return null;
  }
}

function readWorkspaceAppsFromFile(
  file: string,
): WorkspaceAppManifestOverride[] | null {
  if (!fs.existsSync(file)) return null;
  return parseWorkspaceAppsManifest(readPackageJson(file));
}

function parseWorkspaceAppsManifest(
  parsed: any,
): WorkspaceAppManifestOverride[] | null {
  const rawApps = Array.isArray(parsed?.apps)
    ? parsed.apps
    : Array.isArray(parsed)
      ? parsed
      : null;
  if (!rawApps) return null;

  const apps = (rawApps as unknown[])
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Record<string, unknown>;
      const id = typeof e.id === "string" ? e.id.trim() : "";
      if (!id) return null;
      const url = normalizeWorkspaceAppUrl(e.url);
      const audience =
        e.audience === undefined
          ? undefined
          : normalizeWorkspaceAppAudience(e.audience);
      const publicPaths = normalizeWorkspaceAppPathList(e.publicPaths);
      const protectedPaths = normalizeWorkspaceAppPathList(e.protectedPaths);
      return {
        id,
        ...(url ? { url } : {}),
        ...(audience ? { audience } : {}),
        ...(publicPaths.length > 0 ? { publicPaths } : {}),
        ...(protectedPaths.length > 0 ? { protectedPaths } : {}),
      };
    })
    .filter((app): app is NonNullable<typeof app> => !!app);

  return apps.length ? apps : null;
}

function workspaceBaseUrl(): string | null {
  const gatewayOrigin =
    process.env.WORKSPACE_GATEWAY_URL || process.env.VITE_WORKSPACE_GATEWAY_URL;
  const publicGatewayOrigin = normalizeOrigin(gatewayOrigin);
  const gatewayFallback =
    publicGatewayOrigin && !isLoopbackOrigin(publicGatewayOrigin)
      ? gatewayOrigin
      : null;
  return (
    process.env.APP_URL ||
    process.env.WORKSPACE_OAUTH_ORIGIN ||
    process.env.VITE_WORKSPACE_OAUTH_ORIGIN ||
    process.env.URL ||
    process.env.DEPLOY_URL ||
    process.env.BETTER_AUTH_URL ||
    gatewayFallback ||
    gatewayOrigin ||
    null
  );
}

function normalizeOrigin(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function isLoopbackOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host === "::1"
    );
  } catch {
    return false;
  }
}

function workspaceOAuthOrigin(
  workspaceGatewayUrl: string | null,
): string | undefined {
  // Explicit overrides (env vars set by the operator) win even if they happen
  // to be loopback — that's a deliberate dev-against-prod choice.
  // The gateway-URL fallback, however, is auto-resolved and would silently
  // send users to localhost if the configured gateway is loopback in a
  // production deploy. Strip loopback there so OAuth fails loudly instead.
  const gatewayFallback = normalizeOrigin(workspaceGatewayUrl);
  return (
    normalizeOrigin(process.env.VITE_WORKSPACE_OAUTH_ORIGIN) ||
    normalizeOrigin(process.env.WORKSPACE_OAUTH_ORIGIN) ||
    normalizeOrigin(process.env.APP_URL) ||
    normalizeOrigin(process.env.BETTER_AUTH_URL) ||
    normalizeOrigin(process.env.URL) ||
    normalizeOrigin(process.env.DEPLOY_URL) ||
    (isLoopbackOrigin(gatewayFallback) ? undefined : gatewayFallback)
  );
}

function workspaceAppUrl(appPath: string): string | undefined {
  const base = workspaceBaseUrl();
  if (!base) return undefined;
  try {
    return new URL(appPath, `${base.replace(/\/$/, "")}/`).toString();
  } catch {
    return undefined;
  }
}

function normalizeWorkspaceAppUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    return new URL(value.trim()).toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

function readPackageJson(file: string): Record<string, any> | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parsePresetArg(args: string[]): WorkspaceDeployPreset | null {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--preset" && args[i + 1]) {
      return normalizePreset(args[i + 1]);
    }
    if (arg.startsWith("--preset=")) {
      return normalizePreset(arg.slice("--preset=".length));
    }
  }
  return null;
}

function resolvePreset(
  optionPreset: WorkspaceDeployPreset | undefined,
  args: string[],
): WorkspaceDeployPreset {
  return (
    optionPreset ??
    parsePresetArg(args) ??
    normalizePreset(process.env.NITRO_PRESET) ??
    "cloudflare_pages"
  );
}

function assertWorkspaceDeployProductionEnv(opts: {
  buildOnly: boolean;
  preset: WorkspaceDeployPreset;
}): void {
  if (!isProductionWorkspaceDeploy(opts)) return;
  if (process.env.A2A_SECRET?.trim()) return;
  const providerHint =
    opts.preset === "netlify"
      ? ' For Netlify, one option is: netlify env:set A2A_SECRET "$(openssl rand -hex 32)".'
      : "";
  throw new Error(
    [
      "A2A_SECRET is required for production workspace deploys.",
      "Workspace Slack, webhook, and cross-app A2A work resumes through signed background processors; without A2A_SECRET those production routes return 503.",
      `Set A2A_SECRET in your deploy provider and redeploy.${providerHint}`,
      "For local artifact checks, run agent-native deploy --build-only outside the deploy provider environment.",
    ].join(" "),
  );
}

function isProductionWorkspaceDeploy(opts: {
  buildOnly: boolean;
  preset: WorkspaceDeployPreset;
}): boolean {
  if (!opts.buildOnly) return true;
  if (
    opts.preset === "netlify" &&
    process.env.NETLIFY === "true" &&
    process.env.NETLIFY_LOCAL !== "true"
  ) {
    return true;
  }
  if (opts.preset === "cloudflare_pages" && process.env.CF_PAGES === "1") {
    return true;
  }
  if (opts.preset === "vercel" && process.env.VERCEL === "1") {
    return true;
  }
  return false;
}

function normalizePreset(
  value: string | undefined,
): WorkspaceDeployPreset | null {
  if (!value) return null;
  if (value === "cloudflare_pages" || value === "cloudflare-pages") {
    return "cloudflare_pages";
  }
  if (value === "netlify") return "netlify";
  if (value === "vercel") return "vercel";
  if (value === "node") return "node";
  throw new Error(
    `Unsupported workspace deploy preset "${value}". Supported presets: cloudflare_pages, netlify, vercel, node.`,
  );
}

function moduleIdent(app: string): string {
  return "app_" + app.replace(/[^a-zA-Z0-9_]/g, "_");
}

function workspaceAppAudienceForApp(
  workspaceApps: WorkspaceAppManifestEntry[],
  app: string,
): WorkspaceAppAudience {
  return (
    workspaceApps.find((entry) => entry.id === app)?.audience ??
    DEFAULT_WORKSPACE_APP_AUDIENCE
  );
}

function workspaceAppRouteAccessForApp(
  workspaceApps: WorkspaceAppManifestEntry[],
  app: string,
): WorkspaceAppRouteAccess {
  const entry = workspaceApps.find((candidate) => candidate.id === app);
  return {
    publicPaths: entry?.publicPaths ?? [],
    protectedPaths: entry?.protectedPaths ?? [],
  };
}

function compareWorkspaceAppIds(a: string, b: string): number {
  if (a === "dispatch") return -1;
  if (b === "dispatch") return 1;
  return a.localeCompare(b);
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isSymbolicLink()) {
      try {
        const target = fs.readlinkSync(s);
        fs.symlinkSync(target, d);
      } catch {
        fs.copyFileSync(s, d);
      }
    } else if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
