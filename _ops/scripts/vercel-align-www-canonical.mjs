// Align domain redirects with the repo's committed canonical host
// (SITE_URL = https://www.jami.studio in packages/docs). Makes www primary:
// apex jami.studio 308 -> www.jami.studio. Also points docs APP_URL at www.
// Reads the local Vercel CLI auth token; never prints it.
import { readFileSync } from "node:fs"
import { join } from "node:path"

const TEAM = "team_MAA7dpVr2sDNuNv90AiYlo1d"
const MARKETING = "prj_AjqrMTwirc5miXdu8j8vWOLRSTfO"
const DOCS = "prj_S6t3Wmri57fyFooFI9vNS5ot0q75"

const authPath = join(
  process.env.APPDATA,
  "com.vercel.cli",
  "Data",
  "auth.json",
)
const token = JSON.parse(readFileSync(authPath, "utf8")).token

async function api(method, path, body) {
  const res = await fetch(
    `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${TEAM}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  )
  return { status: res.status, json: await res.json() }
}

// 1) List marketing domains
{
  const { json } = await api("GET", `/v9/projects/${MARKETING}/domains`)
  for (const d of json.domains ?? [])
    console.log(
      `domain: ${d.name} redirect=${d.redirect ?? "-"} verified=${d.verified}`,
    )
}

// 2) www = primary (no redirect); apex 308 -> www
{
  const { status, json } = await api(
    "PATCH",
    `/v9/projects/${MARKETING}/domains/www.jami.studio`,
    { redirect: null },
  )
  console.log(`www primary: HTTP ${status} redirect=${json.redirect ?? "-"}`)
}
{
  const { status, json } = await api(
    "PATCH",
    `/v9/projects/${MARKETING}/domains/jami.studio`,
    { redirect: "www.jami.studio", redirectStatusCode: 308 },
  )
  console.log(
    `apex redirect: HTTP ${status} redirect=${json.redirect ?? JSON.stringify(json.error)}`,
  )
}

// 3) Docs APP_URL -> https://www.jami.studio (upsert)
{
  const { status, json } = await api(
    "POST",
    `/v10/projects/${DOCS}/env?upsert=true`,
    {
      key: "APP_URL",
      value: "https://www.jami.studio",
      type: "plain",
      target: ["production", "preview", "development"],
    },
  )
  console.log(
    `docs APP_URL: HTTP ${status} ${json.created ? "created" : json.failed?.length ? JSON.stringify(json.failed) : "ok"}`,
  )
}
