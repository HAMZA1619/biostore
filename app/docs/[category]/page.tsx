import Link from "next/link"
import { notFound } from "next/navigation"
import { getCategory, getCategoryArticles } from "@/lib/docs/content"
import { ChevronRight } from "lucide-react"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const articles = getCategoryArticles(slug)
  const lang = "en"

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/docs" className="hover:underline">
            Docs
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>{category.title[lang]}</span>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{category.title[lang]}</h1>
        <p className="text-muted-foreground mt-1">{category.description[lang]}</p>
      </div>

      <div className="space-y-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/docs/${slug}/${article.slug}`}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-medium">{article.title[lang]}</p>
              <p className="text-sm text-muted-foreground">
                {article.description[lang]}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
