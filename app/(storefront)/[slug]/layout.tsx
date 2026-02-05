import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { StoreHeader } from "@/components/layout/store-header"
import { StoreFooter } from "@/components/layout/store-footer"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: store } = await supabase
    .from("stores")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!store) return {}

  return {
    title: store.name,
    description: store.description || `Shop at ${store.name}`,
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("name, slug, logo_url, banner_url, phone, primary_color, accent_color, theme, show_branding")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!store) notFound()

  return (
    <div
      className="min-h-screen"
      data-theme={store.theme || "default"}
      style={
        {
          "--store-primary": store.primary_color || "#000000",
          "--store-accent": store.accent_color || "#3B82F6",
        } as React.CSSProperties
      }
    >
      <StoreHeader slug={store.slug} name={store.name} logoUrl={store.logo_url} bannerUrl={store.banner_url} />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
      <StoreFooter phone={store.phone} showBranding={store.show_branding} />
    </div>
  )
}
