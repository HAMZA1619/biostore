import "server-only"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { BLOG_ARTICLES } from "@/content/blog/index"
import type { BlogPost, BlogPostMeta } from "@/lib/blog/types"

export { BLOG_CATEGORIES } from "@/lib/blog/types"
export type { BlogPost, BlogPostMeta } from "@/lib/blog/types"

function getContentDir() {
  return path.join(process.cwd(), "content/blog")
}

function getAllFilePaths(): { slug: string; file: string }[] {
  const files: { slug: string; file: string }[] = []

  for (const article of BLOG_ARTICLES.global) {
    files.push({ slug: article.slug, file: article.file })
  }

  for (const countryArticles of Object.values(BLOG_ARTICLES.countries)) {
    for (const article of countryArticles) {
      files.push({ slug: article.slug, file: article.file })
    }
  }

  return files
}

function parsePost(slug: string, filePath: string): BlogPost | null {
  const fullPath = path.join(getContentDir(), filePath)
  if (!fs.existsSync(fullPath)) return null

  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data, content } = matter(raw)

  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    author: data.author || "Leadivo Team",
    date: data.date || "",
    updated: data.updated || data.date || "",
    category: data.category || "",
    tags: data.tags || [],
    keywords: data.keywords || [],
    readingTime: data.readingTime || "",
    language: data.language || "en",
    country: data.country,
    featured: data.featured || false,
    image: data.image || "",
    imageAlt: data.imageAlt || "",
    content,
  }
}

export function getAllPosts(): BlogPostMeta[] {
  const files = getAllFilePaths()
  const posts: BlogPostMeta[] = []

  for (const { slug, file } of files) {
    const post = parsePost(slug, file)
    if (post) {
      const { content: _, ...meta } = post
      posts.push(meta)
    }
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  const files = getAllFilePaths()
  const entry = files.find((f) => f.slug === slug)
  if (!entry) return null
  return parsePost(entry.slug, entry.file)
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPosts().filter((p) => p.category === category)
}

export function getRelatedPosts(currentSlug: string, category: string, limit = 3): BlogPostMeta[] {
  return getAllPosts()
    .filter((p) => p.slug !== currentSlug && p.category === category)
    .slice(0, limit)
}

export function getFeaturedPosts(): BlogPostMeta[] {
  return getAllPosts().filter((p) => p.featured)
}
