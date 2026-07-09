const fs = require("fs"), path = require("path");
const base = process.cwd();
const roots = ["client/index.js", "client/extensions/index.js"];
const seen = new Set();
const tainted = [];
const TAINT = /(^|\/)db\/(client|create-get-db|index)\.js$|(^|\/)server\/(request-context|poll|better-auth-instance|index)\.js$|(^|\/)oauth-tokens\/store\.js$|(^|\/)secrets\/store\.js$|(^|\/)sharing\/access\.js$/;
function imps(file) {
  const s = fs.readFileSync(file, "utf8");
  return [...s.matchAll(/from\s*["']([^"']+)["']/g)].map(m => m[1]);
}
function walk(file) {
  if (seen.has(file)) return;
  seen.add(file);
  let list;
  try { list = imps(file); } catch (e) { return; }
  for (const r of list) {
    if (r === "drizzle-orm" || r === "better-auth" || r.startsWith("better-auth/")) {
      tainted.push(file + " -> BARE " + r);
    }
  }
  const dir = path.posix.dirname(file.split(path.sep).join("/"));
  for (const r of list) {
    if (!r.startsWith(".")) continue;
    let t = path.posix.normalize(path.posix.join(dir, r));
    if (!t.endsWith(".js")) t += ".js";
    if (TAINT.test(t)) tainted.push(file + " -> " + t);
    if (fs.existsSync(t)) walk(t);
  }
}
roots.forEach(walk);
console.log("files visited:", seen.size);
console.log("TAINTED reaches:", tainted.length);
tainted.slice(0, 60).forEach(x => console.log("  " + x));
