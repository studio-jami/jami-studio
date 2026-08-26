// One-off: tally Vercel request logs by status + path for docs-origin.jami.studio
// Usage: vercel logs <url> --since <dur> --json > logs.json ; node parse-vercel-logs.mjs logs.json
import { readFileSync } from "node:fs";
import process from "node:process";

const file = process.argv[2];
const raw = readFileSync(file, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch {
  console.log("PARSE FAIL. head:", raw.slice(0, 500));
  process.exit(1);
}
const rs = data.results || data || [];
console.log("total lines:", rs.length);

const byStatus = {};
const byStatusPath = {};
for (const line of rs) {
  const msg =
    typeof line === "string" ? line : line.message || line.raw || JSON.stringify(line);
  // Vercel function log lines look like: {"level":"info","time":...,"scope"...}
  // serverless request log: {"action":"completed","status":...,"url":...} OR plain text
  const sm = msg.match(/"status"\s*:\s*(\d{3})/) || msg.match(/\b([45]\d{2})\b/);
  if (!sm) continue;
  const status = sm[1];
  byStatus[status] = (byStatus[status] || 0) + 1;
  const pm =
    msg.match(/"url"\s*:\s*"([^"?]+)"/) ||
    msg.match(/"path"\s*:\s*"([^"?]+)"/) ||
    msg.match(/\b(GET|POST)\s+(\S+)/);
  let p = null;
  if (pm) {
    p = (pm[2] || pm[1]) || null;
  }
  const key = `${status} ${p || "?"}`;
  byStatusPath[key] = (byStatusPath[key] || 0) + 1;
}
console.log("\nbyStatus:", JSON.stringify(byStatus));
console.log("\ntop status+path:");
Object.entries(byStatusPath)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .forEach(([k, c]) => console.log(String(c).padStart(6), k));
console.log("\n-- sample raw lines (first 5) --");
rs.slice(0, 5).forEach((l) =>
  console.log(
    String(typeof l === "string" ? l : l?.message || JSON.stringify(l)).slice(0, 400),
  ),
);
