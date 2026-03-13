import type { Metadata } from "next"
import { getCategory } from "@/lib/docs/content"

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) return {}

  return {
    title: `${category.title.en} — Leadivo Docs`,
    description: category.description.en,
    alternates: {
      canonical: `${APP_URL}/docs/${slug}`,
    },
    openGraph: {
      type: "website",
      title: `${category.title.en} — Leadivo Docs`,
      description: category.description.en,
      url: `${APP_URL}/docs/${slug}`,
    },
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
