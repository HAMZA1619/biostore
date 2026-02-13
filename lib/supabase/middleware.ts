import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

const APP_HOSTNAME = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : "localhost"

function isCustomDomainRequest(hostname: string): boolean {
  if (hostname === APP_HOSTNAME) return false
  if (hostname === "localhost" || hostname === "127.0.0.1") return false
  if (hostname.endsWith(`.${APP_HOSTNAME}`)) return false
  return true
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

export async function updateSession(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  const pathname = request.nextUrl.pathname

  // --- Custom domain handling ---
  if (isCustomDomainRequest(hostname)) {
    // Dashboard/auth routes should not work on custom domains
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

    // If the path already starts with the slug, redirect to the clean version
    if (pathname.startsWith(`/${slug}`)) {
      const cleanPath = pathname.slice(`/${slug}`.length) || "/"
      const url = request.nextUrl.clone()
      url.pathname = cleanPath
      return NextResponse.redirect(url, 301)
    }

    // Rewrite to the slug-based route internally
    const url = request.nextUrl.clone()
    url.pathname = `/${slug}${pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set("x-custom-domain", "true")
    response.headers.set("x-store-slug", slug)
    return response
  }

  // --- Normal app domain handling (existing logic) ---
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
