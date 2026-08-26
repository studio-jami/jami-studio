// One-off: probe live docs-origin agent-web surfaces + 404 cache behavior
const base = "https://docs-origin.jami.studio";
const checks = [
  { path: "/llms.txt", label: "llms.txt (agentWeb)" },
  { path: "/.well-known/agent.json", label: "agent card" },
  { path: "/docs/actions.md", label: "markdown twin" },
  { path: "/docs/actions.md", label: "md twin w/ Accept md", accept: "text/markdown" },
  { path: "/_agent-native/auth/session", label: "session (poll)" },
  { path: "/_agent-native/events", label: "events SSE (poll)" },
  { path: "/nope-missing-page", label: "random 404" },
];
for (const c of checks) {
  const headers = { accept: c.accept || "text/html" };
  const t0 = Date.now();
  try {
    const r = await fetch(base + c.path, { headers, redirect: "follow" });
    const body = await r.text();
    console.log(
      `${r.status}  ${String(Date.now() - t0).padStart(4)}ms  ${c.path.padEnd(32)}  ${c.label.padEnd(22)}  len=${body.length}  ct=${r.headers.get("content-type")}  cc=${r.headers.get("cache-control")}`,
    );
  } catch (e) {
    console.log(`ERR  ${c.path}  ${e.message}`);
  }
}
// 404 cache: hit a custom 404 twice, 5s apart, compare X-Vercel-Cache / Age
for (const i of [1, 2]) {
  const r = await fetch(base + "/definitely-missing-" + i + "-abc", {
    headers: { accept: "text/html" },
  });
  await r.text();
  console.log(
    `404-cache-hit-${i}: x-vercel-cache=${r.headers.get("x-vercel-cache")} age=${r.headers.get("age")} x-vercel-id=${(r.headers.get("x-vercel-id") || "").slice(-12)}`,
  );
  if (i === 1) await new Promise((res) => setTimeout(res, 5000));
}
