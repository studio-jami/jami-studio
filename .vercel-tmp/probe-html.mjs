// One-off: inspect deployed docs HTML for framework prefetch/404-generating references
const base = "https://docs-origin.jami.studio";
const r = await fetch(base + "/docs/actions", { headers: { accept: "text/html" } });
const html = await r.text();
console.log("status:", r.status, "len:", html.length);
console.log("cc:", r.headers.get("cache-control"));
const markers = [
  "speculation-rules",
  "_agent-native",
  "modulepreload",
  "link rel=",
];
for (const m of markers) {
  let count = 0;
  let idx = html.indexOf(m);
  while (idx !== -1) {
    count++;
    idx = html.indexOf(m, idx + 1);
  }
  console.log(String(count).padStart(4), "x", m);
}
// show every tag/href containing _agent-native
const re = /(?:href|src)="([^"]*_agent-native[^"]*)"/g;
let match;
const found = new Set();
while ((match = re.exec(html))) found.add(match[1]);
console.log("\n_agent-native href/src in HTML:");
[...found].forEach((u) => console.log("  ", u));
// link tags
const linkRe = /<link[^>]*>/g;
let lm;
while ((lm = linkRe.exec(html))) {
  if (/speculation|prefetch|modulepreload/.test(lm[0])) console.log("  LINK:", lm[0].slice(0, 200));
}
