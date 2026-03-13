import type { Metadata } from "next"
import { getArticle, getCategory } from "@/lib/docs/content"

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

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
    alternates: {
      canonical: `${APP_URL}/docs/${category}/${slug}`,
    },
    openGraph: {
      title: `${article.title.en} — Leadivo Docs`,
      description: article.description.en,
      type: "article",
      url: `${APP_URL}/docs/${category}/${slug}`,
    },
  }
}

export default async function ArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await params
  const cat = getCategory(category)
  const article = getArticle(category, slug)

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
      { "@type": "ListItem", position: 2, name: "Docs", item: `${APP_URL}/docs` },
      ...(cat
        ? [{ "@type": "ListItem", position: 3, name: cat.title.en, item: `${APP_URL}/docs/${category}` }]
        : []),
      ...(article
        ? [{ "@type": "ListItem", position: 4, name: article.title.en, item: `${APP_URL}/docs/${category}/${slug}` }]
        : []),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  )
}
