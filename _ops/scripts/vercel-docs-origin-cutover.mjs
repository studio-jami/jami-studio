// Docs-origin cutover, step 1: give the docs Vercel project a first-class
// origin host on our own domain (docs-origin.jami.studio) so the marketing
// /docs proxy no longer depends on the legacy jami-studio-docs.vercel.app
// domain (which gets DELETED outright in step 3 — no redirect).
// Public canonical stays https://www.jami.studio/docs; the origin host is
// proxy plumbing only (docs pages emit www.jami.studio canonicals).
// Usage: node _ops/scripts/vercel-docs-origin-cutover.mjs [--delete-legacy]
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ORIGIN_HOST = "docs-origin.jami.studio";
const DOCS_PROJECT = "prj_S6t3Wmri57fyFooFI9vNS5ot0q75";
const LEGACY_DOMAIN = "jami-studio-docs.vercel.app";

const auth = JSON.parse(
  readFileSync(
    path.join(os.homedir(), "AppData/Roaming/com.vercel.cli/Data/auth.json"),
    "utf8",
  ),
);
const token =
  auth.token ??
  auth.accessToken ??
  Object.values(auth).find((v) => typeof v === "string" && v.length > 20);
if (!token) throw new Error("no Vercel token in auth.json");
const H = { authorization: `Bearer ${token}`, "content-type": "application/json" };

const teams = await (
  await fetch("https://api.vercel.com/v2/teams", { headers: H })
).json();
const team = teams.teams?.find((t) => /jami/i.test(t.slug + t.name));
const tq = `teamId=${team.id}`;
console.log("team:", team.slug);

async function api(method, p, body) {
  const r = await fetch(`https://api.vercel.com${p}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => null);
  return { status: r.status, j };
}

if (process.argv.includes("--delete-legacy")) {
  const del = await api(
    "DELETE",
    `/v9/projects/${DOCS_PROJECT}/domains/${LEGACY_DOMAIN}?${tq}`,
  );
  console.log("delete legacy domain:", del.status, JSON.stringify(del.j ?? {}));
  const doms = await api("GET", `/v9/projects/${DOCS_PROJECT}/domains?${tq}`);
  console.log(
    "domains now:",
    (doms.j?.domains ?? []).map((d) => d.name).join(", ") || "(none)",
  );
  process.exit(0);
}

// Step 1: add the origin domain to the docs project.
const add = await api("POST", `/v10/projects/${DOCS_PROJECT}/domains?${tq}`, {
  name: ORIGIN_HOST,
});
console.log("add domain:", add.status, JSON.stringify(add.j ?? {}).slice(0, 300));

// Report verification/config state so we know what DNS record Vercel expects.
const cfg = await api("GET", `/v6/domains/${ORIGIN_HOST}/config?${tq}`);
console.log("domain config:", cfg.status, JSON.stringify(cfg.j ?? {}).slice(0, 300));
