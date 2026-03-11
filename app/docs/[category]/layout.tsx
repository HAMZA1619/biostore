import type { Metadata } from "next"
import { getCategory } from "@/lib/docs/content"

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
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
