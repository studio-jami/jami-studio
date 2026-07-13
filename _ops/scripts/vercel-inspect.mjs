// Wave-8: inspect Vercel projects for marketing + docs setup. Reads the CLI
// token locally; NEVER prints it. Prints only non-secret project metadata.
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const auth = JSON.parse(readFileSync(path.join(os.homedir(), "AppData/Roaming/com.vercel.cli/Data/auth.json"), "utf8"));
const token = auth.token ?? auth.accessToken ?? Object.values(auth).find((v) => typeof v === "string" && v.length > 20);
if (!token) { console.error("no token found in auth.json (keys: " + Object.keys(auth).join(",") + ")"); process.exit(1); }
const H = { authorization: `Bearer ${token}` };

async function api(p) {
  const r = await fetch(`https://api.vercel.com${p}`, { headers: H });
  const j = await r.json().catch(() => null);
  return { status: r.status, j };
}

// find team id
const teams = await api("/v2/teams");
const team = teams.j?.teams?.find((t) => /jami/i.test(t.slug + t.name));
console.log("team:", team?.id, team?.slug);
const tq = team ? `teamId=${team.id}` : "";

const ids = process.argv.slice(2);
for (const id of ids) {
  const p = await api(`/v9/projects/${id}?${tq}`);
  if (p.status !== 200) { console.log(`\n=== ${id}: ${p.status} ${JSON.stringify(p.j?.error ?? p.j).slice(0, 200)}`); continue; }
  const pr = p.j;
  console.log(`\n=== ${id}`);
  console.log(JSON.stringify({
    name: pr.name, framework: pr.framework, rootDirectory: pr.rootDirectory,
    buildCommand: pr.buildCommand, installCommand: pr.installCommand, outputDirectory: pr.outputDirectory,
    nodeVersion: pr.nodeVersion,
    link: pr.link ? { type: pr.link.type, repo: pr.link.repo, org: pr.link.org, productionBranch: pr.link.productionBranch } : null,
    domains: undefined,
  }, null, 1));
  const doms = await api(`/v9/projects/${id}/domains?${tq}`);
  console.log("domains:", (doms.j?.domains ?? []).map((d) => `${d.name}${d.verified ? "" : " (unverified)"}`).join(", ") || "(none)");
  const deps = await api(`/v6/deployments?projectId=${id}&limit=3&${tq}`);
  for (const d of deps.j?.deployments ?? []) {
    console.log(`  deploy ${d.uid} state=${d.state} target=${d.target} created=${new Date(d.created).toISOString()} ${d.url}`);
    if (d.state === "ERROR") {
      const ev = await api(`/v3/deployments/${d.uid}/events?limit=60&${tq}`);
      const lines = (Array.isArray(ev.j) ? ev.j : []).map((e) => e.payload?.text ?? "").filter(Boolean);
      const errIdx = lines.findIndex((l) => /error|failed|ERR_/i.test(l));
      const slice = errIdx >= 0 ? lines.slice(Math.max(0, errIdx - 3), errIdx + 12) : lines.slice(-15);
      console.log("  --- error log excerpt ---");
      for (const l of slice) console.log("   |", l.slice(0, 220));
    }
  }
}
