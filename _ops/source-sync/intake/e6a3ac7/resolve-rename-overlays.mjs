// Intake e6a3ac7 pass 2: for files where staging made selective display-string
// renames, take upstream (theirs) and re-apply staging's exact base->ours line
// replacements wherever the base line still exists in upstream content.
// Hunks upstream rewrote keep upstream form and are logged for human review.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

const FILES = [
  "packages/core/src/server/core-routes-plugin.ts",
  "packages/core/src/client/composer/PromptComposer.tsx",
  "packages/core/src/client/composer/TiptapComposer.tsx",
  "templates/content/actions/_builder-cms-write-adapter.ts",
  "templates/content/actions/execute-builder-source-execution.ts",
  "templates/content/actions/set-content-database-source-write-mode.ts",
  "templates/content/app/components/editor/database/DatabaseView.tsx",
];

function hunkPairs(file) {
  const diff = git(["diff", "--unified=0", `:1:${file}`, `:2:${file}`]);
  const pairs = [];
  let removed = [];
  let added = [];
  const flush = () => {
    if (removed.length || added.length) {
      pairs.push([removed.join("\n"), added.join("\n")]);
      removed = [];
      added = [];
    }
  };
  for (const line of diff.split("\n")) {
    if (line.startsWith("@@")) flush();
    else if (line.startsWith("-") && !line.startsWith("---")) removed.push(line.slice(1));
    else if (line.startsWith("+") && !line.startsWith("+++")) added.push(line.slice(1));
  }
  flush();
  return pairs.filter(([r]) => r.length);
}

for (const file of FILES) {
  const pairs = hunkPairs(file);
  let text = git(["show", `:3:${file}`]).replace(/\r\n/g, "\n");
  let applied = 0;
  const missed = [];
  for (const [from, to] of pairs) {
    if (text.includes(from)) {
      text = text.replace(from, to);
      applied += 1;
    } else {
      missed.push(from.split("\n")[0].trim().slice(0, 90));
    }
  }
  writeFileSync(file, text);
  git(["add", "--", file]);
  console.log(`${file}: applied ${applied}/${pairs.length}`);
  for (const m of missed) console.log(`  MISSED: ${m}`);
}
