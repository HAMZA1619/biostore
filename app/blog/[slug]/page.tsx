import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { MDXRemote } from "next-mdx-remote/rsc"
import { ChevronRight, ChevronLeft, Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { mdxComponents } from "@/components/blog/mdx-components"
import { BlogCard } from "@/components/blog/blog-card"
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog/content"
import { TableOfContents } from "@/components/blog/table-of-contents"
import { getT } from "@/lib/i18n/storefront"

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `${APP_URL}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${APP_URL}/blog/${post.slug}`,
      locale: post.language === "ar" ? "ar_AR" : post.language === "fr" ? "fr_FR" : "en_US",
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [post.author],
      tags: post.tags,
      images: post.image ? [{ url: `${APP_URL}${post.image}`, alt: post.imageAlt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [`${APP_URL}${post.image}`] : undefined,
    },
  }
}

function extractFAQs(content: string): { question: string; answer: string }[] {
  const faqSection = content.split(/^## (?:FAQ|Frequently Asked Questions|الأسئلة الشائعة|Questions fréquentes)/im)[1]
  if (!faqSection) return []

  const faqs: { question: string; answer: string }[] = []
  const lines = faqSection.split("\n")
  let currentQuestion = ""
  let currentAnswer = ""

  for (const line of lines) {
    const questionMatch = line.match(/^###\s+(.+)/)
    if (questionMatch) {
      if (currentQuestion && currentAnswer) {
        faqs.push({ question: currentQuestion, answer: currentAnswer.trim() })
      }
      currentQuestion = questionMatch[1].replace(/\*\*/g, "")
      currentAnswer = ""
    } else if (currentQuestion && line.trim()) {
      currentAnswer += " " + line.trim()
    }
  }

  if (currentQuestion && currentAnswer) {
    faqs.push({ question: currentQuestion, answer: currentAnswer.trim() })
  }

  return faqs
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = getRelatedPosts(slug, post.category, 3)
  const faqs = extractFAQs(post.content)
  const isRtl = post.language === "ar"
  const t = getT(post.language)
  const BackArrow = isRtl ? ArrowRight : ArrowLeft
  const Chevron = isRtl ? ChevronLeft : ChevronRight

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.image ? `${APP_URL}${post.image}` : undefined,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Leadivo",
      logo: { "@type": "ImageObject", url: `${APP_URL}/logo.png` },
    },
    datePublished: post.date,
    dateModified: post.updated,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${APP_URL}/blog/${post.slug}` },
    inLanguage: post.language,
    keywords: post.keywords.join(", "),
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
      { "@type": "ListItem", position: 2, name: t("blog.title"), item: `${APP_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${APP_URL}/blog/${post.slug}` },
    ],
  }

  const faqJsonLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <article className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/blog" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <BackArrow className="h-3.5 w-3.5" />
            {t("blog.title")}
          </Link>
          <Chevron className="h-3.5 w-3.5" />
          <span className="truncate text-foreground">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <Badge variant="secondary" className="mb-3 capitalize">
            {t(`blog.categories.${post.category}`, post.category.replace("-", " "))}
          </Badge>
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="mb-4 text-lg text-muted-foreground">{post.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{post.author}</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.date).toLocaleDateString(post.language === "ar" ? "ar" : post.language === "fr" ? "fr-FR" : "en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>
        </header>

        {/* Table of Contents */}
        <TableOfContents content={post.content} />

        {/* Content */}
        <div className="blog-content">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl border-t pt-10">
          <h2 className="mb-6 text-2xl font-bold">{t("blog.relatedArticles")}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
