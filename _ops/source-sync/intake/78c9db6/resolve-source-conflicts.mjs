// One-shot intake helper: resolve remaining source/template conflicts by
// taking upstream content and re-applying staging's identity renames.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const DOMAIN_ONLY = [
  "packages/core/src/cli/skills.ts",
  "packages/core/src/cli/pr-visual-recap-workflow.ts",
];

const FULL = [
  "packages/core/src/client/chat/run-recovery.tsx",
  "packages/core/src/mcp/oauth-route.spec.ts",
  "packages/core/src/observability/traces.ts",
  "packages/desktop-app/src/main/index.ts",
  "packages/desktop-app/src/renderer/components/AppSettings.tsx",
  "templates/analytics/seeds/dashboards/agent-native-templates-first-party.json",
  "templates/analytics/server/plugins/onboarding.ts",
  "templates/clips/actions/request-transcript.ts",
  "templates/content/actions/attach-content-database-source.ts",
  "templates/content/app/components/editor/database/settings.tsx",
  "templates/design/AGENTS.md",
  "templates/design/app/components/design/DesignCanvas.tsx",
  "templates/design/server/handlers/import-design-file.ts",
  "templates/plan/app/components/plan/PlanMarkdownReader.test.ts",
];

const PROTECT = [
  ["github.com/BuilderIO/", "\u0001GH\u0001"],
  ["vscode://builder.agent-native", "\u0001VS\u0001"],
  ["itemName=Builder.agent-native", "\u0001MKT\u0001"],
];

function domainRename(text) {
  return text.split("agent-native.com").join("jami.studio");
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

function resolve(file, renamer, conflicted = true) {
  if (conflicted) execFileSync("git", ["checkout", "--theirs", "--", file]);
  const text = readFileSync(file, "utf8");
  writeFileSync(file, renamer(text));
  execFileSync("git", ["add", "--", file]);
  console.log("resolved", file);
}

for (const f of DOMAIN_ONLY) resolve(f, domainRename);
for (const f of FULL) resolve(f, fullRename);

// skills/package.json: upstream version/toolchain, Jami description.
{
  const file = "packages/skills/package.json";
  execFileSync("git", ["checkout", "--theirs", "--", file]);
  const text = readFileSync(file, "utf8").replace(
    "Install BuilderIO skills for coding agents.",
    "Install Jami Studio skills for coding agents.",
  );
  writeFileSync(file, text);
  execFileSync("git", ["add", "--", file]);
  console.log("resolved", file);
}

// skills-content: staging renamed only hosted domains inside skill text.
for (const name of readdirSync("packages/core/src/cli/skills-content")) {
  const file = `packages/core/src/cli/skills-content/${name}`;
  resolve(file, domainRename, false);
}
console.log("done");
