// One-off: import the built nitro server entry exactly as a host would, then
// dispatch a request through the exported handler (no http server).
const target = process.argv[2] ||
  "file:///C:/Users/james/orgs/oss/jami-studio/packages/docs/.output/server/index.mjs";
const mod = await import(target);
console.log("entry exports:", Object.keys(mod));
const handler = mod.default?.fetch ?? mod.fetch ?? mod.default;
const t0 = Date.now();
try {
  const res = await handler(new Request("http://localhost/", { method: "GET" }));
  const body = await res.text();
  console.log(
    `handler GET / -> ${res.status} in ${Date.now() - t0}ms bodyLen=${body.length}`,
  );
  console.log("body head:", body.slice(0, 120).replace(/\n/g, " "));
} catch (e) {
  console.log("handler threw:", e.message);
  console.log(e.stack?.split("\n").slice(0, 8).join("\n"));
}
process.exit(0);
