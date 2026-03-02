import type { Metadata } from "next"
import { LandingPage } from "@/components/marketing/landing-page"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://biostore.app"

export const metadata: Metadata = {
  title: "BioStore — Turn Your Social Media Into a Store",
  description:
    "Create a beautiful storefront in seconds. Share one link in your bio. Receive orders via WhatsApp or COD — no coding needed. Free trial included.",
  keywords: [
    "online store builder",
    "link in bio store",
    "ecommerce platform",
    "social media store",
    "COD store",
    "WhatsApp orders",
    "create online store",
    "storefront builder",
    "no-code ecommerce",
    "sell on Instagram",
    "sell on TikTok",
  ],
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "BioStore",
    title: "BioStore — Turn Your Social Media Into a Store",
    description:
      "Create a beautiful storefront in seconds. Share one link in your bio. Receive orders directly — no coding needed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BioStore — Turn Your Social Media Into a Store",
    description:
      "Create a beautiful storefront in seconds. Share one link in your bio. Receive orders directly — no coding needed.",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BioStore",
  url: APP_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Create a beautiful storefront in seconds. Share one link in your bio. Receive orders directly — no coding needed.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free trial included",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "120",
  },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is BioStore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "BioStore is a platform that lets you create a beautiful online storefront in seconds. Share one link in your bio and start receiving orders — no coding or technical skills needed.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need coding skills?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. BioStore is designed so anyone can create and manage a store with zero technical knowledge.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "BioStore supports Cash on Delivery (COD) and integrates with WhatsApp for direct order communication with customers.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use my own domain?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can connect your own custom domain to your BioStore storefront.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. BioStore offers a free trial so you can explore all features before committing to a subscription.",
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingPage />
    </>
  )
}
