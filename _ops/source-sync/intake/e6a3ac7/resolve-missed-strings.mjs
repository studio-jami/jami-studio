// Intake e6a3ac7 pass 3: targeted renames for staging-decided strings that
// upstream reshaped. New upstream-only Builder references stay for the
// main-side identity pass (documented in curation notes).
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const EDITS = {
  "packages/core/src/server/core-routes-plugin.ts": [
    ["// deployment that minted the signed state. Builder/Fusion previews", "// deployment that minted the signed state. Jami Studio/Fusion previews"],
    ["// Read request-scoped Builder credentials first; deploy env is only", "// Read request-scoped Jami Studio credentials first; deploy env is only"],
    ["// blocking a user from connecting their own Builder account.", "// blocking a user from connecting their own Jami Studio account."],
    ["// Builder space; connectError means the active callback itself", "// Jami Studio space; connectError means the active callback itself"],
    ["// Best-effort: surface the real space name(s) from Builder's", "// Best-effort: surface the real space name(s) from Jami Studio's"],
  ],
  "packages/core/src/client/composer/PromptComposer.tsx": [
    ["* Override the Builder.io connect action in the model picker. When provided,", "* Override the Jami Studio connect action in the model picker. When provided,"],
    ['* clicking "Connect Builder.io" calls this instead of opening a browser popup.', '* clicking "Connect Jami Studio" calls this instead of opening a browser popup.'],
  ],
  "packages/core/src/client/composer/TiptapComposer.tsx": [
    ["* Override the Builder.io connect action in the model picker. When provided,", "* Override the Jami Studio connect action in the model picker. When provided,"],
    ['defaultValue: "Connecting Builder.io\u2026"', 'defaultValue: "Connecting Jami Studio\u2026"'],
    ['defaultValue: "Connect Builder.io"', 'defaultValue: "Connect Jami Studio"'],
  ],
  "templates/content/actions/set-content-database-source-write-mode.ts": [
    ['"Set the tiered Builder CMS write mode for one source.', '"Set the tiered Jami Studio CMS write mode for one source.'],
  ],
  "templates/content/actions/execute-builder-source-execution.ts": [
    ['"Execute a prepared Builder CMS write gate. This performs a real Builder write', '"Execute a prepared Jami Studio CMS write gate. This performs a real Jami Studio write'],
    ["`Live Builder writes are only allowed for ${BUILDER_CMS_SAFE_WRITE_MODEL}.`", "`Live Jami Studio writes are only allowed for ${BUILDER_CMS_SAFE_WRITE_MODEL}.`"],
    ['"Prepare the Builder execution gate before executing it."', '"Prepare the Jami Studio execution gate before executing it."'],
    ['"Builder execution is already running."', '"Jami Studio execution is already running."'],
    ['"Live Builder writes are disabled for this source."', '"Live Jami Studio writes are disabled for this source."'],
    ["`Builder ${plan.pushMode} execution failed.`", "`Jami Studio ${plan.pushMode} execution failed.`"],
    ["`Builder ${plan.pushMode} execution reconciliation failed.`", "`Jami Studio ${plan.pushMode} execution reconciliation failed.`"],
  ],
};

for (const [file, edits] of Object.entries(EDITS)) {
  let text = readFileSync(file, "utf8");
  for (const [from, to] of edits) {
    if (!text.includes(from)) {
      console.log(`SKIP (absent): ${file} :: ${from.slice(0, 70)}`);
      continue;
    }
    text = text.split(from).join(to);
    console.log(`ok: ${file} :: ${from.slice(0, 60)}`);
  }
  writeFileSync(file, text);
  execFileSync("git", ["add", "--", file]);
}
