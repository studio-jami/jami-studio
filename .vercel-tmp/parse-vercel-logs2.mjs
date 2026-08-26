// One-off: tally Vercel request logs (JSON-lines) by status + path.
// Usage: node parse-vercel-logs2.mjs logs.json
import { readFileSync } from "node:fs";
import process from "node:process";

const raw = readFileSync(process.argv[2], "utf8");
// Vercel CLI emits NDJSON (one object per line)
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);
console.log("total log objects:", lines.length);

const byStatus = {};
const byStatusPath = {};
const byPath = {};
const srcCount = {};
for (const o of lines) {
  srcCount[o.source || "?"] = (srcCount[o.source || "?"] || 0) + 1;
  const status = o.responseStatusCode;
  const path = o.requestPath || "?";
  const method = o.requestMethod || "?";
  byStatus[status] = (byStatus[status] || 0) + 1;
  byPath[path] = (byPath[path] || 0) + 1;
  if (status >= 400) {
    const key = `${status} ${method} ${path}`;
    byStatusPath[key] = (byStatusPath[key] || 0) + 1;
  }
}
console.log("\nsources:", JSON.stringify(srcCount));
console.log("\nbyStatus:", JSON.stringify(byStatus));
console.log(
  "\ntop all paths:",
  Object.entries(byPath)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([p, c]) => `${c}\t${p}`)
    .join("\n"),
);
console.log(
  "\nerror (4xx/5xx) by status+method+path:",
  Object.entries(byStatusPath)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([k, c]) => `${c}\t${k}`)
    .join("\n"),
);
// time span
const ts = lines.map((o) => o.timestamp).filter(Boolean);
if (ts.length) {
  console.log(
    "\ntime span:",
    new Date(Math.min(...ts)).toISOString(),
    "->",
    new Date(Math.max(...ts)).toISOString(),
  );
}
