// One-shot intake helper: resolve docs conflicts by taking upstream content
// and re-applying the staging identity renames (Jami takeover convention).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const files = execFileSync("git", ["diff", "--name-only", "--diff-filter=U"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter((f) => f.startsWith("packages/core/docs/content/"));

const PROTECT = [
  ["github.com/BuilderIO/", "\u0001GH_BUILDERIO\u0001"],
  ["vscode://builder.agent-native", "\u0001VSCODE_BUILDER\u0001"],
  ["itemName=Builder.agent-native", "\u0001MKT_BUILDER\u0001"],
];

for (const file of files) {
  execFileSync("git", ["checkout", "--theirs", "--", file]);
  let text = readFileSync(file, "utf8");
  for (const [from, to] of PROTECT) text = text.split(from).join(to);
  text = text.split("agent-native.com").join("jami.studio");
  text = text.split("BuilderIO").join("Jami Studio");
  text = text.split("Builder.io").join("Jami Studio");
  text = text.replace(/\bBuilder\b/g, "Jami Studio");
  for (const [from, to] of PROTECT) text = text.split(to).join(from);
  writeFileSync(file, text);
  execFileSync("git", ["add", "--", file]);
  console.log("resolved", file);
}
console.log(files.length, "docs files resolved");
