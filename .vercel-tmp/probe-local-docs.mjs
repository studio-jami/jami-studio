// One-off: probe a locally-provisioned docs build for the agent-cut contract.
const base = process.argv[2] || "http://127.0.0.1:4680";
const checks = [
  { m: "GET", p: "/", expect: 200 },
  { m: "GET", p: "/docs/actions", expect: 200 },
  { m: "GET", p: "/skills", expect: 200 },
  { m: "GET", p: "/_agent-native", expect: 404, json: true },
  { m: "GET", p: "/_agent-native/auth/session", expect: 404, json: true },
  { m: "GET", p: "/_agent-native/events", expect: 404, json: true },
  {
    m: "GET",
    p: "/_agent-native/events",
    headers: { accept: "text/event-stream" },
    expect: 410,
  },
  { m: "GET", p: "/_agent-native/agent-engine/status", expect: 404, json: true },
  { m: "GET", p: "/_agent-native/og-image.png", expect: 404, json: true },
  { m: "GET", p: "/llms.txt", expect: 200 },
  { m: "GET", p: "/skills.md", expect: 200 },
  { m: "GET", p: "/nope-real-404", expect: 404 },
];
let pass = 0;
let fail = 0;
for (const c of checks) {
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const r = await fetch(base + c.p, {
      method: c.m,
      headers: c.headers || {},
      redirect: "follow",
    });
    const body = await r.text();
    const ms = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        t0,
    );
    const isJson =
      c.json && JSON.parse(body)?.error === "Not found. This site has no agent endpoints.";
    const isGuard =
      body.length < 200 && (body.startsWith("{") || body.startsWith("Gone"));
    const cc = r.headers.get("cache-control") || "";
    const ok = r.status === c.expect && (!c.json || (isJson && cc.includes("s-maxage=86400")));
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${r.status}${r.status === c.expect ? "" : "<=" + c.expect}  ${ms}ms  ${c.m} ${c.p.padEnd(38)}  bodyLen=${body.length}  cc=${cc.slice(0, 52)}`,
      ok ? "" : `  bodyHead=${body.slice(0, 90).replace(/\n/g, " ")}`,
    );
    ok ? pass++ : fail++;
  } catch (e) {
    fail++;
    console.log(`FAIL  ERR  ${c.m} ${c.p}  ${e.message}`);
  }
}
// llms.txt cache header detail
const llms = await fetch(base + "/llms.txt");
console.log(
  "\n/llms.txt cache-control:",
  llms.headers.get("cache-control"),
  "size:",
  (await llms.text()).length,
);
// markdown twin
const md = await fetch(base + "/skills.md");
console.log("/skills.md cache-control:", md.headers.get("cache-control"));
console.log(`\nRESULT: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
