export interface BlogPost {
  slug: string
  title: string
  description: string
  author: string
  date: string
  updated: string
  category: string
  tags: string[]
  keywords: string[]
  readingTime: string
  language: string
  country?: string
  featured: boolean
  image: string
  imageAlt: string
  content: string
}

export type BlogPostMeta = Omit<BlogPost, "content">

export const BLOG_CATEGORIES = [
  { slug: "getting-started", label: "Getting Started", description: "Guides to launch your online store" },
  { slug: "growth", label: "Growth", description: "Strategies to grow your ecommerce business" },
  { slug: "social-commerce", label: "Social Commerce", description: "Sell on Instagram, TikTok, and WhatsApp" },
  { slug: "country-guides", label: "Country Guides", description: "Ecommerce guides for specific countries" },
] as const
