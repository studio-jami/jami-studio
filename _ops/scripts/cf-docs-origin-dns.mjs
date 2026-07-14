// Docs-origin cutover, step 2: create the DNS record for
// docs-origin.jami.studio -> cname.vercel-dns.com on the Cloudflare zone
// (DNS-only, NOT proxied, so Vercel terminates TLS and issues the cert).
// Usage: node _ops/scripts/cf-docs-origin-dns.mjs
import { readFileSync } from "node:fs";

const ae = JSON.parse(
  readFileSync(
    "c:/Users/james/orgs/oss/jami-studio/_ops/credentials/.secrets/agent-env.json",
    "utf8",
  ),
);
const H = {
  authorization: `Bearer ${ae.CLOUDFLARE_API_TOKEN}`,
  "content-type": "application/json",
};

const zones = await (
  await fetch("https://api.cloudflare.com/client/v4/zones?name=jami.studio", {
    headers: H,
  })
).json();
const zone = zones.result?.[0];
if (!zone) throw new Error("jami.studio zone not visible to this token: " + JSON.stringify(zones.errors));
console.log("zone:", zone.id, zone.name);

const existing = await (
  await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?name=docs-origin.jami.studio`,
    { headers: H },
  )
).json();
if (existing.result?.length) {
  console.log("record already exists:", JSON.stringify(existing.result.map((r) => ({ type: r.type, content: r.content, proxied: r.proxied }))));
  process.exit(0);
}

const create = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`,
  {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      type: "CNAME",
      name: "docs-origin",
      content: "cname.vercel-dns.com",
      proxied: false,
      ttl: 1,
      comment: "Vercel docs project origin - proxied to by www.jami.studio/docs (marketing rewrites)",
    }),
  },
);
const j = await create.json();
console.log("create record:", create.status, j.success, JSON.stringify(j.errors ?? []));
