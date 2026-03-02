"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CATEGORIES, searchArticles } from "@/lib/docs/content"
import { Search } from "lucide-react"
import * as Icons from "lucide-react"
import { useLanguageStore } from "@/lib/store/language-store"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

export default function DocsPage() {
  const [query, setQuery] = useState("")
  const lang = useLanguageStore((s) => s.language)
  const { t } = useTranslation()

  const results = query.trim() ? searchArticles(query, lang) : null

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("docs.title")}</h1>
        <p className="text-muted-foreground">
          {t("docs.subtitle")}
        </p>
      </div>

      <div className="relative mx-auto max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("docs.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {results ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {results.length} {results.length !== 1 ? t("docs.articles") : t("docs.article")}
          </p>
          {results.map((article) => (
            <Link
              key={article.slug}
              href={`/docs/${article.category}/${article.slug}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <p className="font-medium">{article.title[lang]}</p>
              <p className="text-sm text-muted-foreground">
                {article.description[lang]}
              </p>
            </Link>
          ))}
          {results.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {t("docs.noResults")}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const IconComponent =
              (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[cat.icon] ?? Icons.FileText
            return (
              <Link key={cat.slug} href={`/docs/${cat.slug}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <IconComponent className="h-6 w-6 text-primary mb-2" />
                    <CardTitle className="text-base">{cat.title[lang]}</CardTitle>
                    <CardDescription>{cat.description[lang]}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
