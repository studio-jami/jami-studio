// Intake e6a3ac7: resolve conflicts by taking upstream content and re-applying
// staging identity renames — but only where staging's side is PROVABLY just the
// rename transform of the merge base. Everything else is flagged for manual work.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
}

const PROTECT = [
  ["github.com/BuilderIO/", "\u0001GH\u0001"],
  ["vscode://builder.agent-native", "\u0001VS\u0001"],
  ["itemName=Builder.agent-native", "\u0001MKT\u0001"],
];

function domainRename(text) {
  return text.split("agent-native.com").join("jami.studio");
}

function docsRename(text) {
  for (const [from, to] of PROTECT) text = text.split(from).join(to);
  text = domainRename(text);
  text = text.split("BuilderIO").join("Jami Studio");
  text = text.split("Builder.io").join("Jami Studio");
  text = text.replace(/\bBuilder\b/g, "Jami Studio");
  for (const [from, to] of PROTECT) text = text.split(to).join(from);
  return text;
}

function fullRename(text) {
  for (const [from, to] of PROTECT) text = text.split(from).join(to);
  text = domainRename(text);
  text = text.split("Builder.io").join("Jami Studio");
  text = text.replace(/\bBuilderIO\/agent-native\b/g, "Jami Studio/agent-native");
  text = text.replace(/(?<![\w.])builder\.io(?![\w])/g, "jami.studio");
  text = text.replace(/\bBuilder\b(?!\.)/g, "Jami Studio");
  for (const [from, to] of PROTECT) text = text.split(to).join(from);
  return text;
}

const TRANSFORMS = [
  ["domain", domainRename],
  ["docs", docsRename],
  ["full", fullRename],
];

function stageContent(stage, file) {
  try {
    return git(["show", `:${stage}:${file}`]);
  } catch {
    return null;
  }
}

const norm = (t) => (t ?? "").replace(/\r\n/g, "\n");

const files = git(["diff", "--name-only", "--diff-filter=U"]).split(/\r?\n/).filter(Boolean);
const manual = [];
const resolved = [];

for (const file of files) {
  const base = stageContent(1, file);
  const ours = stageContent(2, file);
  const theirs = stageContent(3, file);
  if (base == null || ours == null || theirs == null) {
    manual.push([file, "add/delete conflict"]);
    continue;
  }
  let done = false;
  for (const [name, fn] of TRANSFORMS) {
    if (norm(fn(base)) === norm(ours)) {
      writeFileSync(file, fn(theirs));
      git(["add", "--", file]);
      resolved.push([file, name]);
      done = true;
      break;
    }
  }
  if (!done) manual.push([file, "ours has non-rename changes"]);
}

console.log(`resolved ${resolved.length}:`);
for (const [f, t] of resolved) console.log(`  [${t}] ${f}`);
console.log(`\nmanual ${manual.length}:`);
for (const [f, why] of manual) console.log(`  ${f} — ${why}`);
