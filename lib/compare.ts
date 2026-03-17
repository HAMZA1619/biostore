export interface CompareFeature {
  key: string
  leadivo: boolean | string
  other: boolean | string
}

export interface CompareHighlight {
  titleKey: string
  descKey: string
  icon: string
}

export interface ComparePlatform {
  slug: string
  name: string
  metaTitle: { en: string; ar: string; fr: string }
  metaDescription: { en: string; ar: string; fr: string }
  keywords: string[]
  /** What this platform is known for — always respectful */
  knownForKey: string
  /** Why Leadivo is a great fit for the user */
  leadivoFitKey: string
  features: CompareFeature[]
  highlights: CompareHighlight[]
  faqs: Array<{
    question: { en: string; ar: string; fr: string }
    answer: { en: string; ar: string; fr: string }
  }>
}

export const COMPARE_PLATFORMS: ComparePlatform[] = [
  {
    slug: "shopify",
    name: "Shopify",
    metaTitle: {
      en: "Leadivo vs Shopify — COD Store Builder Comparison",
      ar: "Leadivo مقابل Shopify — أفضل منشئ متاجر الدفع عند الاستلام",
      fr: "Leadivo vs Shopify — Créateur de boutiques COD pour vendeurs sociaux",
    },
    metaDescription: {
      en: "Compare Leadivo and Shopify. See why social sellers and COD businesses choose Leadivo for fast, mobile-first storefronts with built-in WhatsApp and COD analytics.",
      ar: "قارن بين Leadivo وShopify. اكتشف لماذا يختار البائعون عبر السوشيال ميديا Leadivo لمتاجر COD سريعة ومتوافقة مع الهاتف.",
      fr: "Comparez Leadivo et Shopify. Découvrez pourquoi les vendeurs sociaux choisissent Leadivo pour des boutiques COD rapides et mobiles.",
    },
    keywords: [
      "leadivo vs shopify",
      "shopify alternative",
      "cod store builder",
      "shopify alternative for cod",
      "social media store builder",
      "shopify alternative arabic",
      "ecommerce platform cod",
    ],
    knownForKey: "compare.shopify.knownFor",
    leadivoFitKey: "compare.shopify.leadivoFit",
    features: [
      { key: "compare.feature.setup", leadivo: "2 min", other: "30+ min" },
      { key: "compare.feature.cod", leadivo: true, other: "plugin" },
      { key: "compare.feature.codAnalytics", leadivo: true, other: false },
      { key: "compare.feature.whatsapp", leadivo: true, other: "plugin" },
      { key: "compare.feature.cartRecovery", leadivo: true, other: true },
      { key: "compare.feature.multiLanguage", leadivo: true, other: true },
      { key: "compare.feature.multiCurrency", leadivo: true, other: true },
      { key: "compare.feature.mobileFirst", leadivo: true, other: true },
      { key: "compare.feature.customDomain", leadivo: true, other: true },
      { key: "compare.feature.designBuilder", leadivo: true, other: true },
      { key: "compare.feature.metaCapi", leadivo: true, other: "plugin" },
      { key: "compare.feature.shippingZones", leadivo: true, other: true },
      { key: "compare.feature.pricing", leadivo: "$19/mo", other: "$39/mo+" },
    ],
    highlights: [
      { titleKey: "compare.highlight.codFirst.title", descKey: "compare.highlight.codFirst.desc", icon: "ShoppingCart" },
      { titleKey: "compare.highlight.instant.title", descKey: "compare.highlight.instant.desc", icon: "Zap" },
      { titleKey: "compare.highlight.social.title", descKey: "compare.highlight.social.desc", icon: "Smartphone" },
    ],
    faqs: [
      {
        question: {
          en: "Is Leadivo a good alternative to Shopify for COD sellers?",
          ar: "هل Leadivo بديل جيد لـ Shopify لبائعي الدفع عند الاستلام؟",
          fr: "Leadivo est-il une bonne alternative à Shopify pour les vendeurs COD ?",
        },
        answer: {
          en: "Leadivo is purpose-built for COD and social media sellers. You get built-in COD analytics, WhatsApp order notifications, and abandoned cart recovery — all included from day one with no plugins needed.",
          ar: "Leadivo مصمم خصيصاً لبائعي الدفع عند الاستلام والسوشيال ميديا. تحصل على تحليلات COD مدمجة وإشعارات طلبات واتساب واسترداد السلات المتروكة — كل ذلك مشمول من اليوم الأول بدون إضافات.",
          fr: "Leadivo est conçu pour les vendeurs COD et réseaux sociaux. Vous bénéficiez d'analytiques COD intégrées, de notifications WhatsApp et de récupération de paniers — tout inclus dès le premier jour sans plugins.",
        },
      },
      {
        question: {
          en: "Can I migrate from Shopify to Leadivo?",
          ar: "هل يمكنني الانتقال من Shopify إلى Leadivo؟",
          fr: "Puis-je migrer de Shopify vers Leadivo ?",
        },
        answer: {
          en: "You can set up your Leadivo store in under 2 minutes and add your products right away. Many sellers run both stores during transition, then switch their bio link once ready.",
          ar: "يمكنك إعداد متجر Leadivo في أقل من دقيقتين وإضافة منتجاتك فوراً. كثير من البائعين يشغلون المتجرين أثناء الانتقال، ثم يغيرون رابط البايو عندما يكونون جاهزين.",
          fr: "Vous pouvez créer votre boutique Leadivo en moins de 2 minutes et ajouter vos produits immédiatement. Beaucoup de vendeurs font tourner les deux boutiques pendant la transition, puis changent leur lien bio une fois prêts.",
        },
      },
    ],
  },
  {
    slug: "woocommerce",
    name: "WooCommerce",
    metaTitle: {
      en: "Leadivo vs WooCommerce — No-Code COD Store Builder",
      ar: "Leadivo مقابل WooCommerce — منشئ متاجر COD بدون برمجة",
      fr: "Leadivo vs WooCommerce — Créateur de boutiques COD sans code",
    },
    metaDescription: {
      en: "Compare Leadivo and WooCommerce. Launch a mobile-first COD store in 2 minutes with zero hosting, plugins, or coding — all included in one simple plan.",
      ar: "قارن بين Leadivo وWooCommerce. أطلق متجر COD متوافق مع الهاتف في دقيقتين بدون استضافة أو إضافات أو برمجة.",
      fr: "Comparez Leadivo et WooCommerce. Lancez une boutique COD mobile en 2 minutes sans hébergement, plugins ou code.",
    },
    keywords: [
      "leadivo vs woocommerce",
      "woocommerce alternative",
      "woocommerce alternative no coding",
      "cod store no hosting",
      "ecommerce without wordpress",
      "simple online store builder",
    ],
    knownForKey: "compare.woocommerce.knownFor",
    leadivoFitKey: "compare.woocommerce.leadivoFit",
    features: [
      { key: "compare.feature.setup", leadivo: "2 min", other: "1+ hour" },
      { key: "compare.feature.hosting", leadivo: true, other: false },
      { key: "compare.feature.noCode", leadivo: true, other: false },
      { key: "compare.feature.cod", leadivo: true, other: "plugin" },
      { key: "compare.feature.codAnalytics", leadivo: true, other: false },
      { key: "compare.feature.whatsapp", leadivo: true, other: "plugin" },
      { key: "compare.feature.cartRecovery", leadivo: true, other: "plugin" },
      { key: "compare.feature.multiLanguage", leadivo: true, other: "plugin" },
      { key: "compare.feature.multiCurrency", leadivo: true, other: "plugin" },
      { key: "compare.feature.mobileFirst", leadivo: true, other: "theme" },
      { key: "compare.feature.metaCapi", leadivo: true, other: "plugin" },
      { key: "compare.feature.maintenance", leadivo: true, other: false },
      { key: "compare.feature.pricing", leadivo: "$19/mo", other: "$20+/mo*" },
    ],
    highlights: [
      { titleKey: "compare.highlight.noSetup.title", descKey: "compare.highlight.noSetup.desc", icon: "Zap" },
      { titleKey: "compare.highlight.allInOne.title", descKey: "compare.highlight.allInOne.desc", icon: "Package" },
      { titleKey: "compare.highlight.codFirst.title", descKey: "compare.highlight.codFirst.desc", icon: "ShoppingCart" },
    ],
    faqs: [
      {
        question: {
          en: "Do I need hosting or WordPress to use Leadivo?",
          ar: "هل أحتاج استضافة أو ووردبريس لاستخدام Leadivo؟",
          fr: "Ai-je besoin d'un hébergement ou de WordPress pour utiliser Leadivo ?",
        },
        answer: {
          en: "Leadivo is fully hosted — just sign up, add products, and share your link. Everything is managed for you including hosting, security updates, and performance optimization.",
          ar: "Leadivo مستضاف بالكامل — فقط سجّل، أضف المنتجات، وشارك رابطك. كل شيء مُدار لك بما في ذلك الاستضافة وتحديثات الأمان وتحسين الأداء.",
          fr: "Leadivo est entièrement hébergé — inscrivez-vous, ajoutez des produits et partagez votre lien. Tout est géré pour vous, y compris l'hébergement, les mises à jour de sécurité et l'optimisation des performances.",
        },
      },
      {
        question: {
          en: "Is Leadivo easier to use than WooCommerce?",
          ar: "هل Leadivo أسهل استخداماً من WooCommerce؟",
          fr: "Leadivo est-il plus facile à utiliser que WooCommerce ?",
        },
        answer: {
          en: "Leadivo is designed for non-technical users. You can create your store, add products, configure shipping, and start selling in under 2 minutes — with zero coding or plugin management.",
          ar: "Leadivo مصمم للمستخدمين غير التقنيين. يمكنك إنشاء متجرك وإضافة المنتجات وإعداد الشحن والبدء بالبيع في أقل من دقيقتين — بدون أي برمجة أو إدارة إضافات.",
          fr: "Leadivo est conçu pour les utilisateurs non techniques. Vous pouvez créer votre boutique, ajouter des produits, configurer la livraison et commencer à vendre en moins de 2 minutes — sans code ni gestion de plugins.",
        },
      },
    ],
  },
  {
    slug: "youcan",
    name: "YouCan",
    metaTitle: {
      en: "Leadivo vs YouCan — COD & Multi-Market Comparison",
      ar: "Leadivo مقابل YouCan — تحليلات COD ومنشئ متاجر متعدد الأسواق",
      fr: "Leadivo vs YouCan — Analytiques COD et boutique multi-marché",
    },
    metaDescription: {
      en: "Compare Leadivo and YouCan. Built-in COD analytics, WhatsApp cart recovery, multi-market pricing, and 20+ languages — purpose-built for social sellers.",
      ar: "قارن بين Leadivo وYouCan. تحليلات COD مدمجة واسترداد سلات واتساب وتسعير متعدد الأسواق و20+ لغة — مصمم خصيصاً لبائعي السوشيال.",
      fr: "Comparez Leadivo et YouCan. Analytiques COD intégrées, récupération WhatsApp, tarification multi-marché et 20+ langues — conçu pour les vendeurs sociaux.",
    },
    keywords: [
      "leadivo vs youcan",
      "youcan alternative",
      "youcan alternative cod",
      "cod ecommerce platform",
      "multi market store builder",
      "arabic ecommerce platform",
    ],
    knownForKey: "compare.youcan.knownFor",
    leadivoFitKey: "compare.youcan.leadivoFit",
    features: [
      { key: "compare.feature.setup", leadivo: "2 min", other: "5+ min" },
      { key: "compare.feature.cod", leadivo: true, other: true },
      { key: "compare.feature.codAnalytics", leadivo: true, other: false },
      { key: "compare.feature.whatsapp", leadivo: true, other: false },
      { key: "compare.feature.cartRecovery", leadivo: true, other: false },
      { key: "compare.feature.multiLanguage", leadivo: "20 langs", other: "limited" },
      { key: "compare.feature.multiCurrency", leadivo: true, other: true },
      { key: "compare.feature.multiMarket", leadivo: true, other: false },
      { key: "compare.feature.metaCapi", leadivo: true, other: true },
      { key: "compare.feature.tiktokApi", leadivo: true, other: false },
      { key: "compare.feature.googleSheets", leadivo: true, other: false },
      { key: "compare.feature.cityShipping", leadivo: true, other: false },
      { key: "compare.feature.pricing", leadivo: "$19/mo", other: "$19/mo+" },
    ],
    highlights: [
      { titleKey: "compare.highlight.codAnalytics.title", descKey: "compare.highlight.codAnalytics.desc", icon: "BarChart3" },
      { titleKey: "compare.highlight.whatsappRecovery.title", descKey: "compare.highlight.whatsappRecovery.desc", icon: "MessageCircle" },
      { titleKey: "compare.highlight.multiMarket.title", descKey: "compare.highlight.multiMarket.desc", icon: "Globe" },
    ],
    faqs: [
      {
        question: {
          en: "What does Leadivo offer that YouCan doesn't?",
          ar: "ما الذي يقدمه Leadivo ولا يقدمه YouCan؟",
          fr: "Qu'est-ce que Leadivo offre que YouCan n'a pas ?",
        },
        answer: {
          en: "Leadivo includes built-in COD analytics (confirmation, delivery, and return rates), WhatsApp abandoned cart recovery, multi-market pricing with automatic currency conversion, TikTok Events API, Google Sheets sync, and city-level shipping rates — all in one plan.",
          ar: "يشمل Leadivo تحليلات COD مدمجة (معدلات التأكيد والتسليم والإرجاع) واسترداد السلات عبر واتساب وتسعير متعدد الأسواق مع تحويل عملات تلقائي وTikTok Events API ومزامنة Google Sheets وأسعار شحن حسب المدينة — كل ذلك في خطة واحدة.",
          fr: "Leadivo inclut des analytiques COD intégrées (taux de confirmation, livraison et retour), la récupération de paniers via WhatsApp, la tarification multi-marché avec conversion automatique, TikTok Events API, synchronisation Google Sheets et tarifs de livraison par ville — tout dans un seul plan.",
        },
      },
      {
        question: {
          en: "Is Leadivo good for sellers in Morocco and North Africa?",
          ar: "هل Leadivo مناسب لبائعي المغرب وشمال أفريقيا؟",
          fr: "Leadivo est-il adapté aux vendeurs au Maroc et en Afrique du Nord ?",
        },
        answer: {
          en: "Leadivo supports Arabic and French with full RTL, local currencies (MAD, DZD, TND), city-level delivery rates, and WhatsApp notifications — everything North African sellers need to serve their customers effectively.",
          ar: "يدعم Leadivo العربية والفرنسية مع RTL كامل والعملات المحلية (MAD، DZD، TND) وأسعار توصيل حسب المدينة وإشعارات واتساب — كل ما يحتاجه بائعو شمال أفريقيا لخدمة عملائهم بفعالية.",
          fr: "Leadivo prend en charge l'arabe et le français avec RTL complet, les devises locales (MAD, DZD, TND), les tarifs de livraison par ville et les notifications WhatsApp — tout ce dont les vendeurs nord-africains ont besoin pour servir efficacement leurs clients.",
        },
      },
    ],
  },
  {
    slug: "salla",
    name: "Salla",
    metaTitle: {
      en: "Leadivo vs Salla — Multi-Market COD Store for Global Sellers",
      ar: "Leadivo مقابل سلة — متجر COD متعدد الأسواق للبائعين العالميين",
      fr: "Leadivo vs Salla — Boutique COD multi-marché pour vendeurs internationaux",
    },
    metaDescription: {
      en: "Compare Leadivo and Salla. Sell across markets with multi-currency pricing, 20 languages, WhatsApp recovery, and COD analytics — built for social sellers everywhere.",
      ar: "قارن بين Leadivo وسلة. بيع عبر أسواق متعددة بعملات محلية و20 لغة واسترداد واتساب وتحليلات COD — مصمم للبائعين في كل مكان.",
      fr: "Comparez Leadivo et Salla. Vendez sur plusieurs marchés avec tarification multi-devises, 20 langues, récupération WhatsApp et analytiques COD.",
    },
    keywords: [
      "leadivo vs salla",
      "salla alternative",
      "salla alternative international",
      "cod store international",
      "multi market ecommerce",
      "arabic store builder global",
    ],
    knownForKey: "compare.salla.knownFor",
    leadivoFitKey: "compare.salla.leadivoFit",
    features: [
      { key: "compare.feature.setup", leadivo: "2 min", other: "10+ min" },
      { key: "compare.feature.cod", leadivo: true, other: true },
      { key: "compare.feature.codAnalytics", leadivo: true, other: false },
      { key: "compare.feature.whatsapp", leadivo: true, other: true },
      { key: "compare.feature.cartRecovery", leadivo: true, other: false },
      { key: "compare.feature.multiLanguage", leadivo: "20 langs", other: "2 langs" },
      { key: "compare.feature.multiCurrency", leadivo: true, other: "limited" },
      { key: "compare.feature.multiMarket", leadivo: true, other: false },
      { key: "compare.feature.metaCapi", leadivo: true, other: true },
      { key: "compare.feature.tiktokApi", leadivo: true, other: false },
      { key: "compare.feature.googleSheets", leadivo: true, other: false },
      { key: "compare.feature.cityShipping", leadivo: true, other: true },
      { key: "compare.feature.pricing", leadivo: "$19/mo", other: "$27/mo+" },
    ],
    highlights: [
      { titleKey: "compare.highlight.global.title", descKey: "compare.highlight.global.desc", icon: "Globe" },
      { titleKey: "compare.highlight.codAnalytics.title", descKey: "compare.highlight.codAnalytics.desc", icon: "BarChart3" },
      { titleKey: "compare.highlight.whatsappRecovery.title", descKey: "compare.highlight.whatsappRecovery.desc", icon: "MessageCircle" },
    ],
    faqs: [
      {
        question: {
          en: "How is Leadivo different from Salla?",
          ar: "كيف يختلف Leadivo عن سلة؟",
          fr: "En quoi Leadivo diffère-t-il de Salla ?",
        },
        answer: {
          en: "Leadivo is built for sellers who want to reach customers across multiple countries and markets. With 20 languages, multi-market pricing with automatic currency conversion, COD analytics, and WhatsApp cart recovery, Leadivo helps you scale beyond a single region.",
          ar: "Leadivo مصمم للبائعين الذين يريدون الوصول لعملاء في عدة دول وأسواق. مع 20 لغة وتسعير متعدد الأسواق مع تحويل عملات تلقائي وتحليلات COD واسترداد سلات واتساب، يساعدك Leadivo على التوسع خارج منطقة واحدة.",
          fr: "Leadivo est conçu pour les vendeurs qui veulent atteindre des clients dans plusieurs pays et marchés. Avec 20 langues, une tarification multi-marché avec conversion automatique, des analytiques COD et la récupération de paniers WhatsApp, Leadivo vous aide à vous développer au-delà d'une seule région.",
        },
      },
      {
        question: {
          en: "Can I use Leadivo if I sell in Saudi Arabia?",
          ar: "هل يمكنني استخدام Leadivo إذا كنت أبيع في السعودية؟",
          fr: "Puis-je utiliser Leadivo si je vends en Arabie Saoudite ?",
        },
        answer: {
          en: "Leadivo fully supports Arabic with RTL, SAR currency, city-level delivery rates for Saudi cities, and WhatsApp notifications. You can also expand to other markets with multi-currency pricing when you're ready.",
          ar: "يدعم Leadivo العربية بالكامل مع RTL وعملة SAR وأسعار توصيل حسب المدينة للمدن السعودية وإشعارات واتساب. يمكنك أيضاً التوسع لأسواق أخرى بتسعير متعدد العملات عندما تكون جاهزاً.",
          fr: "Leadivo prend entièrement en charge l'arabe avec RTL, la devise SAR, les tarifs de livraison par ville pour les villes saoudiennes et les notifications WhatsApp. Vous pouvez aussi vous étendre à d'autres marchés avec la tarification multi-devises quand vous êtes prêt.",
        },
      },
    ],
  },
]

export function getComparePlatform(slug: string): ComparePlatform | undefined {
  return COMPARE_PLATFORMS.find((p) => p.slug === slug)
}

export function getAllCompareSlugs(): string[] {
  return COMPARE_PLATFORMS.map((p) => p.slug)
}
