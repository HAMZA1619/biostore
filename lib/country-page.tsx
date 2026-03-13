import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LandingPage } from "@/components/marketing/landing-page"
import type { CountryConfig } from "@/lib/countries"

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

export function generateCountryMetadata(country: CountryConfig): Metadata {
  return {
    title: country.metaTitle,
    description: country.metaDescription,
    keywords: country.keywords,
    alternates: {
      canonical: `${APP_URL}/${country.code}`,
      languages: {
        en: "/",
        fr: "/fr",
        ar: "/ar",
        [country.hreflang]: `/${country.code}`,
      },
    },
    openGraph: {
      type: "website",
      url: `${APP_URL}/${country.code}`,
      siteName: "Leadivo",
      locale: country.lang === "ar" ? "ar_AR" : "fr_FR",
      title: country.metaTitle,
      description: country.metaDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: country.metaTitle,
      description: country.metaDescription,
    },
  }
}

export function generateCountryJsonLd(country: CountryConfig) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Leadivo",
    url: APP_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: country.lang,
    ...(country.localName
      ? {
          areaServed: {
            "@type": "Country",
            name: country.name,
          },
        }
      : {}),
    description: country.metaDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: country.lang === "ar" ? "تجربة مجانية" : "Essai gratuit inclus",
    },
  }

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Leadivo",
    url: APP_URL,
    logo: `${APP_URL}/icon.png`,
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: country.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }

  return { jsonLd, orgJsonLd, faqJsonLd }
}

export async function CountryPage({
  country,
  searchParams,
}: {
  country: CountryConfig
  searchParams: Promise<{ landing?: string }>
}) {
  const { landing } = await searchParams

  if (!landing) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) redirect("/dashboard")
  }

  const { jsonLd, orgJsonLd, faqJsonLd } = generateCountryJsonLd(country)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <LandingPage lang={country.lang} countryName={country.localName} />
    </>
  )
}
