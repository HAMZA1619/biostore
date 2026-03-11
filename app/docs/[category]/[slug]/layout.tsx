import type { Metadata } from "next"
import { getArticle } from "@/lib/docs/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { category, slug } = await params
  const article = getArticle(category, slug)
  if (!article) return {}

  return {
    title: `${article.title.en} — Leadivo Docs`,
    description: article.description.en,
  }
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children
}
