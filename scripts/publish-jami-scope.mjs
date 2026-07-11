// Publish the six publishable packages under the @jami-studio npm scope
// WITHOUT touching repo source: the @agent-native/* names stay canonical in
// git (keeps ~70 workspace: refs and the upstream source-sync cheap); the
// scope rename happens only in the manifest that ships inside each tarball.
//
// Per package (dep order: toolkit, core, skills, dispatch, scheduling, pinpoint):
//   1. pnpm --filter <name> run build
//   2. rewrite package.json: name -> @jami-studio/<p>; workspace: deps on
//      sibling packages -> "npm:@jami-studio/<sib>@^<version>" aliases so the
//      published package still resolves its @agent-native/* import specifiers
//      to our packages. peerDependencies stay named @agent-native/* on purpose:
//      consumers install that name as an alias, which satisfies the peer range.
//   3. npm publish --access public --ignore-scripts (builds already ran;
//      prepack scripts use unix `cp`, which breaks on Windows)
//   4. restore the original package.json (always, even on failure)
//
// Usage: node scripts/publish-jami-scope.mjs [--dry-run] [--only=core,toolkit]

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORDER = ["toolkit", "core", "skills", "dispatch", "scheduling", "pinpoint"];
const FROM = "@agent-native/";
const TO = "@jami-studio/";

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice(7).split(",") : null;

const env = { ...process.env };
delete env.NODE_OPTIONS; // repo scripts rely on native TS strip; never inherit the hummingbird flag

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}  (in ${path.relative(ROOT, cwd) || "."})`);
  execSync(cmd, { cwd, env, stdio: "inherit" });
}

function readManifest(pkg) {
  const file = path.join(ROOT, "packages", pkg, "package.json");
  return { file, raw: fs.readFileSync(file, "utf8") };
}

// --- Failure-path hardening -------------------------------------------------
// The rewrite window (manifest renamed to @jami-studio/*) must never survive
// the process: a Ctrl-C / crash between the rewrite and the finally-restore
// once left packages/core/package.json renamed, which broke the next
// `changeset version` ("not in the workspace"). Two layers:
//   1. A sidecar backup (`package.json.jami-publish-backup`) written before
//      every rewrite and removed after restore. Any run STARTS by restoring
//      stale backups left by a killed run (self-heal).
//   2. exit/SIGINT/SIGTERM hooks restore any outstanding backup immediately.
const BACKUP_SUFFIX = ".jami-publish-backup";
const outstanding = new Map(); // file -> raw

function backupPath(file) {
  return file + BACKUP_SUFFIX;
}

function beginRewrite(file, raw) {
  fs.writeFileSync(backupPath(file), raw);
  outstanding.set(file, raw);
}

function endRewrite(file, raw) {
  fs.writeFileSync(file, raw);
  fs.rmSync(backupPath(file), { force: true });
  outstanding.delete(file);
}

function restoreOutstanding() {
  for (const [file, raw] of outstanding) {
    try {
      fs.writeFileSync(file, raw);
      fs.rmSync(backupPath(file), { force: true });
      console.error(`[publish-jami-scope] restored ${path.relative(ROOT, file)} after abnormal exit`);
    } catch {
      // best-effort: the sidecar backup file still exists for the next run
    }
  }
  outstanding.clear();
}

process.on("exit", restoreOutstanding);
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    restoreOutstanding();
    process.exit(130);
  });
}

// Self-heal: restore any stale backups a previously killed run left behind.
for (const p of ORDER) {
  const file = path.join(ROOT, "packages", p, "package.json");
  const bak = backupPath(file);
  if (fs.existsSync(bak)) {
    fs.copyFileSync(bak, file);
    fs.rmSync(bak, { force: true });
    console.warn(`[publish-jami-scope] self-heal: restored ${path.relative(ROOT, file)} from stale backup`);
  }
}
// -----------------------------------------------------------------------------

// Collect current versions of all publishable packages (by canonical name).
const versions = {};
for (const p of ORDER) {
  const j = JSON.parse(readManifest(p).raw);
  versions[j.name] = j.version;
}
console.log("Publishing set:");
for (const [name, v] of Object.entries(versions)) {
  console.log(`  ${name.replace(FROM, TO)}@${v}`);
}

const published = [];
const failed = [];

for (const p of ORDER) {
  if (only && !only.includes(p)) continue;
  const dir = path.join(ROOT, "packages", p);
  const { file, raw } = readManifest(p);
  const j = JSON.parse(raw);
  const canonicalName = j.name;

  // 1. Build with the canonical name (workspace resolution intact).
  run(`pnpm --filter ${canonicalName} run build`, ROOT);

  // 2. Rewrite the manifest for publishing.
  j.name = canonicalName.replace(FROM, TO);
  for (const sec of ["dependencies", "optionalDependencies"]) {
    if (!j[sec]) continue;
    for (const [depName, spec] of Object.entries(j[sec])) {
      if (depName.startsWith(FROM) && versions[depName]) {
        j[sec][depName] = `npm:${depName.replace(FROM, TO)}@^${versions[depName]}`;
      } else if (typeof spec === "string" && spec.startsWith("workspace:")) {
        throw new Error(`${p}: unhandled workspace dep ${depName}@${spec}`);
      }
    }
  }

  // core/dispatch prepack shipped the root README into the tarball; replicate.
  const readmeTarget = path.join(dir, "README.md");
  let copiedReadme = false;
  if ((p === "core" || p === "dispatch") && !fs.existsSync(readmeTarget)) {
    fs.copyFileSync(path.join(ROOT, "README.md"), readmeTarget);
    copiedReadme = true;
  }

  beginRewrite(file, raw);
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
  try {
    // 3. Publish the rewritten manifest. --provenance=false: provenance needs
    // a supported CI provider; this is an operator-machine publish.
    run(`npm publish --access public --ignore-scripts --provenance=false${dryRun ? " --dry-run" : ""}`, dir);
    published.push(`${j.name}@${j.version}`);
  } catch (err) {
    failed.push(`${j.name}@${j.version}`);
    console.error(`FAILED: ${j.name} \u2014 ${err.message}`);
  } finally {
    // 4. Restore the canonical manifest no matter what.
    endRewrite(file, raw);
    if (copiedReadme) fs.rmSync(readmeTarget);
  }
  if (failed.length) break; // dep order matters; do not publish on a broken base
}

console.log(`\n=== ${dryRun ? "DRY RUN " : ""}RESULT ===`);
console.log(`published: ${published.join(", ") || "(none)"}`);
if (failed.length) {
  console.log(`failed: ${failed.join(", ")}`);
  process.exit(1);
}
