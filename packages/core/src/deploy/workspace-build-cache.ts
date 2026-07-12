/**
 * Content-hash build cache for `agent-native deploy` workspace builds.
 *
 * Rebuilding every app on every workspace deploy is pure waste when only a
 * few apps changed. Each app's build is a deterministic function of:
 *
 *   1. The app directory's source files (excluding build outputs + deps).
 *   2. The workspace-local packages it depends on via `workspace:*`.
 *   3. The root lockfile (captures every registry dependency version,
 *      including the framework runtime itself).
 *   4. The environment the build is invoked with: the deploy preset, the
 *      computed per-app env block (base path, audience, workspace manifest,
 *      gateway URL, ...) and any ambient env Vite/Nitro can bake into the
 *      bundle (`VITE_*`, `AGENT_NATIVE_*`, `WORKSPACE_*`, ...).
 *   5. The version of this package doing the building.
 *
 * When all of that is byte-identical to the previous run AND the app's
 * previous build output still exists on disk, the build is skipped and the
 * existing output is reused. The workspace output assembly (copy into
 * dist/, manifests, dedupe, routing) always runs fresh — it is cheap and
 * keeps the artifact deterministic.
 *
 * Safety posture: a false MISS costs one redundant rebuild; a false HIT
 * ships a stale artifact. Every choice below prefers false misses — full
 * content hashing (no mtimes), lockfile-wide invalidation, and the entire
 * invocation env block folded into the key.
 *
 * Opt out with `--no-build-cache` or AGENT_NATIVE_WORKSPACE_BUILD_CACHE=0.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";

/** Directories inside an app that are build outputs or dependencies — never
 * build inputs. Everything else in the app dir participates in the hash. */
const EXCLUDED_APP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".output",
  ".deploy-tmp",
  ".netlify",
  ".vercel",
  ".react-router",
  ".cache",
  ".turbo",
  ".git",
]);

/** Ambient process.env prefixes that can be baked into app bundles. */
const ENV_PREFIXES = ["VITE_", "AGENT_NATIVE_", "WORKSPACE_", "NETLIFY_"];
const ENV_EXACT_KEYS = [
  "APP_URL",
  "BETTER_AUTH_URL",
  "DATABASE_URL",
  "NITRO_PRESET",
  "NODE_ENV",
];

const STAMP_DIR = path.join("node_modules", ".cache", "agent-native");
const STAMP_FILE = "workspace-build.json";

export interface WorkspaceBuildCacheOptions {
  workspaceRoot: string;
  appDir: string;
  app: string;
  preset: string;
  /** The exact env block the app build is invoked with (delta over
   * process.env computed by the deploy orchestrator). */
  buildEnv: Record<string, string | undefined>;
  /** Version of the framework package performing the build. */
  builderVersion: string;
}

export function isWorkspaceBuildCacheEnabled(rawArgs: string[]): boolean {
  if (rawArgs.includes("--no-build-cache")) return false;
  const env = process.env.AGENT_NATIVE_WORKSPACE_BUILD_CACHE;
  if (env === "0" || env === "false") return false;
  return true;
}

/** Compute the cache key for one app build. Returns null when hashing is not
 * possible (treat as cache miss — never as a hit). */
export function computeWorkspaceAppBuildHash(
  opts: WorkspaceBuildCacheOptions,
): string | null {
  try {
    const hash = crypto.createHash("sha256");
    hash.update(`builder:${opts.builderVersion}\0`);
    hash.update(`preset:${opts.preset}\0`);

    // 1. App sources.
    hashDirInto(hash, opts.appDir, opts.appDir);

    // 2. workspace:* dependency packages (source-level inputs the lockfile
    //    does not pin).
    for (const depDir of resolveWorkspaceDepDirs(
      opts.workspaceRoot,
      opts.appDir,
    )) {
      hash.update(`workspace-dep:${path.basename(depDir)}\0`);
      hashDirInto(hash, depDir, depDir);
    }

    // 3. Root lockfile — pins every registry dependency (framework runtime
    //    included), so a core bump or any dep change invalidates all apps.
    for (const lock of ["pnpm-lock.yaml", "package-lock.json", "yarn.lock"]) {
      const lockPath = path.join(opts.workspaceRoot, lock);
      if (fs.existsSync(lockPath)) {
        hash.update(`lock:${lock}\0`);
        hash.update(fs.readFileSync(lockPath));
        hash.update("\0");
      }
    }

    // 4. Invocation env: the computed per-app block plus ambient bakeable
    //    env. Values are hashed, never stored.
    const envEntries: string[] = [];
    for (const [key, value] of Object.entries(opts.buildEnv)) {
      if (value !== undefined) envEntries.push(`${key}=${value}`);
    }
    for (const [key, value] of Object.entries(process.env)) {
      if (value === undefined) continue;
      if (key in opts.buildEnv) continue; // computed block wins
      const relevant =
        ENV_EXACT_KEYS.includes(key) ||
        ENV_PREFIXES.some((p) => key.startsWith(p));
      if (relevant) envEntries.push(`${key}=${value}`);
    }
    envEntries.sort();
    hash.update(`env:${envEntries.join("\n")}\0`);

    return hash.digest("hex");
  } catch {
    return null;
  }
}

