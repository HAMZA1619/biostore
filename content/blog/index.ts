/**
 * Blog Content Index
 *
 * All blog articles organized by type. Each article is an MDX file
 * with frontmatter metadata (title, slug, description, keywords, etc.).
 *
 * Folder structure:
 *   content/blog/global/       → Global articles (no country-specific content)
 *   content/blog/countries/dz/ → Algeria-specific articles
 *   content/blog/countries/ma/ → Morocco-specific articles
 *   content/blog/countries/sa/ → Saudi Arabia-specific articles
 *   content/blog/countries/eg/ → Egypt-specific articles
 *   content/blog/countries/tn/ → Tunisia-specific articles
 *   content/blog/countries/ae/ → UAE-specific articles
 *   content/blog/countries/ng/ → Nigeria-specific articles
 *
 * URL structure for /blog route:
 *   /blog                           → Blog index (all articles)
 *   /blog/[slug]                    → Individual article (English)
 *   /blog/fr/[slug]                 → French article
 *   /blog/ar/[slug]                 → Arabic article
 *
 * Each article frontmatter includes:
 *   - title, slug, description (for meta tags)
 *   - keywords (for SEO)
 *   - category, tags (for filtering)
 *   - language, country (for i18n routing)
 *   - translationKey (to connect translated versions — same key = same article)
 *   - image, imageAlt (for OG images)
 *   - readingTime, date, updated
 *   - featured (for homepage/sticky placement)
 *
 * JSON-LD schemas to generate per article:
 *   - Article schema (every post)
 *   - FAQPage schema (posts with FAQ sections)
 *   - HowTo schema (step-by-step guides)
 *   - BreadcrumbList (for navigation)
 */

export const BLOG_CATEGORIES = [
  { slug: "getting-started", label: "Getting Started", description: "Guides to launch your online store" },
  { slug: "growth", label: "Growth", description: "Strategies to grow your ecommerce business" },
  { slug: "social-commerce", label: "Social Commerce", description: "Sell on Instagram, TikTok, and WhatsApp" },
  { slug: "country-guides", label: "Country Guides", description: "Ecommerce guides for specific countries" },
] as const

export const BLOG_ARTICLES = {
  global: [
    {
      slug: "how-to-start-selling-online",
      file: "global/how-to-start-selling-online.mdx",
      category: "getting-started",
      language: "en",
      featured: true,
    },
    {
      slug: "reduce-cod-return-rates",
      file: "global/reduce-cod-return-rates.mdx",
      category: "growth",
      language: "en",
      featured: true,
    },
    {
      slug: "instagram-to-store",
      file: "global/instagram-to-store.mdx",
      category: "social-commerce",
      language: "en",
      featured: false,
    },
    {
      slug: "whatsapp-commerce-guide",
      file: "global/whatsapp-commerce-guide.mdx",
      category: "social-commerce",
      language: "en",
      featured: true,
    },
    {
      slug: "cod-vs-online-payment",
      file: "global/cod-vs-online-payment.mdx",
      category: "growth",
      language: "en",
      featured: false,
    },
    {
      slug: "product-page-that-converts",
      file: "global/product-page-that-converts.mdx",
      category: "growth",
      language: "en",
      featured: false,
    },
    {
      slug: "tiktok-to-store",
      file: "global/tiktok-to-store.mdx",
      category: "social-commerce",
      language: "en",
      featured: false,
    },
    {
      slug: "pricing-for-cod-markets",
      file: "global/pricing-for-cod-markets.mdx",
      category: "growth",
      language: "en",
      featured: false,
    },
  ],
  countries: {
    dz: [
      { slug: "how-to-start-ecommerce-algeria", file: "countries/dz/how-to-start-ecommerce-algeria.mdx", language: "en", featured: true },
      { slug: "comment-lancer-ecommerce-algerie", file: "countries/dz/comment-lancer-ecommerce-algerie.mdx", language: "fr", featured: true },
      { slug: "best-delivery-companies-algeria", file: "countries/dz/best-delivery-companies-algeria.mdx", language: "en", featured: false },
      { slug: "meilleures-entreprises-livraison-algerie", file: "countries/dz/meilleures-entreprises-livraison-algerie.mdx", language: "fr", featured: false },
    ],
    ma: [
      { slug: "how-to-start-ecommerce-morocco", file: "countries/ma/how-to-start-ecommerce-morocco.mdx", language: "en", featured: false },
      { slug: "comment-lancer-ecommerce-maroc", file: "countries/ma/comment-lancer-ecommerce-maroc.mdx", language: "fr", featured: false },
    ],
    sa: [
      { slug: "how-to-start-ecommerce-saudi-arabia", file: "countries/sa/how-to-start-ecommerce-saudi-arabia.mdx", language: "en", featured: false },
      { slug: "how-to-start-ecommerce-saudi-arabia-ar", file: "countries/sa/كيف-تبدأ-التجارة-الالكترونية-السعودية.mdx", language: "ar", featured: false },
    ],
    eg: [
      { slug: "how-to-start-ecommerce-egypt", file: "countries/eg/how-to-start-ecommerce-egypt.mdx", language: "en", featured: false },
      { slug: "how-to-start-ecommerce-egypt-ar", file: "countries/eg/كيف-تبدأ-التجارة-الالكترونية-مصر.mdx", language: "ar", featured: false },
    ],
    tn: [
      { slug: "how-to-start-ecommerce-tunisia", file: "countries/tn/how-to-start-ecommerce-tunisia.mdx", language: "en", featured: false },
      { slug: "comment-lancer-ecommerce-tunisie", file: "countries/tn/comment-lancer-ecommerce-tunisie.mdx", language: "fr", featured: false },
    ],
    ae: [
      { slug: "how-to-start-ecommerce-uae", file: "countries/ae/how-to-start-ecommerce-uae.mdx", language: "en", featured: false },
    ],
    ng: [
      { slug: "how-to-start-ecommerce-nigeria", file: "countries/ng/how-to-start-ecommerce-nigeria.mdx", language: "en", featured: false },
    ],
  },
} as const
