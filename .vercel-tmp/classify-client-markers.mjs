// One-off: classify client-bundle agent markers — runtime code vs docs content
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const assetsDir = "packages/docs/.output/public/assets";
const files = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
const markers = ["AgentSidebar", "_agent-native/events", "_agent-native/auth/session"];

const byMarker = {};
for (const m of markers) byMarker[m] = { files: new Set(), ctx: [] };

for (const f of files) {
  const c = readFileSync(join(assetsDir, f), "utf8");
  for (const m of markers) {
    let idx = c.indexOf(m);
    if (idx === -1) continue;
    byMarker[m].files.add(f);
    if (byMarker[m].ctx.length < 4) {
      byMarker[m].ctx.push(c.slice(Math.max(0, idx - 110), idx + 70).replace(/\s+/g, " "));
    }
  }
}
for (const [m, v] of Object.entries(byMarker)) {
  console.log(`\n### ${m} — ${v.files.size} files`);
  [...v.files].slice(0, 8).forEach((f) => console.log("   " + f));
  if (v.files.size > 8) console.log("   ... " + (v.files.size - 8) + " more");
  console.log("   contexts:");
  v.ctx.forEach((c) => console.log("   >> " + c));
}
