"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import type { BlogPostMeta } from "@/lib/blog/types"

function isUpdated(post: BlogPostMeta) {
  return post.updated && post.updated !== post.date && new Date(post.updated) > new Date(post.date)
}

export function BlogCard({ post }: { post: BlogPostMeta }) {
  const { t, i18n } = useTranslation()
  const updated = isUpdated(post)
  const locale = i18n.language || "en"

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/50">
        <div className="relative aspect-[16/9] bg-muted">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.imageAlt || post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-bold text-muted-foreground/20">
              {post.title.charAt(0)}
            </div>
          )}
          {updated && (
            <Badge className="absolute top-2 end-2 gap-1 bg-green-600 text-white text-[10px] hover:bg-green-600">
              <RefreshCw className="h-2.5 w-2.5" />
              {t("blog.updated")}
            </Badge>
          )}
        </div>
        <div className="p-4">
          <Badge variant="secondary" className="mb-2 text-xs capitalize">
            {t(`blog.categories.${post.category}`, post.category.replace("-", " "))}
          </Badge>
          <h3 className="mb-1 line-clamp-2 font-semibold leading-tight group-hover:text-primary">
            {post.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.date).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readingTime}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export function BlogCardFeatured({ post }: { post: BlogPostMeta }) {
  const { t, i18n } = useTranslation()
  const updated = isUpdated(post)
  const locale = i18n.language || "en"

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/50">
        <div className="relative aspect-[2/1] bg-muted">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.imageAlt || post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl font-bold text-muted-foreground/20">
              {post.title.charAt(0)}
            </div>
          )}
          {updated && (
            <Badge className="absolute top-3 end-3 gap-1 bg-green-600 text-white text-xs hover:bg-green-600">
              <RefreshCw className="h-3 w-3" />
              {t("blog.updated")}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize">
              {t(`blog.categories.${post.category}`, post.category.replace("-", " "))}
            </Badge>
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              {t("blog.featured")}
            </Badge>
          </div>
          <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug group-hover:text-primary sm:text-xl">
            {post.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {post.description}
          </p>
          <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.date).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readingTime}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
