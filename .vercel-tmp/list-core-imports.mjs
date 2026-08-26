// One-off: list core imports in docs app source + core internal useSession chains.
import { execSync } from "node:child_process";
const out = (cmd) =>
  execSync(cmd, { cwd: "c:/Users/james/orgs/oss/jami-studio", encoding: "utf8" });
console.log("=== docs app -> core imports ===");
console.log(
  out(
    'git grep -n "@agent-native/core" -- "packages/docs/app" "packages/docs/lib" "packages/docs/ssr-entry.ts"',
  ),
);
