import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getCategory, getArticle } from "@/lib/docs/content"
import { ChevronRight } from "lucide-react"

function StepImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-lg border bg-muted/30">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={450}
        className="w-full"
        unoptimized
      />
    </div>
  )
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category: catSlug, slug } = await params
  const category = getCategory(catSlug)
  const article = getArticle(catSlug, slug)
  if (!category || !article) notFound()

  const lang = "en"

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/docs" className="hover:underline">
            Docs
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/docs/${catSlug}`} className="hover:underline">
            {category.title[lang]}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate">{article.title[lang]}</span>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{article.title[lang]}</h1>
        <p className="text-muted-foreground mt-1">{article.description[lang]}</p>
      </div>

      <div className="space-y-10">
        {article.steps.map((step, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold">{step.title[lang]}</h2>
                <p className="text-muted-foreground">{step.description[lang]}</p>
              </div>
            </div>
            {step.image && (
              <div className="ml-10">
                <StepImage src={step.image} alt={step.title[lang]} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
