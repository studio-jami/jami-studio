// Main-merge helper: resolve package.json version conflicts by taking the
// higher semver (fork releases continue above the upstream line).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const files = [
  "packages/core/package.json",
  "packages/dispatch/package.json",
  "packages/pinpoint/package.json",
  "packages/scheduling/package.json",
  "packages/skills/package.json",
  "packages/toolkit/package.json",
];

const cmp = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const m = text.match(
    /<<<<<<< HEAD\r?\n\s*"version": "([^"]+)",\r?\n=======\r?\n\s*"version": "([^"]+)",\r?\n>>>>>>> [^\r\n]+\r?\n/,
  );
  if (!m) {
    console.log("SKIP (no version conflict)", file);
    continue;
  }
  const winner = cmp(m[1], m[2]) >= 0 ? m[1] : m[2];
  const resolved = text.replace(m[0], `  "version": "${winner}",\n`);
  if (resolved.includes("<<<<<<<")) {
    console.log("REMAINING CONFLICT in", file);
    continue;
  }
  writeFileSync(file, resolved);
  execFileSync("git", ["add", "--", file]);
  console.log(`resolved ${file} -> ${winner} (ours=${m[1]} theirs=${m[2]})`);
}
