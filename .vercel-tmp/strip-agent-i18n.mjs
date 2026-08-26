// One-off: remove dead agent i18n keys from all 11 docs catalogs.
// Removes: header.askAssistant line + the whole agent: { ... } block.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "packages/docs/app/i18n";
const locales = [
  "en-US", "zh-CN", "zh-TW", "es-ES", "fr-FR", "de-DE", "ja-JP",
  "ko-KR", "pt-BR", "hi-IN", "ar-SA",
];

for (const locale of locales) {
  const file = join(dir, `${locale}.ts`);
  const lines = readFileSync(file, "utf8").split("\n");
  const out = [];
  let removedAskAssistant = false;
  let removedAgentBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 1) header.askAssistant (single line, any indent)
    if (/^\s*askAssistant:\s/.test(line)) {
      removedAskAssistant = true;
      continue;
    }
    // 2) agent: { block — capture indent, skip until matching close
    const m = line.match(/^(\s*)agent:\s*{\s*$/);
    if (m && !removedAgentBlock) {
      const indent = m[1];
      removedAgentBlock = true;
      i++; // skip the opening line
      while (i < lines.length && !/^\s*\},?\s*$/.test(lines[i])) {
        i++;
      }
      continue; // skip the closing line too
    }
    out.push(line);
  }
  const text = out.join("\n");
  if (!removedAskAssistant || !removedAgentBlock) {
    console.error(`FAIL ${locale}: askAssistant=${removedAskAssistant} agentBlock=${removedAgentBlock}`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(file, text, "utf8");
  console.log(`ok ${locale}`);
}
