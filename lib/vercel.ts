import urlJoin from "url-join"

const VERCEL_API_BASE = "https://api.vercel.com"

function getHeaders(): HeadersInit {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error("VERCEL_API_TOKEN is not set")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

function teamQuery(): string {
  const teamId = process.env.VERCEL_TEAM_ID
  return teamId ? `?teamId=${teamId}` : ""
}

function projectId(): string {
  const id = process.env.VERCEL_PROJECT_ID
  if (!id) throw new Error("VERCEL_PROJECT_ID is not set")
  return id
}

export async function addDomainToVercel(domain: string) {
  const res = await fetch(
    urlJoin(VERCEL_API_BASE, "v10/projects", projectId(), "domains") + teamQuery(),
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name: domain }),
    }
  )
  return { ok: res.ok, status: res.status, data: await res.json() }
}

export async function getDomainFromVercel(domain: string) {
  const res = await fetch(
    urlJoin(VERCEL_API_BASE, "v9/projects", projectId(), "domains", domain) + teamQuery(),
    {
      method: "GET",
      headers: getHeaders(),
    }
  )
  return { ok: res.ok, status: res.status, data: await res.json() }
}

export async function verifyDomainOnVercel(domain: string) {
  const res = await fetch(
    urlJoin(VERCEL_API_BASE, "v10/projects", projectId(), "domains", domain, "verify") + teamQuery(),
    {
      method: "POST",
      headers: getHeaders(),
    }
  )
  return { ok: res.ok, status: res.status, data: await res.json() }
}

export async function removeDomainFromVercel(domain: string) {
  const res = await fetch(
    urlJoin(VERCEL_API_BASE, "v9/projects", projectId(), "domains", domain) + teamQuery(),
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  )
  return { ok: res.ok, status: res.status }
}
