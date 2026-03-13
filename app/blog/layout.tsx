import type { Metadata } from "next"
import { BlogShell } from "@/components/blog/blog-shell"

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides and strategies to grow your ecommerce business. Learn about social selling, COD management, and how to start selling online worldwide.",
  alternates: {
    canonical: `${APP_URL}/blog`,
    types: {
      "application/rss+xml": `${APP_URL}/blog/feed.xml`,
    },
  },
  openGraph: {
    type: "website",
    title: "Blog — Leadivo",
    description:
      "Guides and strategies to grow your ecommerce business. Learn about social selling, COD management, and more.",
    url: `${APP_URL}/blog`,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <BlogShell>{children}</BlogShell>
}
