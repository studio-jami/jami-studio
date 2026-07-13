// Main-merge helper: union-resolve CHANGELOG.md conflicts (keep both sides,
// upstream entries first, fork entries after within each conflict block).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2);
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  const out = [];
  let mode = "normal"; // normal | ours | theirs
  let ours = [];
  let theirs = [];
  for (const line of lines) {
    if (line.startsWith("<<<<<<<")) {
      mode = "ours";
      ours = [];
      theirs = [];
    } else if (line.startsWith("=======") && mode === "ours") {
      mode = "theirs";
    } else if (line.startsWith(">>>>>>>") && mode === "theirs") {
      out.push(...theirs, ...ours);
      mode = "normal";
    } else if (mode === "ours") {
      ours.push(line);
    } else if (mode === "theirs") {
      theirs.push(line);
    } else {
      out.push(line);
    }
  }
  writeFileSync(file, out.join("\n"));
  execFileSync("git", ["add", "--", file]);
  console.log("union-resolved", file);
}
