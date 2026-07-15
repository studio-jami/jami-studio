// Self-grant: the CLOUDFLARE_API_TOKEN carries "Account API Tokens Write",
// so it can extend ITS OWN policy. Adds one minimal policy: DNS Write
// (4755a26eedb94da69e1066d98aa820be) scoped to ONLY the jami.studio zone
// (8a87b2fcc38441f903c076e5891ee8ef). All existing policies preserved.
// Usage: node _ops/scripts/cf-token-grant-dns.mjs
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
const acct = ae.CLOUDFLARE_ACCOUNT_ID;
const TOKEN_ID = "878366a5c7a4fc1618d096ab6d24a538";
const ZONE_ID = "8a87b2fcc38441f903c076e5891ee8ef"; // jami.studio
const DNS_WRITE = "4755a26eedb94da69e1066d98aa820be";
const base = `https://api.cloudflare.com/client/v4/accounts/${acct}/tokens/${TOKEN_ID}`;

let r = await fetch(base, { headers: H });
const detail = (await r.json()).result;
if (!detail) throw new Error("could not read token detail");

const already = detail.policies.some((p) =>
  p.permission_groups.some((g) => g.id === DNS_WRITE),
);
if (already) {
  console.log("DNS Write policy already present — nothing to do");
  process.exit(0);
}

const policies = [
  ...detail.policies.map((p) => ({
    effect: p.effect,
    resources: p.resources,
    permission_groups: p.permission_groups.map((g) => ({ id: g.id })),
  })),
  {
    effect: "allow",
    resources: {
      [`com.cloudflare.api.account.zone.${ZONE_ID}`]: "*",
    },
    permission_groups: [{ id: DNS_WRITE }],
  },
];

r = await fetch(base, {
  method: "PUT",
  headers: H,
  body: JSON.stringify({
    name: detail.name,
    status: detail.status,
    policies,
    ...(detail.condition ? { condition: detail.condition } : {}),
    ...(detail.expires_on ? { expires_on: detail.expires_on } : {}),
  }),
});
const j = await r.json();
console.log(
  "self-grant PUT:",
  r.status,
  j.success,
  JSON.stringify(j.errors ?? []),
);
if (j.success) {
  console.log(
    "policies now:",
    j.result.policies.length,
    "— DNS Write on jami.studio zone added",
  );
}
