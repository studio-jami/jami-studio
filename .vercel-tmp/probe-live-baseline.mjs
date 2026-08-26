// One-off: baseline fetch of the LIVE docs deployment (old build, pre-changes).
const base = "https://docs-origin.jami.studio";
const checks = ["/", "/docs/actions", "/skills", "/_agent-native/auth/session", "/llms.txt"];
for (const p of checks) {
  try {
    const t0 = Date.now();
    const r = await fetch(base + p, { redirect: "follow" });
    const body = await r.text();
    const ms = Date.now() - t0;
    const cc = r.headers.get("cache-control") || "";
    console.log(
      `${r.status}  ${ms}ms  ${p.padEnd(30)}  bodyLen=${body.length}  cc=${cc.slice(0, 48)}`,
    );
  } catch (e) {
    console.log(`ERR  ${p}  ${e.message}`);
  }
}
