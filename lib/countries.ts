export interface CountryConfig {
  code: string
  name: string
  localName: string
  lang: "fr" | "ar"
  hreflang: string
  currency: string
  currencySymbol: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  faqs: { question: string; answer: string }[]
}

export const COUNTRIES: Record<string, CountryConfig> = {
  fr: {
    code: "fr",
    name: "France",
    localName: "",
    lang: "fr",
    hreflang: "fr",
    currency: "",
    currencySymbol: "",
    metaTitle: "Créez votre boutique en ligne gratuitement | Leadivo",
    metaDescription:
      "Créez une vitrine en quelques secondes. Partagez un lien dans votre bio. Recevez des commandes via WhatsApp ou paiement à la livraison — sans code. Essai gratuit inclus.",
    keywords: [
      "créer boutique en ligne",
      "plateforme e-commerce",
      "boutique en ligne gratuite",
      "vendre en ligne",
      "boutique réseaux sociaux",
      "commandes WhatsApp",
      "paiement à la livraison",
      "e-commerce sans code",
      "lien en bio boutique",
      "vendre sur Instagram",
      "vendre sur TikTok",
    ],
    faqs: [
      {
        question: "Ai-je besoin de compétences techniques ?",
        answer:
          "Pas du tout. Leadivo est conçu pour les utilisateurs non techniques. Créez votre boutique, ajoutez des produits et commencez à vendre en moins de 2 minutes.",
      },
      {
        question: "Comment fonctionnent les paiements ?",
        answer:
          "Vos clients commandent en paiement à la livraison (COD). Aucune passerelle de paiement en ligne nécessaire.",
      },
      {
        question: "Puis-je utiliser mon propre domaine ?",
        answer:
          "Oui ! Connectez votre domaine personnalisé pour une vitrine professionnelle. Nous fournissons des instructions DNS étape par étape.",
      },
      {
        question: "Que se passe-t-il après l'essai gratuit ?",
        answer:
          "Après vos 14 jours d'essai gratuit, abonnez-vous pour 19$/mois pour maintenir votre boutique. Vous ne perdrez aucun de vos produits ou paramètres.",
      },
      {
        question: "Puis-je vendre en plusieurs langues ?",
        answer:
          "Oui. Leadivo supporte l'anglais, le français et l'arabe avec support RTL complet.",
      },
    ],
  },
  ar: {
    code: "ar",
    name: "Arabic",
    localName: "",
    lang: "ar",
    hreflang: "ar",
    currency: "",
    currencySymbol: "",
    metaTitle: "أنشئ متجرك الإلكتروني مجاناً | Leadivo",
    metaDescription:
      "أنشئ واجهة متجر جميلة في ثوانٍ. شارك رابطاً واحداً في البايو. استقبل الطلبات عبر واتساب أو الدفع عند الاستلام — بدون برمجة. تجربة مجانية.",
    keywords: [
      "إنشاء متجر إلكتروني",
      "منصة تجارة إلكترونية",
      "متجر إلكتروني مجاني",
      "البيع عبر الإنترنت",
      "متجر وسائل التواصل",
      "طلبات واتساب",
      "الدفع عند الاستلام",
      "تجارة إلكترونية بدون كود",
      "رابط البايو متجر",
      "البيع على انستقرام",
      "البيع على تيك توك",
    ],
    faqs: [
      {
        question: "هل أحتاج مهارات تقنية؟",
        answer:
          "أبداً. Leadivo مصمم للمستخدمين غير التقنيين. يمكنك إنشاء متجرك وإضافة المنتجات والبدء بالبيع في أقل من دقيقتين.",
      },
      {
        question: "كيف تعمل المدفوعات؟",
        answer:
          "عملاؤك يطلبون بالدفع عند الاستلام. لا حاجة لبوابة دفع إلكتروني أو حساب تاجر.",
      },
      {
        question: "هل يمكنني استخدام نطاقي الخاص؟",
        answer:
          "نعم! يمكنك ربط نطاقك المخصص لواجهة متجر احترافية. نوفر تعليمات إعداد DNS خطوة بخطوة.",
      },
      {
        question: "ماذا يحدث بعد التجربة المجانية؟",
        answer:
          "بعد انتهاء الـ 14 يوم تجربة مجانية، اشترك بـ $19/شهر للحفاظ على متجرك. لن تفقد أي من منتجاتك أو إعداداتك.",
      },
      {
        question: "هل يمكنني البيع بعدة لغات؟",
        answer:
          "نعم. Leadivo يدعم الإنجليزية والفرنسية والعربية مع دعم كامل للكتابة من اليمين لليسار.",
      },
    ],
  },
  dz: {
    code: "dz",
    name: "Algeria",
    localName: "Algérie",
    lang: "fr",
    hreflang: "fr-DZ",
    currency: "DZD",
    currencySymbol: "د.ج",
    metaTitle: "Créer une boutique en ligne en Algérie — COD & Analytics | Leadivo",
    metaDescription:
      "Lancez votre boutique e-commerce en Algérie en 2 minutes. COD, analytics par wilaya, prix en DZD, multi-langue. Essai gratuit 14 jours.",
    keywords: [
      "créer boutique en ligne Algérie",
      "plateforme e-commerce Algérie",
      "vendre en ligne Algérie",
      "boutique en ligne Algérie",
      "e-commerce Algérie 2026",
      "comment vendre en ligne en Algérie",
      "COD Algérie",
      "paiement à la livraison Algérie",
      "boutique instagram Algérie",
      "vendre sur les réseaux sociaux Algérie",
      "best online store builder Algeria",
      "create online store Algeria",
      "ecommerce Algeria COD",
    ],
    faqs: [
      {
        question: "Comment créer une boutique en ligne en Algérie ?",
        answer:
          "Inscrivez-vous sur Leadivo, nommez votre boutique, ajoutez vos produits et partagez le lien sur Instagram, TikTok ou WhatsApp. Tout se fait en moins de 2 minutes, sans aucune compétence technique.",
      },
      {
        question: "Le paiement à la livraison (COD) est-il disponible ?",
        answer:
          "Oui, le COD est le mode de paiement par défaut sur Leadivo. Vos clients commandent en ligne et paient à la réception — idéal pour le marché algérien où plus de 80% des acheteurs préfèrent le COD.",
      },
      {
        question: "Puis-je afficher mes prix en Dinar algérien (DZD) ?",
        answer:
          "Oui. Avec la fonctionnalité multi-marché de Leadivo, vous pouvez créer un marché Algérie avec des prix en DZD et des tarifs de livraison personnalisés par wilaya.",
      },
      {
        question: "Comment réduire les retours de colis en Algérie ?",
        answer:
          "Utilisez les analytics COD de Leadivo pour identifier les wilayas avec des taux de retour élevés, confirmer les commandes automatiquement par WhatsApp avant l'expédition, et ajuster vos tarifs de livraison en conséquence.",
      },
      {
        question: "Combien coûte Leadivo ?",
        answer:
          "14 jours d'essai gratuit, puis 19$/mois pour toutes les fonctionnalités. Pas de frais cachés, pas de commissions sur vos ventes, produits illimités.",
      },
      {
        question: "Ma boutique sera-t-elle disponible en arabe ?",
        answer:
          "Oui. Leadivo supporte le français, l'arabe et l'anglais avec un support RTL complet. Vos clients peuvent naviguer dans la langue de leur choix.",
      },
    ],
  },
  ma: {
    code: "ma",
    name: "Morocco",
    localName: "Maroc",
    lang: "fr",
    hreflang: "fr-MA",
    currency: "MAD",
    currencySymbol: "د.م.",
    metaTitle: "Créer une boutique en ligne au Maroc — COD & Multi-langue | Leadivo",
    metaDescription:
      "Créez votre boutique e-commerce au Maroc en 2 minutes. Paiement à la livraison, analytics COD par ville, prix en MAD, notifications WhatsApp. Essai gratuit 14 jours.",
    keywords: [
      "créer boutique en ligne Maroc",
      "plateforme e-commerce Maroc",
      "vendre en ligne Maroc",
      "boutique en ligne Maroc",
      "e-commerce Maroc 2026",
      "COD Maroc",
      "paiement à la livraison Maroc",
      "boutique instagram Maroc",
      "vendre sur réseaux sociaux Maroc",
      "create online store Morocco",
      "ecommerce Morocco",
      "online store Casablanca",
    ],
    faqs: [
      {
        question: "Comment créer une boutique en ligne au Maroc ?",
        answer:
          "Inscrivez-vous sur Leadivo, ajoutez vos produits et partagez le lien de votre boutique sur Instagram, TikTok ou WhatsApp. Vos clients commandent et paient à la livraison. Aucune compétence technique requise.",
      },
      {
        question: "Le paiement à la livraison (COD) est-il supporté au Maroc ?",
        answer:
          "Oui, le COD est le mode de paiement par défaut. La majorité des acheteurs marocains préfèrent payer à la réception, et Leadivo est conçu pour ce mode de vente.",
      },
      {
        question: "Puis-je afficher mes prix en Dirham marocain (MAD) ?",
        answer:
          "Oui. Créez un marché Maroc avec des prix en MAD et configurez des tarifs de livraison personnalisés par ville.",
      },
      {
        question: "Comment suivre mes performances de livraison au Maroc ?",
        answer:
          "Le tableau de bord analytics COD de Leadivo affiche vos taux de confirmation, livraison et retour. Identifiez les villes problématiques et optimisez vos opérations.",
      },
      {
        question: "Combien coûte Leadivo ?",
        answer:
          "Essai gratuit de 14 jours, puis 19$/mois. Toutes les fonctionnalités incluses, produits illimités, zéro commission sur vos ventes.",
      },
      {
        question: "Leadivo envoie-t-il des notifications WhatsApp à mes clients ?",
        answer:
          "Oui. Leadivo envoie automatiquement les confirmations de commande et récupère les paniers abandonnés via WhatsApp — sans intervention manuelle.",
      },
    ],
  },
  tn: {
    code: "tn",
    name: "Tunisia",
    localName: "Tunisie",
    lang: "fr",
    hreflang: "fr-TN",
    currency: "TND",
    currencySymbol: "د.ت",
    metaTitle: "Créer une boutique en ligne en Tunisie — COD & Analytics | Leadivo",
    metaDescription:
      "Lancez votre boutique e-commerce en Tunisie en 2 minutes. COD, analytics par gouvernorat, prix en TND, WhatsApp automatisé. 14 jours d'essai gratuit.",
    keywords: [
      "créer boutique en ligne Tunisie",
      "plateforme e-commerce Tunisie",
      "vendre en ligne Tunisie",
      "boutique en ligne Tunisie",
      "e-commerce Tunisie 2026",
      "COD Tunisie",
      "paiement à la livraison Tunisie",
      "boutique instagram Tunisie",
      "vendre sur réseaux sociaux Tunisie",
      "create online store Tunisia",
      "ecommerce Tunisia",
    ],
    faqs: [
      {
        question: "Comment lancer une boutique e-commerce en Tunisie ?",
        answer:
          "Créez votre boutique Leadivo en 2 minutes : inscrivez-vous, ajoutez vos produits, et partagez le lien sur vos réseaux sociaux. Le paiement à la livraison est activé par défaut.",
      },
      {
        question: "Le COD fonctionne-t-il en Tunisie ?",
        answer:
          "Oui, le paiement à la livraison est le mode par défaut sur Leadivo. Parfait pour le marché tunisien où la plupart des acheteurs préfèrent payer à la réception.",
      },
      {
        question: "Puis-je configurer des prix en Dinar tunisien (TND) ?",
        answer:
          "Oui. Avec le système multi-marché, créez un marché Tunisie avec des prix en TND et des frais de livraison par gouvernorat.",
      },
      {
        question: "Comment récupérer les paniers abandonnés ?",
        answer:
          "Leadivo envoie automatiquement un message WhatsApp aux clients qui ont abandonné leur panier, avec un lien pour finaliser leur commande. Tout est automatisé.",
      },
      {
        question: "Combien coûte Leadivo ?",
        answer:
          "Essai gratuit de 14 jours, puis 19$/mois avec toutes les fonctionnalités. Pas de commissions sur vos ventes.",
      },
      {
        question: "Ma boutique supporte-t-elle le français et l'arabe ?",
        answer:
          "Oui. Votre boutique est disponible en français, arabe et anglais avec support RTL complet — idéal pour toucher tout le marché tunisien.",
      },
    ],
  },
  sa: {
    code: "sa",
    name: "Saudi Arabia",
    localName: "السعودية",
    lang: "ar",
    hreflang: "ar-SA",
    currency: "SAR",
    currencySymbol: "ر.س",
    metaTitle: "أنشئ متجرك الإلكتروني في السعودية — الدفع عند الاستلام | Leadivo",
    metaDescription:
      "أنشئ متجرك الإلكتروني في السعودية في دقيقتين. الدفع عند الاستلام، تحليلات COD، أسعار بالريال، واتساب. تجربة مجانية.",
    keywords: [
      "إنشاء متجر إلكتروني السعودية",
      "منصة تجارة إلكترونية السعودية",
      "البيع عبر الإنترنت السعودية",
      "متجر إلكتروني السعودية",
      "أفضل منصة متجر إلكتروني السعودية",
      "الدفع عند الاستلام السعودية",
      "متجر انستقرام السعودية",
      "البيع عبر السوشيال ميديا السعودية",
      "create online store Saudi Arabia",
      "ecommerce platform Saudi Arabia",
      "COD Saudi Arabia",
    ],
    faqs: [
      {
        question: "كيف أنشئ متجر إلكتروني في السعودية؟",
        answer:
          "سجّل في Leadivo، سمِّ متجرك، أضف منتجاتك وشارك الرابط على إنستقرام أو تيك توك أو واتساب. يستغرق الأمر أقل من دقيقتين ولا تحتاج أي خبرة تقنية.",
      },
      {
        question: "هل يدعم Leadivo الدفع عند الاستلام في السعودية؟",
        answer:
          "نعم، الدفع عند الاستلام (COD) هو الوضع الافتراضي. عملاؤك يطلبون أونلاين ويدفعون عند استلام المنتج — وهو الأسلوب المفضل لدى غالبية المشترين السعوديين.",
      },
      {
        question: "هل يمكنني عرض أسعاري بالريال السعودي؟",
        answer:
          "نعم. باستخدام ميزة الأسواق المتعددة، أنشئ سوقاً للسعودية بأسعار بالريال السعودي وتكاليف توصيل مخصصة حسب المدينة.",
      },
      {
        question: "كيف أتابع معدلات التأكيد والتوصيل؟",
        answer:
          "لوحة تحليلات COD تعرض معدل التأكيد ومعدل التسليم ومعدل الإرجاع وقمع الطلبات والإيرادات حسب الحالة — مقاييس مخصصة للدفع عند الاستلام لن تجدها في منصات أخرى.",
      },
      {
        question: "كم تكلفة Leadivo؟",
        answer:
          "تجربة مجانية 14 يوم، ثم 19$/شهر لجميع المميزات. منتجات غير محدودة، بدون عمولات على مبيعاتك.",
      },
      {
        question: "هل يرسل Leadivo إشعارات واتساب تلقائية؟",
        answer:
          "نعم. يرسل Leadivo تأكيدات الطلبات تلقائياً ويسترد السلات المتروكة عبر واتساب — بدون أي تدخل يدوي.",
      },
    ],
  },
  eg: {
    code: "eg",
    name: "Egypt",
    localName: "مصر",
    lang: "ar",
    hreflang: "ar-EG",
    currency: "EGP",
    currencySymbol: "ج.م",
    metaTitle: "أنشئ متجرك الإلكتروني في مصر — COD و تحليلات متقدمة | Leadivo",
    metaDescription:
      "أنشئ متجرك الإلكتروني في مصر في دقيقتين. الدفع عند الاستلام، تحليلات COD بالمحافظة، أسعار بالجنيه المصري، استرداد السلات عبر واتساب. تجربة مجانية.",
    keywords: [
      "إنشاء متجر إلكتروني مصر",
      "منصة تجارة إلكترونية مصر",
      "البيع عبر الإنترنت مصر",
      "متجر إلكتروني مصر",
      "التجارة الإلكترونية مصر 2026",
      "الدفع عند الاستلام مصر",
      "متجر انستقرام مصر",
      "البيع أونلاين مصر",
      "create online store Egypt",
      "ecommerce Egypt",
      "COD Egypt ecommerce",
    ],
    faqs: [
      {
        question: "كيف أبدأ التجارة الإلكترونية في مصر؟",
        answer:
          "سجّل في Leadivo مجاناً، أنشئ متجرك في دقيقتين، أضف منتجاتك وشارك الرابط على إنستقرام أو تيك توك أو واتساب. الدفع عند الاستلام مفعّل تلقائياً.",
      },
      {
        question: "هل يدعم Leadivo الدفع عند الاستلام في مصر؟",
        answer:
          "نعم، COD هو الوضع الافتراضي. أكثر من 70% من المشترين المصريين يفضلون الدفع عند الاستلام، وLeadivo مصمم لهذا النموذج.",
      },
      {
        question: "هل يمكنني عرض أسعاري بالجنيه المصري؟",
        answer:
          "نعم. أنشئ سوقاً لمصر بأسعار بالجنيه المصري وتكاليف توصيل مخصصة حسب المحافظة باستخدام ميزة الأسواق المتعددة.",
      },
      {
        question: "كيف أقلل نسبة إرجاع الطلبات في مصر؟",
        answer:
          "استخدم تحليلات COD لتحديد المحافظات ذات معدلات الإرجاع المرتفعة، وفعّل تأكيد الطلبات التلقائي عبر واتساب قبل الشحن.",
      },
      {
        question: "كم سعر الاشتراك في Leadivo؟",
        answer:
          "تجربة مجانية 14 يوم، ثم 19$/شهر. جميع المميزات مشمولة، منتجات غير محدودة، بدون عمولات.",
      },
      {
        question: "هل يدعم المتجر اللغة العربية والإنجليزية؟",
        answer:
          "نعم. متجرك متاح بالعربية والإنجليزية والفرنسية مع دعم كامل للكتابة من اليمين لليسار (RTL).",
      },
    ],
  },
  ae: {
    code: "ae",
    name: "UAE",
    localName: "الإمارات",
    lang: "ar",
    hreflang: "ar-AE",
    currency: "AED",
    currencySymbol: "د.إ",
    metaTitle: "أنشئ متجرك الإلكتروني في الإمارات — COD و متعدد اللغات | Leadivo",
    metaDescription:
      "أنشئ متجرك الإلكتروني في الإمارات ودبي في دقيقتين. الدفع عند الاستلام، أسعار بالدرهم، دعم 20+ لغة، تحليلات COD. تجربة مجانية 14 يوم.",
    keywords: [
      "إنشاء متجر إلكتروني الإمارات",
      "منصة تجارة إلكترونية الإمارات",
      "البيع عبر الإنترنت الإمارات",
      "متجر إلكتروني دبي",
      "متجر إلكتروني أبوظبي",
      "الدفع عند الاستلام الإمارات",
      "متجر انستقرام الإمارات",
      "البيع أونلاين دبي",
      "ecommerce UAE",
      "create online store UAE",
      "online store Dubai",
      "COD ecommerce UAE",
    ],
    faqs: [
      {
        question: "كيف أنشئ متجر إلكتروني في الإمارات؟",
        answer:
          "سجّل في Leadivo، أنشئ متجرك في دقيقتين، أضف منتجاتك وشارك الرابط على إنستقرام أو تيك توك أو واتساب. لا تحتاج أي خبرة تقنية.",
      },
      {
        question: "هل يدعم Leadivo الدفع عند الاستلام في الإمارات؟",
        answer:
          "نعم، الدفع عند الاستلام (COD) مفعّل تلقائياً. يمكن لعملائك الطلب أونلاين والدفع عند الاستلام.",
      },
      {
        question: "هل يمكنني عرض أسعاري بالدرهم الإماراتي؟",
        answer:
          "نعم. أنشئ سوقاً للإمارات بأسعار بالدرهم وتكاليف توصيل مخصصة حسب الإمارة باستخدام ميزة الأسواق المتعددة.",
      },
      {
        question: "هل يدعم Leadivo عدة لغات للسوق الإماراتي؟",
        answer:
          "نعم. الإمارات سوق متنوع — Leadivo يدعم 20+ لغة بما فيها العربية والإنجليزية والفرنسية مع دعم RTL كامل، لاستهداف جميع الشرائح.",
      },
      {
        question: "كم تكلفة Leadivo؟",
        answer:
          "تجربة مجانية 14 يوم، ثم 19$/شهر لجميع المميزات. منتجات غير محدودة، بدون عمولات على مبيعاتك.",
      },
      {
        question: "هل يمكنني استخدام نطاقي الخاص؟",
        answer:
          "نعم. يمكنك ربط نطاقك المخصص لواجهة متجر احترافية مع تعليمات إعداد DNS خطوة بخطوة.",
      },
    ],
  },
}
