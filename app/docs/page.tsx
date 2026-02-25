"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CATEGORIES, searchArticles } from "@/lib/docs/content"
import { Search } from "lucide-react"
import * as Icons from "lucide-react"

export default function DocsPage() {
  const [query, setQuery] = useState("")
  const lang = "en"

  const results = query.trim() ? searchArticles(query, lang) : null

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">How can we help?</h1>
        <p className="text-muted-foreground">
          Browse our guides to learn how to set up and manage your store.
        </p>
      </div>

      <div className="relative mx-auto max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {results ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""}
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
              No results found. Try a different search term.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const IconComponent =
              (Icons as Record<string, React.ComponentType<{ className?: string }>>)[cat.icon] ?? Icons.FileText
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
