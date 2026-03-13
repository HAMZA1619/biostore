import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || ""

const APP_HOSTNAME = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : "localhost"

function isCustomDomainRequest(hostname: string): boolean {
  if (hostname === APP_HOSTNAME) return false
  if (hostname === "localhost" || hostname === "127.0.0.1") return false
  if (hostname.endsWith(`.${APP_HOSTNAME}`)) return false
  if (hostname.endsWith(".vercel.app")) return false
  if (ROOT_DOMAIN && (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`))) return false
  return true
}

function getSubdomain(hostname: string): string | null {
  if (!ROOT_DOMAIN || !hostname.endsWith(`.${ROOT_DOMAIN}`)) return null
  const sub = hostname.slice(0, -(ROOT_DOMAIN.length + 1))
  return sub || null
}


async function resolveCustomDomain(
  hostname: string
): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from("stores")
    .select("slug")
    .eq("custom_domain", hostname)
    .eq("domain_verified", true)
    .eq("is_published", true)
    .single()
  return data?.slug ?? null
}

async function resolveStoreBySlug(slug: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from("stores")
    .select("slug")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()
  return !!data
}

function createSubdomainRewrite(request: NextRequest, slug: string): NextResponse {
  const pathname = request.nextUrl.pathname

  // If path already starts with the slug, redirect to clean version
  if (pathname.startsWith(`/${slug}`)) {
    const cleanPath = pathname.slice(`/${slug}`.length) || "/"
    const url = request.nextUrl.clone()
    url.pathname = cleanPath
    return NextResponse.redirect(url, 301)
  }

  // Rewrite to slug-based route internally
  const url = request.nextUrl.clone()
  url.pathname = `/${slug}${pathname}`
  const response = NextResponse.rewrite(url)
  response.headers.set("x-custom-domain", "true")
  response.headers.set("x-store-slug", slug)
  return response
}

export async function updateSession(request: NextRequest) {
  const hostHeader = request.headers.get("host") || request.nextUrl.hostname
  const hostname = hostHeader.split(":")[0]
  const pathname = request.nextUrl.pathname

  // --- 1. Custom domain handling ---
  if (isCustomDomainRequest(hostname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.next()
    }

    if (
      pathname.startsWith("/dashboard") ||
      pathname === "/login" ||
      pathname === "/signup"
    ) {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
      url.pathname = pathname
      return NextResponse.redirect(url)
    }

    const slug = await resolveCustomDomain(hostname)
    if (!slug) {
      return new NextResponse("Store not found", { status: 404 })
    }

    return createSubdomainRewrite(request, slug)
  }

  // --- 2. Subdomain routing (only when ROOT_DOMAIN is configured) ---
  const isLocalOrPreview =
    !ROOT_DOMAIN ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")

  if (!isLocalOrPreview) {
    const subdomain = getSubdomain(hostname)

    if (subdomain && subdomain !== "www") {
      // --- Store subdomain (slug.domain.com) ---
      if (pathname.startsWith("/api/")) {
        return NextResponse.next()
      }

      // Dashboard/auth routes should not work on store subdomains
      if (
        pathname.startsWith("/dashboard") ||
        pathname === "/login" ||
        pathname === "/signup"
      ) {
        const url = new URL(`https://${ROOT_DOMAIN}`)
        url.pathname = pathname
        return NextResponse.redirect(url)
      }

      // Validate subdomain is an actual published store
      const storeExists = await resolveStoreBySlug(subdomain)
      if (!storeExists) {
        return new NextResponse("Store not found", { status: 404 })
      }

      return createSubdomainRewrite(request, subdomain)
    }

    // --- Root domain / www (domain.com) ---
    // Stores are only accessible via subdomains or custom domains.
    // All root domain paths are website pages — no slug redirect needed.
  }

  // --- 3. Normal app domain handling (auth middleware) ---
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    request.nextUrl.pathname.startsWith("/dashboard")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  supabaseResponse.headers.set("x-pathname", pathname)
  return supabaseResponse
}
