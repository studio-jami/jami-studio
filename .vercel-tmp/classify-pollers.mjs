// Classify every client-side occurrence of the session/engine poller markers.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve("packages/docs/.output/public/assets");
const markers = [
  "_agent-native/auth/session",
  "_agent-native/agent-engine/status",
  "_agent-native/events",
];
const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!name.endsWith(".js")) continue;
    const body = readFileSync(p, "utf8");
    for (const m of markers) {
      let i = body.indexOf(m);
      let n = 0;
      while (i !== -1 && n < 50) {
        hits.push({
          file: p.slice(root.length + 1),
          marker: m,
          ctx: body.slice(Math.max(0, i - 160), i + m.length + 80),
        });
        i = body.indexOf(m, i + 1);
        n++;
      }
    }
  }
}
walk(root);

// Heuristic: a live fetcher has fetch() nearby a template literal/var ref
// with no surrounding words (prose) — i.e. context is code-ish (quotes, parens,
// backticks). Prose hits have whole words/spaces on both sides.
function classify(hit) {
  const before = hit.ctx.slice(0, hit.ctx.length - hit.marker.length - 80);
  const after = hit.ctx.slice(hit.ctx.length - 80);
  const codeish =
    /fetch\(|new EventSource|XMLHttpRequest|\.get\(|\.post\(/.test(before + after) ||
    (/["'`()]/.test(before.slice(-1)) && /["'`()]/.test(after.slice(0, 1)));
  return codeish ? "CODE?" : "prose";
}
const byFile = new Map();
for (const h of hits) {
  const k = `${h.file} :: ${h.marker}`;
  byFile.set(k, (byFile.get(k) || 0) + 1);
}
for (const [k, c] of [...byFile.entries()].sort()) {
  const sample = hits.find((h) => `${h.file} :: ${h.marker}` === k);
  const cls = classify(sample);
  console.log(`${cls === "CODE?" ? "!!! " : "ok  "}  ${String(c).padStart(3)}x  ${k}`);
  if (cls === "CODE?") {
    console.log(`      ${JSON.stringify(sample.ctx)}`);
  }
}
console.log(`\ntotal marker occurrences: ${hits.length}`);
