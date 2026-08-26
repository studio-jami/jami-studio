// One-off: final bundle verification for the docs agent cut
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const serverEntry = "packages/docs/.output/server/index.mjs";
const s = readFileSync(serverEntry, "utf8");
let idx = -1;
let n = 0;
console.log("=== _agent-native contexts in server entry ===");
while ((idx = s.indexOf("_agent-native", idx + 1)) !== -1) {
  n++;
  console.log(
    `#${n} @${idx}:`,
    s.slice(Math.max(0, idx - 90), idx + 70).replace(/\s+/g, " "),
  );
}

const assetsDir = "packages/docs/.output/public/assets";
const files = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
let total = 0;
const markerHits = {};
const markers = [
  "AgentSidebar",
  "_agent-native/events",
  "_agent-native/auth/session",
  "agent-panel:toggle",
  "askAssistant",
];
for (const f of files) {
  const c = readFileSync(join(assetsDir, f), "utf8");
  total += c.length;
  for (const m of markers) {
    if (c.includes(m)) {
      markerHits[m] = (markerHits[m] || 0) + 1;
    }
  }
}
console.log(`\n=== client assets: ${files.length} js files, ${(total / 1048576).toFixed(1)} MB ===`);
console.log(
  Object.keys(markerHits).length
    ? "MARKERS PRESENT (bad): " +
        Object.entries(markerHits).map(([k, v]) => `${k} x${v}`).join(", ")
    : "CLEAN: no agent markers in any client js bundle",
);
