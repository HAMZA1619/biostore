"use client"

import { useMemo, useState } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { BlogCard, BlogCardFeatured } from "@/components/blog/blog-card"
import { BLOG_CATEGORIES, type BlogPostMeta } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

const POSTS_PER_PAGE = 12

export function BlogIndex({ posts }: { posts: BlogPostMeta[] }) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const featured = useMemo(() => posts.filter((p) => p.featured), [posts])

  const filtered = useMemo(() => {
    let result = posts
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
      )
    }
    return result
  }, [posts, activeCategory, query])

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  const showFeatured = !activeCategory && !query.trim() && page === 1

  function handleCategoryChange(cat: string | null) {
    setActiveCategory(cat)
    setPage(1)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setPage(1)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("blog.title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("blog.subtitle")}
        </p>
      </div>

      {showFeatured && featured.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {featured.slice(0, 2).map((post) => (
              <BlogCardFeatured key={post.slug} post={post} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={t("blog.searchPlaceholder")}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 ps-9 pe-3 text-sm outline-none ring-ring focus:ring-2"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            !activeCategory ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          {t("blog.all")}
        </button>
        {BLOG_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleCategoryChange(cat.slug)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              activeCategory === cat.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {t(`blog.categories.${cat.slug}`, cat.label)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t("blog.noArticles")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors",
                    p === page
                      ? "bg-primary text-primary-foreground"
                      : "border hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
