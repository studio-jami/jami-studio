// One-time setup: marketing project framework + docs project APP_URL env.
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
if (!token) throw new Error("no vercel token found")

async function api(method, path, body) {
  const res = await fetch(`https://api.vercel.com${path}?teamId=${TEAM}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  return { status: res.status, json }
}

// 1) Marketing: framework = nextjs
{
  const { status, json } = await api("PATCH", `/v9/projects/${MARKETING}`, {
    framework: "nextjs",
  })
  console.log(
    `marketing framework: HTTP ${status} -> framework=${json.framework ?? JSON.stringify(json.error)}`,
  )
}

// 2) Docs: APP_URL=https://jami.studio (all targets), upsert
{
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${DOCS}/env?teamId=${TEAM}&upsert=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: "APP_URL",
        value: "https://jami.studio",
        type: "plain",
        target: ["production", "preview", "development"],
      }),
    },
  )
  const json = await res.json()
  console.log(
    `docs APP_URL env: HTTP ${res.status} -> ${json.created ? "created" : json.failed?.length ? JSON.stringify(json.failed) : "ok"}`,
  )
}