/** True when the app's previous build can be reused as-is. */
export function workspaceAppBuildCacheHit(
  opts: WorkspaceBuildCacheOptions,
  hashValue: string | null,
): boolean {
  if (!hashValue) return false;
  const stamp = readStamp(opts.appDir);
  if (!stamp || stamp.hash !== hashValue || stamp.preset !== opts.preset) {
    return false;
  }
  return requiredOutputsExist(opts.appDir, opts.preset);
}

/** Record a successful build so the next identical run can skip it. */
export function writeWorkspaceAppBuildStamp(
  opts: WorkspaceBuildCacheOptions,
  hashValue: string | null,
): void {
  if (!hashValue) return;
  try {
    const dir = path.join(opts.appDir, STAMP_DIR);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, STAMP_FILE),
      JSON.stringify(
        {
          hash: hashValue,
          preset: opts.preset,
          builderVersion: opts.builderVersion,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  } catch {
    // Best-effort: a missing stamp only costs a rebuild next time.
  }
}

function readStamp(
  appDir: string,
): { hash: string; preset: string } | null {
  try {
    const raw = fs.readFileSync(
      path.join(appDir, STAMP_DIR, STAMP_FILE),
      "utf-8",
    );
    const parsed = JSON.parse(raw) as { hash?: unknown; preset?: unknown };
    if (typeof parsed.hash !== "string" || typeof parsed.preset !== "string") {
      return null;
    }
    return { hash: parsed.hash, preset: parsed.preset };
  } catch {
    return null;
  }
}

function requiredOutputsExist(appDir: string, preset: string): boolean {
  if (preset === "vercel") {
    return fs.existsSync(path.join(appDir, ".vercel", "output"));
  }
  const buildOut =
    fs.existsSync(path.join(appDir, "dist")) ||
    fs.existsSync(path.join(appDir, ".output"));
  if (!buildOut) return false;
  if (preset === "netlify") {
    return fs.existsSync(
      path.join(appDir, ".netlify", "functions-internal", "server"),
    );
  }
  return true;
}

/** Deterministically hash every build-input file under `dir`. */
function hashDirInto(
  hash: crypto.Hash,
  dir: string,
  rootDir: string,
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name.startsWith(".DS_")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dir === rootDir && EXCLUDED_APP_DIRS.has(entry.name)) continue;
      // Nested node_modules (e.g. inside checked-in fixtures) are still deps.
      if (entry.name === "node_modules") continue;
      hashDirInto(hash, full, rootDir);
    } else if (entry.isFile()) {
      const rel = path.relative(rootDir, full).split(path.sep).join("/");
      hash.update(`f:${rel}\0`);
      try {
        hash.update(fs.readFileSync(full));
      } catch {
        hash.update("<unreadable>");
      }
      hash.update("\0");
    }
    // Symlinks and other entry types are skipped: their targets are either
    // covered elsewhere (workspace deps) or not build inputs.
  }
}

/** Resolve the app's `workspace:*` dependencies to their package dirs. */
function resolveWorkspaceDepDirs(
  workspaceRoot: string,
  appDir: string,
): string[] {
  const dirs: string[] = [];
  let pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  try {
    pkg = JSON.parse(
      fs.readFileSync(path.join(appDir, "package.json"), "utf-8"),
    );
  } catch {
    return dirs;
  }
  const workspaceDepNames = Object.entries({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  })
    .filter(([, spec]) => typeof spec === "string" && spec.startsWith("workspace:"))
    .map(([name]) => name);
  if (workspaceDepNames.length === 0) return dirs;

  const packagesDir = path.join(workspaceRoot, "packages");
  let candidates: string[] = [];
  try {
    candidates = fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(packagesDir, e.name));
  } catch {
    return dirs;
  }
  const byName = new Map<string, string>();
  for (const candidate of candidates) {
    try {
      const name = (
        JSON.parse(
          fs.readFileSync(path.join(candidate, "package.json"), "utf-8"),
        ) as { name?: string }
      ).name;
      if (typeof name === "string") byName.set(name, candidate);
    } catch {
      // skip unreadable packages
    }
  }
  for (const depName of workspaceDepNames.sort()) {
    const dir = byName.get(depName);
    if (dir) dirs.push(dir);
    // Unresolvable workspace deps fall back to lockfile coverage; the sorted
    // dep-name list itself is not hashed separately because package.json is
    // already part of the app-source hash.
  }
  return dirs;
}
