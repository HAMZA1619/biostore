export type Localized = { en: string; ar: string; fr: string }

export interface DocCategory {
  slug: string
  title: Localized
  description: Localized
  icon: string
}

export interface DocStep {
  title: Localized
  description: Localized
  image?: string
}

export interface DocArticle {
  slug: string
  category: string
  title: Localized
  description: Localized
  steps: DocStep[]
}

export const CATEGORIES: DocCategory[] = [
  {
    slug: "getting-started",
    title: { en: "Getting Started", ar: "البدء", fr: "Premiers pas" },
    description: {
      en: "Create your account and set up your first store.",
      ar: "أنشئ حسابك وأعد إعداد متجرك الأول.",
      fr: "Créez votre compte et configurez votre première boutique.",
    },
    icon: "Rocket",
  },
  {
    slug: "store",
    title: { en: "Store Setup", ar: "إعداد المتجر", fr: "Configuration de la boutique" },
    description: {
      en: "Configure your store settings, currency, and domain.",
      ar: "اضبط إعدادات متجرك والعملة والنطاق.",
      fr: "Configurez les paramètres, la devise et le domaine de votre boutique.",
    },
    icon: "Store",
  },
  {
    slug: "design",
    title: { en: "Design & Theme", ar: "التصميم والمظهر", fr: "Design et thème" },
    description: {
      en: "Customize your store's look with colors, fonts, and layout.",
      ar: "خصّص مظهر متجرك بالألوان والخطوط والتخطيط.",
      fr: "Personnalisez l'apparence de votre boutique avec des couleurs, polices et mises en page.",
    },
    icon: "Paintbrush",
  },
  {
    slug: "products",
    title: { en: "Products", ar: "المنتجات", fr: "Produits" },
    description: {
      en: "Add, edit, and manage your product catalog.",
      ar: "أضف وعدّل وأدِر كتالوج منتجاتك.",
      fr: "Ajoutez, modifiez et gérez votre catalogue de produits.",
    },
    icon: "Package",
  },
  {
    slug: "collections",
    title: { en: "Collections", ar: "المجموعات", fr: "Collections" },
    description: {
      en: "Organize products into collections for easy browsing.",
      ar: "نظّم المنتجات في مجموعات لتسهيل التصفح.",
      fr: "Organisez vos produits en collections pour faciliter la navigation.",
    },
    icon: "FolderOpen",
  },
  {
    slug: "orders",
    title: { en: "Orders", ar: "الطلبات", fr: "Commandes" },
    description: {
      en: "View, manage, and fulfill customer orders.",
      ar: "اعرض وأدِر ونفّذ طلبات العملاء.",
      fr: "Consultez, gérez et traitez les commandes clients.",
    },
    icon: "ShoppingCart",
  },
  {
    slug: "shipping",
    title: { en: "Shipping", ar: "الشحن", fr: "Livraison" },
    description: {
      en: "Configure delivery fees by country and city.",
      ar: "اضبط رسوم التوصيل حسب البلد والمدينة.",
      fr: "Configurez les frais de livraison par pays et par ville.",
    },
    icon: "Truck",
  },
  {
    slug: "markets",
    title: { en: "Markets", ar: "الأسواق", fr: "Marchés" },
    description: {
      en: "Sell in different regions with local currencies and pricing.",
      ar: "بع في مناطق مختلفة بعملات وأسعار محلية.",
      fr: "Vendez dans différentes régions avec des devises et prix locaux.",
    },
    icon: "MapPin",
  },
  {
    slug: "discounts",
    title: { en: "Discounts", ar: "التخفيضات", fr: "Réductions" },
    description: {
      en: "Create discount codes to boost sales.",
      ar: "أنشئ أكواد خصم لتعزيز المبيعات.",
      fr: "Créez des codes de réduction pour booster vos ventes.",
    },
    icon: "Ticket",
  },
  {
    slug: "integrations",
    title: { en: "Integrations", ar: "التكاملات", fr: "Intégrations" },
    description: {
      en: "Connect WhatsApp, Meta Pixel, Google Sheets, and more.",
      ar: "اربط واتساب وميتا بيكسل وجوجل شيتس والمزيد.",
      fr: "Connectez WhatsApp, Meta Pixel, Google Sheets et plus encore.",
    },
    icon: "Puzzle",
  },
  {
    slug: "settings",
    title: { en: "Settings", ar: "الإعدادات", fr: "Paramètres" },
    description: {
      en: "Manage your account and preferences.",
      ar: "أدِر حسابك وتفضيلاتك.",
      fr: "Gérez votre compte et vos préférences.",
    },
    icon: "Settings",
  },
]

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export const ARTICLES: DocArticle[] = [
  // ── Getting Started ──────────────────────────────────────────────────
  {
    slug: "create-account",
    category: "getting-started",
    title: {
      en: "How to create your account",
      ar: "كيفية إنشاء حسابك",
      fr: "Comment créer votre compte",
    },
    description: {
      en: "Sign up for BioStore using email or Google.",
      ar: "سجّل في BioStore باستخدام البريد الإلكتروني أو جوجل.",
      fr: "Inscrivez-vous sur BioStore avec votre email ou Google.",
    },
    steps: [
      {
        title: { en: "Go to the signup page", ar: "انتقل إلى صفحة التسجيل", fr: "Allez sur la page d'inscription" },
        description: {
          en: "Visit biostore.com and click the \"Get Started\" button in the top-right corner. This will take you to the registration form where you can create your free account in under a minute.",
          ar: "قم بزيارة biostore.com وانقر على زر \"ابدأ الآن\" في الزاوية العلوية. سينقلك هذا إلى نموذج التسجيل حيث يمكنك إنشاء حسابك المجاني في أقل من دقيقة.",
          fr: "Visitez biostore.com et cliquez sur le bouton « Commencer » en haut à droite. Cela vous amènera au formulaire d'inscription où vous pourrez créer votre compte gratuit en moins d'une minute.",
        },
        image: "/docs/getting-started/create-account-1.svg",
      },
      {
        title: { en: "Fill in your details", ar: "أدخل بياناتك", fr: "Remplissez vos informations" },
        description: {
          en: "Enter your full name, email address, and create a strong password (at least 8 characters). Alternatively, click \"Sign up with Google\" to register instantly using your Google account — no password needed. Your name and email will be used for order notifications and account recovery.",
          ar: "أدخل اسمك الكامل وبريدك الإلكتروني وأنشئ كلمة مرور قوية (8 أحرف على الأقل). بدلاً من ذلك، انقر على \"التسجيل عبر جوجل\" للتسجيل فوريًا باستخدام حسابك في جوجل — بدون حاجة لكلمة مرور. سيُستخدم اسمك وبريدك الإلكتروني لإشعارات الطلبات واستعادة الحساب.",
          fr: "Entrez votre nom complet, adresse email et créez un mot de passe solide (au moins 8 caractères). Vous pouvez aussi cliquer sur « S'inscrire avec Google » pour vous inscrire instantanément avec votre compte Google — sans mot de passe. Votre nom et email seront utilisés pour les notifications de commandes et la récupération du compte.",
        },
        image: "/docs/getting-started/create-account-2.svg",
      },
      {
        title: { en: "Access your dashboard", ar: "ادخل إلى لوحة التحكم", fr: "Accédez à votre tableau de bord" },
        description: {
          en: "After signing up, you'll be automatically redirected to your dashboard. This is your control center where you'll manage everything — products, orders, design, and settings. Your first step should be setting up your store details (name, currency, and description).",
          ar: "بعد التسجيل، سيتم توجيهك تلقائيًا إلى لوحة التحكم. هذا هو مركز التحكم الخاص بك حيث ستدير كل شيء — المنتجات والطلبات والتصميم والإعدادات. خطوتك الأولى يجب أن تكون إعداد تفاصيل متجرك (الاسم والعملة والوصف).",
          fr: "Après l'inscription, vous serez automatiquement redirigé vers votre tableau de bord. C'est votre centre de contrôle où vous gérerez tout — produits, commandes, design et paramètres. Votre première étape devrait être de configurer les détails de votre boutique (nom, devise et description).",
        },
        image: "/docs/getting-started/create-account-3.svg",
      },
    ],
  },
  {
    slug: "setup-store",
    category: "getting-started",
    title: {
      en: "Setting up your store",
      ar: "إعداد متجرك",
      fr: "Configurer votre boutique",
    },
    description: {
      en: "Configure your store name, currency, and description.",
      ar: "اضبط اسم متجرك والعملة والوصف.",
      fr: "Configurez le nom, la devise et la description de votre boutique.",
    },
    steps: [
      {
        title: { en: "Navigate to Store settings", ar: "انتقل إلى إعدادات المتجر", fr: "Allez dans les paramètres de la boutique" },
        description: {
          en: "From the dashboard sidebar on the left, click \"Store\" to open your store settings page. This is where you configure all the basic information about your store that customers will see.",
          ar: "من الشريط الجانبي الأيسر في لوحة التحكم، انقر على \"المتجر\" لفتح صفحة إعدادات المتجر. هنا تقوم بضبط جميع المعلومات الأساسية عن متجرك التي سيراها العملاء.",
          fr: "Depuis la barre latérale gauche du tableau de bord, cliquez sur « Boutique » pour ouvrir la page des paramètres. C'est ici que vous configurez toutes les informations de base de votre boutique visibles par les clients.",
        },
        image: "/docs/getting-started/setup-store-1.svg",
      },
      {
        title: { en: "Fill in store details", ar: "أدخل تفاصيل المتجر", fr: "Remplissez les détails de la boutique" },
        description: {
          en: "Enter your store name (this appears in the header of your storefront). Choose a URL slug — this is the unique link customers will use to visit your store (e.g., biostore.com/your-slug). Select your primary currency for product pricing, and write a short description that tells customers what you sell. You can also set the store language to match your target audience.",
          ar: "أدخل اسم المتجر (يظهر في رأس واجهة المتجر). اختر رابط URL — هذا هو الرابط الفريد الذي سيستخدمه العملاء لزيارة متجرك (مثلاً biostore.com/رابطك). حدد العملة الرئيسية لتسعير المنتجات، واكتب وصفًا قصيرًا يخبر العملاء بما تبيعه. يمكنك أيضًا تحديد لغة المتجر لتتناسب مع جمهورك المستهدف.",
          fr: "Entrez le nom de votre boutique (il apparaît dans l'en-tête de votre vitrine). Choisissez un slug URL — c'est le lien unique que les clients utiliseront pour visiter votre boutique (ex : biostore.com/votre-slug). Sélectionnez votre devise principale pour les prix, et rédigez une courte description indiquant aux clients ce que vous vendez. Vous pouvez aussi définir la langue de la boutique pour correspondre à votre audience cible.",
        },
        image: "/docs/getting-started/setup-store-2.svg",
      },
      {
        title: { en: "Save your settings", ar: "احفظ إعداداتك", fr: "Enregistrez vos paramètres" },
        description: {
          en: "Click the \"Save\" button at the bottom of the page to apply your changes. Your store is now configured and ready — the next step is adding your first products. You can always come back to this page to update your store details later.",
          ar: "انقر على زر \"حفظ\" في أسفل الصفحة لتطبيق التغييرات. متجرك الآن مُعد وجاهز — الخطوة التالية هي إضافة منتجاتك الأولى. يمكنك دائمًا العودة إلى هذه الصفحة لتحديث تفاصيل المتجر لاحقًا.",
          fr: "Cliquez sur le bouton « Enregistrer » en bas de la page pour appliquer vos modifications. Votre boutique est maintenant configurée et prête — l'étape suivante est d'ajouter vos premiers produits. Vous pourrez toujours revenir sur cette page pour mettre à jour les détails plus tard.",
        },
        image: "/docs/getting-started/setup-store-3.svg",
      },
    ],
  },
  {
    slug: "publish-store",
    category: "getting-started",
    title: {
      en: "Publishing your store",
      ar: "نشر متجرك",
      fr: "Publier votre boutique",
    },
    description: {
      en: "Make your store live and accessible to customers.",
      ar: "اجعل متجرك مباشرًا ومتاحًا للعملاء.",
      fr: "Rendez votre boutique accessible aux clients.",
    },
    steps: [
      {
        title: { en: "Go to Store settings", ar: "انتقل إلى إعدادات المتجر", fr: "Allez dans les paramètres de la boutique" },
        description: {
          en: "Open the Store page from the dashboard sidebar. Make sure you have already added at least one product and configured your store details before publishing.",
          ar: "افتح صفحة المتجر من الشريط الجانبي. تأكد من أنك أضفت منتجًا واحدًا على الأقل وضبطت تفاصيل المتجر قبل النشر.",
          fr: "Ouvrez la page Boutique depuis la barre latérale. Assurez-vous d'avoir ajouté au moins un produit et configuré les détails de votre boutique avant de publier.",
        },
      },
      {
        title: { en: "Toggle the Published switch", ar: "فعّل زر النشر", fr: "Activez le bouton Publier" },
        description: {
          en: "Find the \"Published\" toggle at the top of the store settings and turn it on. Your store will immediately become visible to anyone with the link. You can share your store URL (shown at the top of the page) with customers via social media, WhatsApp, or any other channel. You can unpublish at any time by turning the toggle off.",
          ar: "ابحث عن زر \"منشور\" في أعلى إعدادات المتجر وفعّله. سيصبح متجرك مرئيًا فورًا لأي شخص لديه الرابط. يمكنك مشاركة رابط متجرك (الظاهر في أعلى الصفحة) مع العملاء عبر وسائل التواصل الاجتماعي أو واتساب أو أي قناة أخرى. يمكنك إلغاء النشر في أي وقت بإيقاف الزر.",
          fr: "Trouvez le bouton « Publié » en haut des paramètres de la boutique et activez-le. Votre boutique deviendra immédiatement visible pour toute personne ayant le lien. Vous pouvez partager l'URL de votre boutique (affichée en haut de la page) avec vos clients via les réseaux sociaux, WhatsApp ou tout autre canal. Vous pouvez dépublier à tout moment en désactivant le bouton.",
        },
        image: "/docs/getting-started/publish-store-1.svg",
      },
    ],
  },

  // ── Store ────────────────────────────────────────────────────────────
  {
    slug: "store-settings",
    category: "store",
    title: {
      en: "Managing store settings",
      ar: "إدارة إعدادات المتجر",
      fr: "Gérer les paramètres de la boutique",
    },
    description: {
      en: "Update your store name, description, currency, and more.",
      ar: "حدّث اسم متجرك ووصفه وعملته والمزيد.",
      fr: "Mettez à jour le nom, la description, la devise et plus encore.",
    },
    steps: [
      {
        title: { en: "Open Store page", ar: "افتح صفحة المتجر", fr: "Ouvrez la page Boutique" },
        description: {
          en: "Click \"Store\" in the sidebar to access all store settings. This page is your central hub for managing how your store appears to customers — including its name, branding, and contact details.",
          ar: "انقر على \"المتجر\" في الشريط الجانبي للوصول إلى جميع إعدادات المتجر. هذه الصفحة هي مركزك الرئيسي لإدارة كيفية ظهور متجرك للعملاء — بما في ذلك الاسم والعلامة التجارية ومعلومات الاتصال.",
          fr: "Cliquez sur « Boutique » dans la barre latérale pour accéder à tous les paramètres. Cette page est votre centre de gestion pour contrôler l'apparence de votre boutique — nom, image de marque et coordonnées.",
        },
        image: "/docs/store/store-settings-1.svg",
      },
      {
        title: { en: "Edit your information", ar: "عدّل معلوماتك", fr: "Modifiez vos informations" },
        description: {
          en: "Here you can update: Store name (displayed in the header and browser tab), URL slug (the unique link to your store), currency (used for all product prices), language (for the storefront interface), and description (shown to visitors on your homepage). You can also upload a store logo and cover image to strengthen your brand identity. Make sure to click \"Save\" after making changes.",
          ar: "هنا يمكنك تحديث: اسم المتجر (يظهر في الرأس وعلامة التبويب)، رابط URL (الرابط الفريد لمتجرك)، العملة (تُستخدم لجميع أسعار المنتجات)، اللغة (لواجهة المتجر)، والوصف (يظهر للزوار في الصفحة الرئيسية). يمكنك أيضًا رفع شعار المتجر وصورة الغلاف لتعزيز هوية علامتك التجارية. تأكد من النقر على \"حفظ\" بعد إجراء التغييرات.",
          fr: "Ici vous pouvez mettre à jour : le nom de la boutique (affiché dans l'en-tête et l'onglet du navigateur), le slug URL (le lien unique vers votre boutique), la devise (utilisée pour tous les prix), la langue (pour l'interface de la vitrine) et la description (visible par les visiteurs sur votre page d'accueil). Vous pouvez aussi télécharger un logo et une image de couverture pour renforcer votre identité de marque. N'oubliez pas de cliquer sur « Enregistrer » après vos modifications.",
        },
        image: "/docs/store/store-settings-2.svg",
      },
    ],
  },
  {
    slug: "custom-domain",
    category: "store",
    title: {
      en: "Connecting a custom domain",
      ar: "ربط نطاق مخصص",
      fr: "Connecter un domaine personnalisé",
    },
    description: {
      en: "Use your own domain name for your store.",
      ar: "استخدم اسم نطاقك الخاص لمتجرك.",
      fr: "Utilisez votre propre nom de domaine pour votre boutique.",
    },
    steps: [
      {
        title: { en: "Go to Settings", ar: "انتقل إلى الإعدادات", fr: "Allez dans les Paramètres" },
        description: {
          en: "Navigate to Settings from the sidebar and scroll down to find the \"Custom Domain\" section. A custom domain lets customers visit your store using your own brand name (e.g., shop.yourbrand.com) instead of the default biostore.com link.",
          ar: "انتقل إلى الإعدادات من الشريط الجانبي وانزل للأسفل للعثور على قسم \"النطاق المخصص\". النطاق المخصص يتيح للعملاء زيارة متجرك باستخدام اسم علامتك التجارية (مثلاً shop.yourbrand.com) بدلاً من رابط biostore.com الافتراضي.",
          fr: "Allez dans Paramètres depuis la barre latérale et descendez pour trouver la section « Domaine personnalisé ». Un domaine personnalisé permet à vos clients de visiter votre boutique avec votre propre nom de marque (ex : shop.votrebrand.com) au lieu du lien biostore.com par défaut.",
        },
        image: "/docs/store/custom-domain-1.svg",
      },
      {
        title: { en: "Enter your domain", ar: "أدخل نطاقك", fr: "Entrez votre domaine" },
        description: {
          en: "Type your domain name in the field (e.g., shop.yourbrand.com) and click \"Save Domain\". You'll need to add a CNAME record in your domain registrar's DNS settings pointing to biostore.com. DNS changes can take up to 24 hours to propagate, so your domain may not work immediately.",
          ar: "اكتب اسم نطاقك في الحقل (مثلاً shop.yourbrand.com) وانقر \"حفظ النطاق\". ستحتاج إلى إضافة سجل CNAME في إعدادات DNS لمسجّل النطاق الخاص بك يشير إلى biostore.com. قد تستغرق تغييرات DNS حتى 24 ساعة للانتشار، لذا قد لا يعمل نطاقك فورًا.",
          fr: "Tapez votre nom de domaine dans le champ (ex : shop.votrebrand.com) et cliquez sur « Enregistrer le domaine ». Vous devrez ajouter un enregistrement CNAME dans les paramètres DNS de votre registraire de domaine pointant vers biostore.com. Les changements DNS peuvent prendre jusqu'à 24 heures pour se propager, donc votre domaine peut ne pas fonctionner immédiatement.",
        },
        image: "/docs/store/custom-domain-2.svg",
      },
    ],
  },

  // ── Design ───────────────────────────────────────────────────────────
  {
    slug: "customize-theme",
    category: "design",
    title: {
      en: "Customizing your store theme",
      ar: "تخصيص مظهر متجرك",
      fr: "Personnaliser le thème de votre boutique",
    },
    description: {
      en: "Change the overall look and feel of your storefront.",
      ar: "غيّر المظهر العام لواجهة متجرك.",
      fr: "Changez l'apparence générale de votre vitrine.",
    },
    steps: [
      {
        title: { en: "Open the Design page", ar: "افتح صفحة التصميم", fr: "Ouvrez la page Design" },
        description: {
          en: "Click \"Design\" in the sidebar to open the theme editor. This is where you control how your storefront looks to customers — colors, fonts, and overall visual style.",
          ar: "انقر على \"التصميم\" في الشريط الجانبي لفتح محرر المظهر. هنا تتحكم في مظهر واجهة متجرك للعملاء — الألوان والخطوط والنمط البصري العام.",
          fr: "Cliquez sur « Design » dans la barre latérale pour ouvrir l'éditeur de thème. C'est ici que vous contrôlez l'apparence de votre vitrine — couleurs, polices et style visuel général.",
        },
        image: "/docs/design/customize-theme-1.svg",
      },
      {
        title: { en: "Choose your colors", ar: "اختر ألوانك", fr: "Choisissez vos couleurs" },
        description: {
          en: "Pick a primary accent color that matches your brand. This color will be applied across your entire storefront — buttons, links, badges, and highlighted elements. Choose a color that contrasts well with white backgrounds for the best readability. You can click the color picker or enter a hex code directly.",
          ar: "اختر لونًا أساسيًا يتناسب مع علامتك التجارية. سيُطبق هذا اللون على كامل واجهة متجرك — الأزرار والروابط والشارات والعناصر المميزة. اختر لونًا يتباين جيدًا مع الخلفيات البيضاء لأفضل قراءة. يمكنك النقر على منتقي الألوان أو إدخال كود hex مباشرةً.",
          fr: "Choisissez une couleur d'accent qui correspond à votre marque. Elle sera appliquée sur toute votre vitrine — boutons, liens, badges et éléments mis en avant. Choisissez une couleur qui contraste bien avec les fonds blancs pour une meilleure lisibilité. Vous pouvez utiliser le sélecteur de couleurs ou entrer un code hex directement.",
        },
        image: "/docs/design/customize-theme-2.svg",
      },
      {
        title: { en: "Preview and save", ar: "معاينة وحفظ", fr: "Prévisualisez et enregistrez" },
        description: {
          en: "Your changes are previewed in real-time as you make them, so you can see exactly how your store will look before saving. Once you're happy with the design, click \"Save\" to apply the changes to your live store. Customers will see the updated design immediately.",
          ar: "تُعاين تغييراتك في الوقت الفعلي أثناء إجرائها، حتى ترى بالضبط كيف سيبدو متجرك قبل الحفظ. بمجرد رضاك عن التصميم، انقر \"حفظ\" لتطبيق التغييرات على متجرك المباشر. سيرى العملاء التصميم المحدث فورًا.",
          fr: "Vos modifications sont prévisualisées en temps réel, vous pouvez donc voir exactement à quoi ressemblera votre boutique avant d'enregistrer. Une fois satisfait du design, cliquez sur « Enregistrer » pour appliquer les changements. Les clients verront le nouveau design immédiatement.",
        },
        image: "/docs/design/customize-theme-3.svg",
      },
    ],
  },

  // ── Products ─────────────────────────────────────────────────────────
  {
    slug: "add-product",
    category: "products",
    title: {
      en: "Adding a new product",
      ar: "إضافة منتج جديد",
      fr: "Ajouter un nouveau produit",
    },
    description: {
      en: "Create a product with images, pricing, and details.",
      ar: "أنشئ منتجًا بالصور والأسعار والتفاصيل.",
      fr: "Créez un produit avec images, prix et détails.",
    },
    steps: [
      {
        title: { en: "Go to Products", ar: "انتقل إلى المنتجات", fr: "Allez dans Produits" },
        description: {
          en: "Click \"Products\" in the sidebar to see your product list, then click the \"Add Product\" button in the top-right corner. If this is your first product, the page will be empty — that's normal.",
          ar: "انقر على \"المنتجات\" في الشريط الجانبي لرؤية قائمة منتجاتك، ثم انقر على زر \"إضافة منتج\" في الزاوية العلوية اليمنى. إذا كان هذا أول منتج لك، ستكون الصفحة فارغة — هذا طبيعي.",
          fr: "Cliquez sur « Produits » dans la barre latérale pour voir votre liste de produits, puis cliquez sur « Ajouter un produit » en haut à droite. Si c'est votre premier produit, la page sera vide — c'est normal.",
        },
        image: "/docs/products/add-product-1.svg",
      },
      {
        title: { en: "Fill in product details", ar: "أدخل تفاصيل المنتج", fr: "Remplissez les détails du produit" },
        description: {
          en: "Enter the product name and a description that helps customers understand what they're buying. Set the selling price, and optionally a \"compare-at\" price (the original price before discount — it will be shown crossed out next to the actual price). Choose which collection this product belongs to, and set the stock quantity if you want to track inventory.",
          ar: "أدخل اسم المنتج ووصفًا يساعد العملاء على فهم ما يشترونه. حدد سعر البيع، واختياريًا \"سعر المقارنة\" (السعر الأصلي قبل الخصم — سيظهر مشطوبًا بجانب السعر الفعلي). اختر المجموعة التي ينتمي إليها هذا المنتج، وحدد كمية المخزون إذا كنت تريد تتبع المخزون.",
          fr: "Entrez le nom du produit et une description qui aide les clients à comprendre ce qu'ils achètent. Définissez le prix de vente, et optionnellement un « prix barré » (le prix original avant réduction — il sera affiché barré à côté du prix réel). Choisissez à quelle collection appartient ce produit, et définissez la quantité en stock si vous souhaitez suivre l'inventaire.",
        },
        image: "/docs/products/add-product-2.svg",
      },
      {
        title: { en: "Upload images", ar: "ارفع الصور", fr: "Téléchargez les images" },
        description: {
          en: "Drag and drop images onto the upload area, or click it to browse your files. You can upload multiple images — the first one will be used as the main product image that customers see when browsing your store. Use high-quality, well-lit photos for the best results. Recommended size is at least 800x800 pixels.",
          ar: "اسحب وأفلت الصور في منطقة الرفع، أو انقر عليها لتصفح ملفاتك. يمكنك رفع صور متعددة — ستُستخدم الأولى كصورة رئيسية للمنتج التي يراها العملاء عند تصفح متجرك. استخدم صورًا عالية الجودة وجيدة الإضاءة لأفضل النتائج. الحجم الموصى به 800×800 بيكسل على الأقل.",
          fr: "Glissez-déposez les images sur la zone de téléchargement, ou cliquez dessus pour parcourir vos fichiers. Vous pouvez télécharger plusieurs images — la première sera utilisée comme image principale visible lors de la navigation. Utilisez des photos de haute qualité et bien éclairées. La taille recommandée est d'au moins 800x800 pixels.",
        },
        image: "/docs/products/add-product-3.svg",
      },
      {
        title: { en: "Save the product", ar: "احفظ المنتج", fr: "Enregistrez le produit" },
        description: {
          en: "Click \"Create Product\" to save your new product. It will appear on your storefront once your store is published. You can edit the product anytime by clicking on it from the Products list. Products are set to active by default — toggle the status off if you want to hide a product temporarily.",
          ar: "انقر على \"إنشاء المنتج\" لحفظ منتجك الجديد. سيظهر في واجهة متجرك بمجرد نشر المتجر. يمكنك تعديل المنتج في أي وقت بالنقر عليه من قائمة المنتجات. المنتجات تكون مفعّلة افتراضيًا — أوقف الحالة إذا أردت إخفاء منتج مؤقتًا.",
          fr: "Cliquez sur « Créer le produit » pour enregistrer. Il apparaîtra sur votre vitrine une fois la boutique publiée. Vous pouvez modifier le produit à tout moment en cliquant dessus depuis la liste. Les produits sont actifs par défaut — désactivez le statut si vous voulez masquer un produit temporairement.",
        },
      },
    ],
  },
  {
    slug: "product-variants",
    category: "products",
    title: {
      en: "Managing product variants",
      ar: "إدارة متغيرات المنتج",
      fr: "Gérer les variantes de produit",
    },
    description: {
      en: "Add size, color, or other options to your products.",
      ar: "أضف المقاس واللون أو خيارات أخرى لمنتجاتك.",
      fr: "Ajoutez des tailles, couleurs ou autres options à vos produits.",
    },
    steps: [
      {
        title: { en: "Edit your product", ar: "عدّل منتجك", fr: "Modifiez votre produit" },
        description: {
          en: "Go to Products in the sidebar and click on the product you want to add variants to. You can add variants to both new and existing products. Variants are useful when a product comes in different sizes, colors, or materials.",
          ar: "انتقل إلى المنتجات في الشريط الجانبي وانقر على المنتج الذي تريد إضافة متغيرات إليه. يمكنك إضافة متغيرات للمنتجات الجديدة والحالية. المتغيرات مفيدة عندما يأتي المنتج بمقاسات أو ألوان أو خامات مختلفة.",
          fr: "Allez dans Produits dans la barre latérale et cliquez sur le produit auquel vous voulez ajouter des variantes. Vous pouvez ajouter des variantes aux produits nouveaux et existants. Les variantes sont utiles quand un produit existe en différentes tailles, couleurs ou matériaux.",
        },
      },
      {
        title: { en: "Add options", ar: "أضف الخيارات", fr: "Ajoutez des options" },
        description: {
          en: "Scroll down to the Options section and click \"Add Option\". Give your option a name (e.g., \"Size\", \"Color\", \"Material\") and enter the available values separated by pressing Enter (e.g., S, M, L, XL). You can add multiple option types — for example, both Size and Color. The system will automatically generate all possible combinations.",
          ar: "انزل لأسفل إلى قسم الخيارات وانقر على \"إضافة خيار\". أعطِ الخيار اسمًا (مثلاً \"المقاس\"، \"اللون\"، \"الخامة\") وأدخل القيم المتاحة بالضغط على Enter بين كل قيمة (مثلاً S, M, L, XL). يمكنك إضافة أنواع خيارات متعددة — مثلاً المقاس واللون معًا. سيقوم النظام تلقائيًا بإنشاء جميع التركيبات الممكنة.",
          fr: "Descendez jusqu'à la section Options et cliquez sur « Ajouter une option ». Donnez un nom à votre option (ex : « Taille », « Couleur », « Matière ») et entrez les valeurs disponibles en appuyant sur Entrée (ex : S, M, L, XL). Vous pouvez ajouter plusieurs types d'options — par exemple, Taille et Couleur. Le système générera automatiquement toutes les combinaisons possibles.",
        },
        image: "/docs/products/product-variants-1.svg",
      },
      {
        title: { en: "Set variant prices and stock", ar: "حدد أسعار ومخزون المتغيرات", fr: "Définissez les prix et stocks des variantes" },
        description: {
          en: "Each variant combination gets its own row in the variants table below the options. You can set a different price and stock quantity for each variant. For example, an XL shirt might cost more than an S. If you leave a variant's price empty, it will use the product's base price. Remember to click \"Save\" when you're done editing variants.",
          ar: "كل مزيج متغيرات يحصل على صف خاص في جدول المتغيرات أسفل الخيارات. يمكنك تحديد سعر وكمية مخزون مختلفة لكل متغير. مثلاً، قميص XL قد يكلف أكثر من قميص S. إذا تركت سعر متغير فارغًا، سيستخدم السعر الأساسي للمنتج. تذكر النقر على \"حفظ\" عند الانتهاء من تعديل المتغيرات.",
          fr: "Chaque combinaison de variantes a sa propre ligne dans le tableau des variantes sous les options. Vous pouvez définir un prix et une quantité de stock différents pour chaque variante. Par exemple, un t-shirt XL pourrait coûter plus qu'un S. Si vous laissez le prix d'une variante vide, il utilisera le prix de base du produit. N'oubliez pas de cliquer sur « Enregistrer » après avoir modifié les variantes.",
        },
        image: "/docs/products/product-variants-2.svg",
      },
    ],
  },

  // ── Collections ──────────────────────────────────────────────────────
  {
    slug: "create-collection",
    category: "collections",
    title: {
      en: "Creating a collection",
      ar: "إنشاء مجموعة",
      fr: "Créer une collection",
    },
    description: {
      en: "Group your products into browsable collections.",
      ar: "جمّع منتجاتك في مجموعات قابلة للتصفح.",
      fr: "Regroupez vos produits en collections navigables.",
    },
    steps: [
      {
        title: { en: "Go to Collections", ar: "انتقل إلى المجموعات", fr: "Allez dans Collections" },
        description: {
          en: "Click \"Collections\" in the sidebar to see your existing collections, then click \"Create Collection\" to add a new one. Collections help customers browse your store by category — for example, \"New Arrivals\", \"Best Sellers\", or \"Summer Collection\".",
          ar: "انقر على \"المجموعات\" في الشريط الجانبي لرؤية مجموعاتك الحالية، ثم انقر على \"إنشاء مجموعة\" لإضافة واحدة جديدة. تساعد المجموعات العملاء في تصفح متجرك حسب الفئة — مثلاً \"وصل حديثًا\" أو \"الأكثر مبيعًا\" أو \"مجموعة الصيف\".",
          fr: "Cliquez sur « Collections » dans la barre latérale pour voir vos collections existantes, puis sur « Créer une collection » pour en ajouter une nouvelle. Les collections aident les clients à parcourir votre boutique par catégorie — par exemple « Nouveautés », « Meilleures ventes » ou « Collection été ».",
        },
        image: "/docs/collections/create-collection-1.svg",
      },
      {
        title: { en: "Name and describe your collection", ar: "سمّ مجموعتك ووصفها", fr: "Nommez et décrivez votre collection" },
        description: {
          en: "Enter a clear, descriptive name for your collection. Add an optional description to explain what products it contains. The URL slug is auto-generated from the name — it's what appears in the link when customers visit this collection (e.g., /collections/summer-2025). You can edit the slug if needed.",
          ar: "أدخل اسمًا واضحًا ووصفيًا لمجموعتك. أضف وصفًا اختياريًا لشرح المنتجات التي تحتويها. يُنشأ رابط URL تلقائيًا من الاسم — وهو ما يظهر في الرابط عندما يزور العملاء هذه المجموعة (مثلاً /collections/summer-2025). يمكنك تعديل الرابط إذا لزم الأمر.",
          fr: "Entrez un nom clair et descriptif pour votre collection. Ajoutez une description optionnelle pour expliquer quels produits elle contient. Le slug URL est généré automatiquement à partir du nom — c'est ce qui apparaît dans le lien quand les clients visitent cette collection (ex : /collections/ete-2025). Vous pouvez modifier le slug si nécessaire.",
        },
        image: "/docs/collections/create-collection-2.svg",
      },
      {
        title: { en: "Assign products", ar: "خصّص المنتجات", fr: "Assignez les produits" },
        description: {
          en: "To add products to this collection, go to the Products page and edit any product. In the product form, you'll find a \"Collection\" dropdown — select this collection to include the product. A product can only belong to one collection at a time. Collections with products will automatically appear on your storefront's navigation.",
          ar: "لإضافة منتجات إلى هذه المجموعة، انتقل إلى صفحة المنتجات وعدّل أي منتج. في نموذج المنتج، ستجد قائمة \"المجموعة\" — اختر هذه المجموعة لتضمين المنتج فيها. يمكن أن ينتمي المنتج إلى مجموعة واحدة فقط في كل مرة. ستظهر المجموعات التي تحتوي على منتجات تلقائيًا في تصفح واجهة متجرك.",
          fr: "Pour ajouter des produits à cette collection, allez dans la page Produits et modifiez n'importe quel produit. Dans le formulaire du produit, vous trouverez un menu « Collection » — sélectionnez cette collection pour inclure le produit. Un produit ne peut appartenir qu'à une seule collection à la fois. Les collections avec des produits apparaîtront automatiquement dans la navigation de votre vitrine.",
        },
      },
    ],
  },

  // ── Orders ───────────────────────────────────────────────────────────
  {
    slug: "view-orders",
    category: "orders",
    title: {
      en: "Viewing and managing orders",
      ar: "عرض وإدارة الطلبات",
      fr: "Consulter et gérer les commandes",
    },
    description: {
      en: "Track and manage incoming customer orders.",
      ar: "تتبع وأدِر طلبات العملاء الواردة.",
      fr: "Suivez et gérez les commandes clients entrantes.",
    },
    steps: [
      {
        title: { en: "Open Orders page", ar: "افتح صفحة الطلبات", fr: "Ouvrez la page Commandes" },
        description: {
          en: "Click \"Orders\" in the sidebar to see all customer orders. They're sorted by most recent first. Each order shows the customer name, total amount, status, and date. You can also see a quick count of new (pending) orders that need your attention.",
          ar: "انقر على \"الطلبات\" في الشريط الجانبي لرؤية جميع طلبات العملاء. مرتبة من الأحدث أولاً. يعرض كل طلب اسم العميل والمبلغ الإجمالي والحالة والتاريخ. يمكنك أيضًا رؤية عدد سريع للطلبات الجديدة (المعلقة) التي تحتاج انتباهك.",
          fr: "Cliquez sur « Commandes » dans la barre latérale pour voir toutes les commandes clients. Elles sont triées par date décroissante. Chaque commande affiche le nom du client, le montant total, le statut et la date. Vous pouvez aussi voir un compteur rapide des nouvelles commandes (en attente) qui nécessitent votre attention.",
        },
        image: "/docs/orders/view-orders-1.svg",
      },
      {
        title: { en: "View order details", ar: "اعرض تفاصيل الطلب", fr: "Consultez les détails de la commande" },
        description: {
          en: "Click any order row to open the full details. You'll see everything about the order: the customer's name, phone number, and shipping address; a list of all items ordered with quantities and prices; the payment method and total amount; and any discount codes applied. This is all the information you need to fulfill the order.",
          ar: "انقر على أي صف طلب لفتح التفاصيل الكاملة. سترى كل شيء عن الطلب: اسم العميل ورقم الهاتف وعنوان الشحن؛ قائمة بجميع العناصر المطلوبة بالكميات والأسعار؛ طريقة الدفع والمبلغ الإجمالي؛ وأي أكواد خصم مطبقة. هذه كل المعلومات التي تحتاجها لتنفيذ الطلب.",
          fr: "Cliquez sur n'importe quelle ligne de commande pour ouvrir les détails complets. Vous verrez tout sur la commande : le nom du client, son numéro de téléphone et son adresse de livraison ; la liste de tous les articles commandés avec quantités et prix ; le mode de paiement et le montant total ; et les codes de réduction appliqués. Ce sont toutes les informations dont vous avez besoin pour traiter la commande.",
        },
        image: "/docs/orders/view-orders-2.svg",
      },
      {
        title: { en: "Update order status", ar: "حدّث حالة الطلب", fr: "Mettez à jour le statut de la commande" },
        description: {
          en: "Use the status dropdown on the order detail page to track your fulfillment progress. The available statuses are: Pending (new order, not yet processed), Confirmed (you've accepted and are preparing the order), Shipped (the order is on its way to the customer), and Delivered (the customer has received their order). Updating the status helps you stay organized and keeps customers informed if you have WhatsApp notifications enabled.",
          ar: "استخدم قائمة الحالة في صفحة تفاصيل الطلب لتتبع تقدم التنفيذ. الحالات المتاحة هي: معلق (طلب جديد، لم يُعالج بعد)، مؤكد (قبلت الطلب وتجهزه)، مشحون (الطلب في الطريق إلى العميل)، ومُسلّم (استلم العميل طلبه). تحديث الحالة يساعدك على البقاء منظمًا ويُبقي العملاء على اطلاع إذا كانت إشعارات واتساب مفعلة.",
          fr: "Utilisez le menu déroulant de statut sur la page de détails pour suivre la progression du traitement. Les statuts disponibles sont : En attente (nouvelle commande, pas encore traitée), Confirmée (vous avez accepté et préparez la commande), Expédiée (la commande est en route vers le client) et Livrée (le client a reçu sa commande). Mettre à jour le statut vous aide à rester organisé et tient les clients informés si les notifications WhatsApp sont activées.",
        },
        image: "/docs/orders/view-orders-3.svg",
      },
    ],
  },

  // ── Shipping ─────────────────────────────────────────────────────────
  {
    slug: "setup-zones",
    category: "shipping",
    title: {
      en: "Setting up shipping zones",
      ar: "إعداد مناطق الشحن",
      fr: "Configurer les zones de livraison",
    },
    description: {
      en: "Create shipping zones with default delivery rates for each country.",
      ar: "أنشئ مناطق شحن بأسعار توصيل افتراضية لكل بلد.",
      fr: "Créez des zones de livraison avec des tarifs par défaut pour chaque pays.",
    },
    steps: [
      {
        title: {
          en: "Open the Shipping page",
          ar: "افتح صفحة الشحن",
          fr: "Ouvrez la page Livraison",
        },
        description: {
          en: "Click \"Shipping\" in the dashboard sidebar. This page lists all your shipping zones — one per country. If you haven't created any zones yet, you'll see an empty state with a button to add your first zone.",
          ar: "انقر على \"الشحن\" في الشريط الجانبي للوحة التحكم. تعرض هذه الصفحة جميع مناطق الشحن — واحدة لكل بلد. إذا لم تنشئ أي مناطق بعد، سترى حالة فارغة مع زر لإضافة أول منطقة.",
          fr: "Cliquez sur « Livraison » dans la barre latérale du tableau de bord. Cette page liste toutes vos zones de livraison — une par pays. Si vous n'avez pas encore créé de zone, vous verrez un état vide avec un bouton pour ajouter votre première zone.",
        },
        image: "/docs/shipping/setup-zones-1.svg",
      },
      {
        title: {
          en: "Add a shipping zone",
          ar: "أضف منطقة شحن",
          fr: "Ajoutez une zone de livraison",
        },
        description: {
          en: "Click \"Add Zone\" and select a country from the dropdown. Enter the default delivery rate — this is the fee charged to customers in that country unless overridden at the city level. Click save to create the zone.",
          ar: "انقر على \"إضافة منطقة\" واختر بلداً من القائمة. أدخل سعر التوصيل الافتراضي — هذا هو الرسم المفروض على العملاء في ذلك البلد ما لم يتم تعديله على مستوى المدينة. انقر حفظ لإنشاء المنطقة.",
          fr: "Cliquez sur « Ajouter une zone » et sélectionnez un pays dans la liste. Entrez le tarif de livraison par défaut — c'est le frais facturé aux clients de ce pays sauf s'il est remplacé au niveau de la ville. Cliquez sur enregistrer pour créer la zone.",
        },
        image: "/docs/shipping/setup-zones-2.svg",
      },
      {
        title: {
          en: "Toggle zone active or inactive",
          ar: "تفعيل أو تعطيل المنطقة",
          fr: "Activer ou désactiver la zone",
        },
        description: {
          en: "Each zone has an active toggle. When a zone is inactive, customers from that country won't see any delivery fee and the zone is ignored at checkout. This is useful for temporarily pausing delivery to a country without deleting the zone and its city overrides.",
          ar: "لكل منطقة زر تفعيل. عندما تكون المنطقة غير مفعلة، لن يرى العملاء من ذلك البلد أي رسوم توصيل وسيتم تجاهل المنطقة عند الدفع. هذا مفيد لإيقاف التوصيل مؤقتاً إلى بلد دون حذف المنطقة وتعديلات المدن.",
          fr: "Chaque zone a un bouton d'activation. Lorsqu'une zone est inactive, les clients de ce pays ne verront aucun frais de livraison et la zone est ignorée lors du paiement. C'est utile pour suspendre temporairement la livraison vers un pays sans supprimer la zone et ses ajustements de villes.",
        },
        image: "/docs/shipping/setup-zones-3.svg",
      },
      {
        title: {
          en: "Edit or delete zones",
          ar: "تعديل أو حذف المناطق",
          fr: "Modifier ou supprimer des zones",
        },
        description: {
          en: "You can update the default rate of any zone at any time. To remove a zone entirely, click the delete button — this will also remove all city-level overrides for that zone. If you set a zone's default rate to 0, customers in that country will see \"Free delivery\" at checkout.",
          ar: "يمكنك تحديث السعر الافتراضي لأي منطقة في أي وقت. لحذف منطقة بالكامل، انقر زر الحذف — سيؤدي هذا أيضاً إلى إزالة جميع تعديلات المدن لتلك المنطقة. إذا ضبطت السعر الافتراضي للمنطقة على 0، سيرى العملاء في ذلك البلد \"توصيل مجاني\" عند الدفع.",
          fr: "Vous pouvez modifier le tarif par défaut d'une zone à tout moment. Pour supprimer une zone entièrement, cliquez sur le bouton supprimer — cela supprimera aussi tous les ajustements de villes pour cette zone. Si vous mettez le tarif par défaut à 0, les clients de ce pays verront « Livraison gratuite » au moment du paiement.",
        },
      },
    ],
  },
  {
    slug: "city-rates",
    category: "shipping",
    title: {
      en: "City-level delivery rates",
      ar: "أسعار التوصيل حسب المدينة",
      fr: "Tarifs de livraison par ville",
    },
    description: {
      en: "Override delivery fees for specific cities or exclude cities from delivery.",
      ar: "عدّل رسوم التوصيل لمدن محددة أو استثنِ مدناً من التوصيل.",
      fr: "Remplacez les frais de livraison pour des villes spécifiques ou excluez des villes de la livraison.",
    },
    steps: [
      {
        title: {
          en: "Expand a shipping zone",
          ar: "وسّع منطقة الشحن",
          fr: "Développez une zone de livraison",
        },
        description: {
          en: "Click on any shipping zone to expand it and see its city-level overrides. By default, all cities in a zone use the zone's default rate. You can add individual city overrides to charge different rates or block delivery to specific cities.",
          ar: "انقر على أي منطقة شحن لتوسيعها ورؤية تعديلات المدن. بشكل افتراضي، جميع المدن في المنطقة تستخدم السعر الافتراضي للمنطقة. يمكنك إضافة تعديلات لمدن معينة لتحصيل أسعار مختلفة أو حظر التوصيل لمدن محددة.",
          fr: "Cliquez sur une zone de livraison pour la développer et voir ses ajustements de villes. Par défaut, toutes les villes d'une zone utilisent le tarif par défaut. Vous pouvez ajouter des ajustements individuels pour facturer des tarifs différents ou bloquer la livraison vers des villes spécifiques.",
        },
        image: "/docs/shipping/city-rates-1.svg",
      },
      {
        title: {
          en: "Add a city override",
          ar: "أضف تعديل مدينة",
          fr: "Ajoutez un ajustement de ville",
        },
        description: {
          en: "Click \"Add City\" and type the city name. Enter a custom delivery rate for that city. This rate will be used instead of the zone's default rate when a customer enters this city at checkout. City names are matched case-insensitively, so \"new york\" and \"New York\" will both match.",
          ar: "انقر \"إضافة مدينة\" واكتب اسم المدينة. أدخل سعر توصيل مخصص لتلك المدينة. سيتم استخدام هذا السعر بدلاً من السعر الافتراضي للمنطقة عندما يدخل العميل هذه المدينة عند الدفع. تتم مطابقة أسماء المدن بغض النظر عن حالة الأحرف.",
          fr: "Cliquez « Ajouter une ville » et tapez le nom de la ville. Entrez un tarif de livraison personnalisé. Ce tarif sera utilisé à la place du tarif par défaut lorsqu'un client entre cette ville au moment du paiement. Les noms de villes sont insensibles à la casse.",
        },
      },
      {
        title: {
          en: "Exclude a city from delivery",
          ar: "استثنِ مدينة من التوصيل",
          fr: "Exclure une ville de la livraison",
        },
        description: {
          en: "When adding a city, check the \"Exclude\" option instead of entering a rate. Excluded cities will show a \"Delivery not available\" message at checkout and customers won't be able to place an order. This is useful for remote areas or cities you don't serve yet.",
          ar: "عند إضافة مدينة، حدد خيار \"استثناء\" بدلاً من إدخال سعر. المدن المستثناة ستظهر رسالة \"التوصيل غير متاح\" عند الدفع ولن يتمكن العملاء من إتمام الطلب. هذا مفيد للمناطق النائية أو المدن التي لا تخدمها بعد.",
          fr: "Lors de l'ajout d'une ville, cochez l'option « Exclure » au lieu d'entrer un tarif. Les villes exclues afficheront un message « Livraison non disponible » et les clients ne pourront pas passer commande. C'est utile pour les zones éloignées ou les villes que vous ne desservez pas encore.",
        },
      },
      {
        title: {
          en: "Bulk add cities",
          ar: "إضافة مدن بالجملة",
          fr: "Ajouter des villes en masse",
        },
        description: {
          en: "To add many cities at once, use the bulk add feature. Enter one city name per line and set a rate or exclusion that applies to all of them. This saves time when setting up delivery for a country with many cities.",
          ar: "لإضافة عدة مدن دفعة واحدة، استخدم ميزة الإضافة بالجملة. أدخل اسم مدينة واحد في كل سطر وحدد سعراً أو استثناءً ينطبق على الجميع. هذا يوفر الوقت عند إعداد التوصيل لبلد يحتوي على مدن كثيرة.",
          fr: "Pour ajouter plusieurs villes à la fois, utilisez la fonction d'ajout en masse. Entrez un nom de ville par ligne et définissez un tarif ou une exclusion qui s'applique à toutes. Cela fait gagner du temps lors de la configuration de la livraison pour un pays avec de nombreuses villes.",
        },
      },
      {
        title: {
          en: "How customers see delivery fees",
          ar: "كيف يرى العملاء رسوم التوصيل",
          fr: "Comment les clients voient les frais de livraison",
        },
        description: {
          en: "At checkout, after the customer enters their country and city, the delivery fee is automatically calculated and shown in the order summary. If the store uses multi-market pricing, the delivery fee is converted to the market's currency at the same exchange rate as product prices. The fee is included in the order total and verified server-side when the order is placed.",
          ar: "عند الدفع، بعد أن يدخل العميل بلده ومدينته، يتم حساب رسوم التوصيل تلقائياً وعرضها في ملخص الطلب. إذا كان المتجر يستخدم تسعير متعدد الأسواق، يتم تحويل رسوم التوصيل إلى عملة السوق بنفس سعر صرف أسعار المنتجات. يتم تضمين الرسوم في إجمالي الطلب والتحقق منها على الخادم عند تقديم الطلب.",
          fr: "Au moment du paiement, après que le client entre son pays et sa ville, les frais de livraison sont automatiquement calculés et affichés dans le récapitulatif. Si la boutique utilise la tarification multi-marché, les frais sont convertis dans la devise du marché au même taux de change que les prix des produits. Les frais sont inclus dans le total et vérifiés côté serveur lors de la commande.",
        },
        image: "/docs/shipping/city-rates-2.svg",
      },
    ],
  },

  // ── Markets ──────────────────────────────────────────────────────────
  {
    slug: "create-market",
    category: "markets",
    title: {
      en: "Creating a new market",
      ar: "إنشاء سوق جديد",
      fr: "Créer un nouveau marché",
    },
    description: {
      en: "Set up a market for a specific region with its own currency.",
      ar: "أنشئ سوقًا لمنطقة محددة بعملتها الخاصة.",
      fr: "Configurez un marché pour une région spécifique avec sa propre devise.",
    },
    steps: [
      {
        title: { en: "Go to Markets", ar: "انتقل إلى الأسواق", fr: "Allez dans Marchés" },
        description: {
          en: "Click \"Markets\" in the sidebar to see your existing markets, then click \"Create Market\". Markets allow you to sell to customers in different countries with their own currency and pricing. For example, you could have a \"North Africa\" market in DZD and a \"Europe\" market in EUR.",
          ar: "انقر على \"الأسواق\" في الشريط الجانبي لرؤية أسواقك الحالية، ثم انقر على \"إنشاء سوق\". الأسواق تتيح لك البيع لعملاء في بلدان مختلفة بعملتهم وتسعيرهم الخاص. مثلاً، يمكن أن يكون لديك سوق \"شمال أفريقيا\" بالدينار الجزائري وسوق \"أوروبا\" باليورو.",
          fr: "Cliquez sur « Marchés » dans la barre latérale pour voir vos marchés existants, puis sur « Créer un marché ». Les marchés vous permettent de vendre à des clients dans différents pays avec leur propre devise et tarification. Par exemple, vous pourriez avoir un marché « Afrique du Nord » en DZD et un marché « Europe » en EUR.",
        },
        image: "/docs/markets/create-market-1.svg",
      },
      {
        title: { en: "Configure market details", ar: "اضبط تفاصيل السوق", fr: "Configurez les détails du marché" },
        description: {
          en: "Enter a descriptive name (e.g., \"Europe\", \"Gulf Countries\"), then select which countries belong to this market. Choose the currency customers will see prices in. Finally, pick a pricing mode: \"Auto\" automatically converts your base prices using a percentage adjustment you set (e.g., +10%), while \"Fixed\" lets you manually set a specific price for each product in this market's currency. Auto is simpler to manage, but Fixed gives you full control.",
          ar: "أدخل اسمًا وصفيًا (مثلاً \"أوروبا\"، \"دول الخليج\")، ثم اختر البلدان التي تنتمي لهذا السوق. اختر العملة التي سيرى بها العملاء الأسعار. أخيرًا، اختر وضع التسعير: \"تلقائي\" يحوّل أسعارك الأساسية تلقائيًا باستخدام نسبة مئوية تحددها (مثلاً +10%)، بينما \"ثابت\" يتيح لك تحديد سعر محدد يدويًا لكل منتج بعملة هذا السوق. التلقائي أسهل في الإدارة، لكن الثابت يمنحك تحكمًا كاملاً.",
          fr: "Entrez un nom descriptif (ex : « Europe », « Pays du Golfe »), puis sélectionnez les pays qui appartiennent à ce marché. Choisissez la devise dans laquelle les clients verront les prix. Enfin, choisissez un mode de tarification : « Auto » convertit automatiquement vos prix de base avec un pourcentage d'ajustement (ex : +10%), tandis que « Fixe » vous permet de définir manuellement un prix spécifique pour chaque produit dans la devise de ce marché. Auto est plus simple à gérer, mais Fixe vous donne un contrôle total.",
        },
        image: "/docs/markets/create-market-2.svg",
      },
      {
        title: { en: "Save and activate", ar: "احفظ وفعّل", fr: "Enregistrez et activez" },
        description: {
          en: "Click \"Create Market\" to save your new market. Then toggle the market to active so customers from those countries can see localized prices. If you chose \"Fixed\" pricing mode, you'll need to set individual product prices — click the ⋯ menu on the market and select \"Set prices\". Customers are automatically matched to a market based on the country they select during checkout.",
          ar: "انقر على \"إنشاء السوق\" لحفظ سوقك الجديد. ثم فعّل السوق ليتمكن العملاء من تلك البلدان من رؤية الأسعار المحلية. إذا اخترت وضع التسعير \"ثابت\"، ستحتاج لتحديد أسعار المنتجات الفردية — انقر على قائمة ⋯ في السوق واختر \"تحديد الأسعار\". يتم مطابقة العملاء تلقائيًا مع السوق بناءً على البلد الذي يختارونه أثناء الدفع.",
          fr: "Cliquez sur « Créer le marché » pour enregistrer. Puis activez le marché pour que les clients de ces pays voient les prix localisés. Si vous avez choisi le mode « Fixe », vous devrez définir les prix individuels — cliquez sur le menu ⋯ du marché et sélectionnez « Définir les prix ». Les clients sont automatiquement associés à un marché selon le pays qu'ils sélectionnent lors du paiement.",
        },
        image: "/docs/markets/create-market-3.svg",
      },
    ],
  },
  {
    slug: "market-pricing",
    category: "markets",
    title: {
      en: "Setting market-specific prices",
      ar: "تحديد أسعار خاصة بالسوق",
      fr: "Définir des prix spécifiques au marché",
    },
    description: {
      en: "Configure custom prices for products in a fixed-pricing market.",
      ar: "اضبط أسعارًا مخصصة للمنتجات في سوق بتسعير ثابت.",
      fr: "Configurez des prix personnalisés pour les produits dans un marché à tarification fixe.",
    },
    steps: [
      {
        title: { en: "Open the pricing editor", ar: "افتح محرر الأسعار", fr: "Ouvrez l'éditeur de prix" },
        description: {
          en: "From the Markets list, find the market you want to set prices for (must be a \"Fixed\" pricing mode market). Click the ⋯ menu on the right side of the market row and select \"Set prices\". This opens the pricing editor where you can see all your products and their current prices.",
          ar: "من قائمة الأسواق، ابحث عن السوق الذي تريد تحديد أسعاره (يجب أن يكون بوضع تسعير \"ثابت\"). انقر على قائمة ⋯ على الجانب الأيمن من صف السوق واختر \"تحديد الأسعار\". هذا يفتح محرر الأسعار حيث يمكنك رؤية جميع منتجاتك وأسعارها الحالية.",
          fr: "Depuis la liste des marchés, trouvez le marché pour lequel vous voulez définir les prix (doit être en mode « Fixe »). Cliquez sur le menu ⋯ à droite de la ligne du marché et sélectionnez « Définir les prix ». Cela ouvre l'éditeur de prix où vous pouvez voir tous vos produits et leurs prix actuels.",
        },
        image: "/docs/markets/market-pricing-1.svg",
      },
      {
        title: { en: "Set prices per product", ar: "حدد الأسعار لكل منتج", fr: "Définissez les prix par produit" },
        description: {
          en: "Enter the market-specific price for each product in the local currency. You can also set a \"compare-at\" price (the original/strikethrough price) for showing discounts. To save time, click \"Copy all from base\" to populate all fields with your default store prices as a starting point, then adjust as needed. Products without a market price set won't appear in this market. Click \"Save\" when done.",
          ar: "أدخل السعر الخاص بالسوق لكل منتج بالعملة المحلية. يمكنك أيضًا تحديد \"سعر المقارنة\" (السعر الأصلي/المشطوب) لإظهار الخصومات. لتوفير الوقت، انقر \"نسخ الكل من الأساس\" لملء جميع الحقول بأسعار متجرك الافتراضية كنقطة بداية، ثم عدّل حسب الحاجة. المنتجات بدون سعر سوق محدد لن تظهر في هذا السوق. انقر \"حفظ\" عند الانتهاء.",
          fr: "Entrez le prix spécifique au marché pour chaque produit dans la devise locale. Vous pouvez aussi définir un « prix barré » (le prix original/barré) pour afficher les réductions. Pour gagner du temps, cliquez sur « Copier tout depuis la base » pour remplir tous les champs avec vos prix par défaut comme point de départ, puis ajustez selon vos besoins. Les produits sans prix défini n'apparaîtront pas dans ce marché. Cliquez sur « Enregistrer » quand c'est fait.",
        },
        image: "/docs/markets/market-pricing-2.svg",
      },
    ],
  },
  {
    slug: "product-availability",
    category: "markets",
    title: {
      en: "Hiding products per market",
      ar: "إخفاء المنتجات حسب السوق",
      fr: "Masquer des produits par marché",
    },
    description: {
      en: "Control which products are visible in each market.",
      ar: "تحكم في المنتجات المرئية في كل سوق.",
      fr: "Contrôlez quels produits sont visibles dans chaque marché.",
    },
    steps: [
      {
        title: { en: "Open product availability", ar: "افتح توفر المنتجات", fr: "Ouvrez la disponibilité des produits" },
        description: {
          en: "From the Markets list, click the ⋯ menu on the market you want to manage and select \"Product availability\". This lets you control exactly which products are shown to customers in this specific market — useful if some products aren't available for shipping to certain regions or aren't relevant for that audience.",
          ar: "من قائمة الأسواق، انقر على قائمة ⋯ في السوق الذي تريد إدارته واختر \"توفر المنتجات\". هذا يتيح لك التحكم بالضبط في المنتجات المعروضة للعملاء في هذا السوق تحديدًا — مفيد إذا كانت بعض المنتجات غير متاحة للشحن لمناطق معينة أو غير مناسبة لذلك الجمهور.",
          fr: "Depuis la liste des marchés, cliquez sur le menu ⋯ du marché que vous voulez gérer et sélectionnez « Disponibilité des produits ». Cela vous permet de contrôler exactement quels produits sont visibles pour les clients de ce marché spécifique — utile si certains produits ne sont pas disponibles pour l'expédition vers certaines régions ou ne sont pas pertinents pour ce public.",
        },
        image: "/docs/markets/product-availability-1.svg",
      },
      {
        title: { en: "Toggle product visibility", ar: "بدّل ظهور المنتجات", fr: "Basculez la visibilité des produits" },
        description: {
          en: "You'll see a list of all your products with toggle switches next to each one. Turn a toggle off to hide that product from this market — it won't appear on the storefront for customers browsing from countries in this market. By default, all products are visible in all markets. Changes take effect immediately after saving. This is independent of the product's active/inactive status.",
          ar: "سترى قائمة بجميع منتجاتك مع أزرار تبديل بجانب كل واحد. أوقف الزر لإخفاء ذلك المنتج من هذا السوق — لن يظهر في واجهة المتجر للعملاء الذين يتصفحون من بلدان هذا السوق. افتراضيًا، جميع المنتجات مرئية في جميع الأسواق. التغييرات تسري فورًا بعد الحفظ. هذا مستقل عن حالة تفعيل/إلغاء تفعيل المنتج.",
          fr: "Vous verrez une liste de tous vos produits avec des interrupteurs à côté de chacun. Désactivez un interrupteur pour masquer ce produit de ce marché — il n'apparaîtra pas sur la vitrine pour les clients naviguant depuis les pays de ce marché. Par défaut, tous les produits sont visibles dans tous les marchés. Les changements prennent effet immédiatement après la sauvegarde. Ceci est indépendant du statut actif/inactif du produit.",
        },
        image: "/docs/markets/product-availability-2.svg",
      },
    ],
  },

  // ── Discounts ────────────────────────────────────────────────────────
  {
    slug: "create-discount",
    category: "discounts",
    title: {
      en: "Creating a discount code",
      ar: "إنشاء كود خصم",
      fr: "Créer un code de réduction",
    },
    description: {
      en: "Set up promotional discount codes for your customers.",
      ar: "أنشئ أكواد خصم ترويجية لعملائك.",
      fr: "Configurez des codes de réduction promotionnels pour vos clients.",
    },
    steps: [
      {
        title: { en: "Go to Discounts", ar: "انتقل إلى التخفيضات", fr: "Allez dans Réductions" },
        description: {
          en: "Click \"Discounts\" in the sidebar to see your existing discount codes, then click \"Create Discount\" to make a new one. Discount codes are a great way to attract new customers, reward loyal ones, or run promotional campaigns on social media.",
          ar: "انقر على \"التخفيضات\" في الشريط الجانبي لرؤية أكواد الخصم الحالية، ثم انقر على \"إنشاء خصم\" لإنشاء واحد جديد. أكواد الخصم طريقة رائعة لجذب عملاء جدد ومكافأة العملاء المخلصين أو تشغيل حملات ترويجية على وسائل التواصل الاجتماعي.",
          fr: "Cliquez sur « Réductions » dans la barre latérale pour voir vos codes existants, puis sur « Créer une réduction » pour en créer un nouveau. Les codes de réduction sont un excellent moyen d'attirer de nouveaux clients, de récompenser les fidèles ou de lancer des campagnes promotionnelles sur les réseaux sociaux.",
        },
        image: "/docs/discounts/create-discount-1.svg",
      },
      {
        title: { en: "Configure the discount", ar: "اضبط الخصم", fr: "Configurez la réduction" },
        description: {
          en: "Enter a memorable code that customers will type at checkout (e.g., SUMMER20, WELCOME10). Choose the discount type: \"Percentage\" takes a percentage off the total (e.g., 20% off), while \"Fixed amount\" subtracts a specific value (e.g., $5 off). Set the discount value, and optionally configure: a minimum order amount (the discount only applies if the cart total reaches this amount), and a usage limit (how many times the code can be used before it expires). Click \"Create\" to save the discount.",
          ar: "أدخل كودًا سهل التذكر يكتبه العملاء عند الدفع (مثلاً SUMMER20, WELCOME10). اختر نوع الخصم: \"نسبة مئوية\" تخصم نسبة من الإجمالي (مثلاً 20% خصم)، بينما \"مبلغ ثابت\" يخصم قيمة محددة (مثلاً 5$ خصم). حدد قيمة الخصم، واختياريًا اضبط: حد أدنى للطلب (الخصم يُطبق فقط إذا وصل إجمالي السلة لهذا المبلغ)، وحد للاستخدام (كم مرة يمكن استخدام الكود قبل انتهاء صلاحيته). انقر \"إنشاء\" لحفظ الخصم.",
          fr: "Entrez un code mémorable que les clients saisiront lors du paiement (ex : SUMMER20, WELCOME10). Choisissez le type : « Pourcentage » retire un pourcentage du total (ex : 20% de réduction), tandis que « Montant fixe » soustrait une valeur spécifique (ex : 5€ de réduction). Définissez la valeur de la réduction, et configurez optionnellement : un montant minimum de commande (la réduction ne s'applique que si le total du panier atteint ce montant), et une limite d'utilisation (combien de fois le code peut être utilisé avant expiration). Cliquez sur « Créer » pour enregistrer la réduction.",
        },
        image: "/docs/discounts/create-discount-2.svg",
      },
    ],
  },

  // ── Integrations ─────────────────────────────────────────────────────
  {
    slug: "whatsapp",
    category: "integrations",
    title: {
      en: "Setting up WhatsApp notifications",
      ar: "إعداد إشعارات واتساب",
      fr: "Configurer les notifications WhatsApp",
    },
    description: {
      en: "Receive order notifications on WhatsApp.",
      ar: "استقبل إشعارات الطلبات على واتساب.",
      fr: "Recevez les notifications de commandes sur WhatsApp.",
    },
    steps: [
      {
        title: { en: "Go to Integrations", ar: "انتقل إلى التكاملات", fr: "Allez dans Intégrations" },
        description: {
          en: "Click \"Integrations\" in the sidebar to see all available apps you can connect to your store. Integrations are organized by category — WhatsApp is under \"Notifications\". Each integration card shows a brief description of what it does.",
          ar: "انقر على \"التكاملات\" في الشريط الجانبي لرؤية جميع التطبيقات المتاحة التي يمكنك ربطها بمتجرك. التكاملات مُنظمة حسب الفئة — واتساب تحت \"الإشعارات\". كل بطاقة تكامل تعرض وصفًا مختصرًا لما تفعله.",
          fr: "Cliquez sur « Intégrations » dans la barre latérale pour voir toutes les applications disponibles que vous pouvez connecter à votre boutique. Les intégrations sont organisées par catégorie — WhatsApp est sous « Notifications ». Chaque carte d'intégration affiche une brève description de ce qu'elle fait.",
        },
        image: "/docs/integrations/whatsapp-1.svg",
      },
      {
        title: { en: "Install WhatsApp", ar: "ثبّت واتساب", fr: "Installez WhatsApp" },
        description: {
          en: "Find the WhatsApp integration card under Notifications and click \"Install\" to add it to your store. Once installed, click \"Setup\" to configure your WhatsApp Business phone number. This integration will send you automatic notifications on WhatsApp every time a customer places a new order.",
          ar: "ابحث عن بطاقة تكامل واتساب تحت الإشعارات وانقر \"تثبيت\" لإضافته إلى متجرك. بعد التثبيت، انقر \"إعداد\" لضبط رقم هاتف واتساب للأعمال الخاص بك. هذا التكامل سيرسل لك إشعارات تلقائية على واتساب في كل مرة يقدم فيها عميل طلبًا جديدًا.",
          fr: "Trouvez la carte d'intégration WhatsApp sous Notifications et cliquez sur « Installer » pour l'ajouter à votre boutique. Une fois installée, cliquez sur « Configurer » pour paramétrer votre numéro WhatsApp Business. Cette intégration vous enverra des notifications automatiques sur WhatsApp à chaque nouvelle commande d'un client.",
        },
        image: "/docs/integrations/whatsapp-2.svg",
      },
      {
        title: { en: "Connect your account", ar: "اربط حسابك", fr: "Connectez votre compte" },
        description: {
          en: "Follow the on-screen setup instructions to connect your WhatsApp Business account. You'll need to enter your phone number and authorize the connection. Once connected, you'll automatically receive detailed order notifications including customer name, items ordered, total amount, and shipping address — directly in your WhatsApp chat. You can disconnect at any time from the same Integrations page.",
          ar: "اتبع تعليمات الإعداد على الشاشة لربط حساب واتساب للأعمال الخاص بك. ستحتاج لإدخال رقم هاتفك والموافقة على الاتصال. بمجرد الربط، ستتلقى تلقائيًا إشعارات طلبات مفصلة تتضمن اسم العميل والعناصر المطلوبة والمبلغ الإجمالي وعنوان الشحن — مباشرةً في محادثة واتساب. يمكنك إلغاء الربط في أي وقت من نفس صفحة التكاملات.",
          fr: "Suivez les instructions de configuration à l'écran pour connecter votre compte WhatsApp Business. Vous devrez entrer votre numéro de téléphone et autoriser la connexion. Une fois connecté, vous recevrez automatiquement des notifications détaillées incluant le nom du client, les articles commandés, le montant total et l'adresse de livraison — directement dans votre chat WhatsApp. Vous pouvez vous déconnecter à tout moment depuis la même page Intégrations.",
        },
        image: "/docs/integrations/whatsapp-3.svg",
      },
    ],
  },
  {
    slug: "meta-pixel",
    category: "integrations",
    title: {
      en: "Setting up Meta Pixel",
      ar: "إعداد ميتا بيكسل",
      fr: "Configurer le Meta Pixel",
    },
    description: {
      en: "Track conversions with Facebook/Meta Pixel.",
      ar: "تتبع التحويلات باستخدام بيكسل فيسبوك/ميتا.",
      fr: "Suivez les conversions avec le Pixel Facebook/Meta.",
    },
    steps: [
      {
        title: { en: "Install Meta CAPI integration", ar: "ثبّت تكامل Meta CAPI", fr: "Installez l'intégration Meta CAPI" },
        description: {
          en: "Go to Integrations and find the \"Meta Conversions API\" card under the Tracking category. Click \"Install\" to add it, then click \"Configure\" to set it up. This integration tracks customer actions on your store (page views, add to cart, purchases) and sends them to Facebook/Meta for ad optimization and analytics.",
          ar: "انتقل إلى التكاملات وابحث عن بطاقة \"Meta Conversions API\" تحت فئة التتبع. انقر \"تثبيت\" لإضافته، ثم انقر \"إعداد\" لضبطه. هذا التكامل يتتبع إجراءات العملاء في متجرك (مشاهدات الصفحات، الإضافة للسلة، المشتريات) ويرسلها إلى فيسبوك/ميتا لتحسين الإعلانات والتحليلات.",
          fr: "Allez dans Intégrations et trouvez la carte « Meta Conversions API » sous la catégorie Suivi. Cliquez sur « Installer » pour l'ajouter, puis sur « Configurer » pour le paramétrer. Cette intégration suit les actions des clients sur votre boutique (vues de pages, ajouts au panier, achats) et les envoie à Facebook/Meta pour l'optimisation des publicités et les analyses.",
        },
        image: "/docs/integrations/meta-pixel-1.svg",
      },
      {
        title: { en: "Enter your Pixel ID and Access Token", ar: "أدخل معرّف البيكسل ورمز الوصول", fr: "Entrez votre Pixel ID et Access Token" },
        description: {
          en: "You'll need two pieces of information from your Meta Business Manager: your Pixel ID (a number found in Events Manager > Data Sources) and a Conversions API Access Token (generated in Events Manager > Settings). Paste both into the corresponding fields. Optionally, add a Test Event Code if you want to verify events are being sent correctly — you can find this in Events Manager > Test Events. When a test code is present, events are sent in test mode and won't affect your real data.",
          ar: "ستحتاج لمعلومتين من Meta Business Manager: معرّف البيكسل (رقم موجود في مدير الأحداث > مصادر البيانات) ورمز وصول Conversions API (يُنشأ في مدير الأحداث > الإعدادات). الصق كليهما في الحقول المقابلة. اختياريًا، أضف كود حدث اختبار إذا أردت التحقق من إرسال الأحداث بشكل صحيح — يمكنك إيجاده في مدير الأحداث > اختبار الأحداث. عند وجود كود اختبار، تُرسل الأحداث في وضع الاختبار ولن تؤثر على بياناتك الحقيقية.",
          fr: "Vous aurez besoin de deux informations de votre Meta Business Manager : votre Pixel ID (un numéro trouvé dans Gestionnaire d'événements > Sources de données) et un Token d'accès API Conversions (généré dans Gestionnaire d'événements > Paramètres). Collez les deux dans les champs correspondants. Optionnellement, ajoutez un Code d'événement test si vous voulez vérifier que les événements sont bien envoyés — vous le trouverez dans Gestionnaire d'événements > Tester les événements. Quand un code test est présent, les événements sont envoyés en mode test et n'affecteront pas vos données réelles.",
        },
        image: "/docs/integrations/meta-pixel-2.svg",
      },
    ],
  },
  {
    slug: "google-sheets",
    category: "integrations",
    title: {
      en: "Connecting Google Sheets",
      ar: "ربط جوجل شيتس",
      fr: "Connecter Google Sheets",
    },
    description: {
      en: "Automatically export orders to a Google Spreadsheet.",
      ar: "صدّر الطلبات تلقائيًا إلى جدول بيانات جوجل.",
      fr: "Exportez automatiquement les commandes vers une feuille Google.",
    },
    steps: [
      {
        title: { en: "Install Google Sheets integration", ar: "ثبّت تكامل جوجل شيتس", fr: "Installez l'intégration Google Sheets" },
        description: {
          en: "Go to Integrations and find the \"Google Sheets\" card under Automation. Click \"Install\" to add it to your store, then click \"Setup\" to configure the connection. This integration automatically adds a new row to your Google Spreadsheet every time a customer places an order — so you always have an up-to-date record of all your orders.",
          ar: "انتقل إلى التكاملات وابحث عن بطاقة \"جوجل شيتس\" تحت الأتمتة. انقر \"تثبيت\" لإضافته إلى متجرك، ثم انقر \"إعداد\" لضبط الاتصال. هذا التكامل يضيف تلقائيًا صفًا جديدًا إلى جدول بيانات جوجل الخاص بك في كل مرة يقدم فيها عميل طلبًا — حتى يكون لديك دائمًا سجل محدث لجميع طلباتك.",
          fr: "Allez dans Intégrations et trouvez la carte « Google Sheets » sous Automatisation. Cliquez sur « Installer » pour l'ajouter, puis sur « Configurer » pour paramétrer la connexion. Cette intégration ajoute automatiquement une nouvelle ligne à votre feuille Google à chaque commande — vous avez ainsi toujours un enregistrement à jour de toutes vos commandes.",
        },
        image: "/docs/integrations/google-sheets-1.svg",
      },
      {
        title: { en: "Connect your Google account", ar: "اربط حساب جوجل", fr: "Connectez votre compte Google" },
        description: {
          en: "Click \"Connect Google Account\" and sign in with the Google account where you want the spreadsheet to be created. After authorizing access, you can choose which order fields to include in your spreadsheet (e.g., customer name, phone, items, total, address, status). A new spreadsheet will be automatically created in your Google Drive. Each new order will appear as a new row with the fields you selected.",
          ar: "انقر \"ربط حساب جوجل\" وسجّل الدخول بحساب جوجل الذي تريد إنشاء جدول البيانات فيه. بعد الموافقة على الوصول، يمكنك اختيار حقول الطلب التي تريد تضمينها في الجدول (مثلاً اسم العميل، الهاتف، العناصر، الإجمالي، العنوان، الحالة). سيتم إنشاء جدول بيانات جديد تلقائيًا في Google Drive الخاص بك. سيظهر كل طلب جديد كصف جديد بالحقول التي اخترتها.",
          fr: "Cliquez sur « Connecter le compte Google » et connectez-vous avec le compte Google où vous voulez que le tableur soit créé. Après avoir autorisé l'accès, vous pouvez choisir quels champs de commande inclure dans votre tableur (ex : nom du client, téléphone, articles, total, adresse, statut). Un nouveau tableur sera automatiquement créé dans votre Google Drive. Chaque nouvelle commande apparaîtra comme une nouvelle ligne avec les champs que vous avez sélectionnés.",
        },
        image: "/docs/integrations/google-sheets-2.svg",
      },
    ],
  },

  // ── Settings ─────────────────────────────────────────────────────────
  {
    slug: "account-settings",
    category: "settings",
    title: {
      en: "Managing your account",
      ar: "إدارة حسابك",
      fr: "Gérer votre compte",
    },
    description: {
      en: "Update your profile, email, and password.",
      ar: "حدّث ملفك الشخصي وبريدك الإلكتروني وكلمة مرورك.",
      fr: "Mettez à jour votre profil, email et mot de passe.",
    },
    steps: [
      {
        title: { en: "Open Settings", ar: "افتح الإعدادات", fr: "Ouvrez les Paramètres" },
        description: {
          en: "Click \"Settings\" at the bottom of the sidebar. This page shows your account profile, billing status, and custom domain configuration. Your profile information is separate from your store information — profile details are for your account, while store details are what customers see.",
          ar: "انقر على \"الإعدادات\" في أسفل الشريط الجانبي. تعرض هذه الصفحة ملفك الشخصي وحالة الفوترة وإعداد النطاق المخصص. معلومات ملفك الشخصي منفصلة عن معلومات متجرك — تفاصيل الملف الشخصي لحسابك، بينما تفاصيل المتجر هي ما يراه العملاء.",
          fr: "Cliquez sur « Paramètres » en bas de la barre latérale. Cette page affiche votre profil, le statut de facturation et la configuration du domaine personnalisé. Les informations de votre profil sont séparées de celles de votre boutique — les détails du profil concernent votre compte, tandis que les détails de la boutique sont ce que voient les clients.",
        },
        image: "/docs/settings/account-settings-1.svg",
      },
      {
        title: { en: "Update your details", ar: "حدّث بياناتك", fr: "Mettez à jour vos informations" },
        description: {
          en: "In the Profile section, you can update your display name and email address. Your billing status and current plan are shown in the Billing section. If you have a Pro plan, you can also connect a custom domain at the bottom of this page — enter your domain name and click \"Save Domain\". Remember to click \"Save\" after making any changes to your profile.",
          ar: "في قسم الملف الشخصي، يمكنك تحديث اسم العرض وعنوان البريد الإلكتروني. تُعرض حالة الفوترة وخطتك الحالية في قسم الفوترة. إذا كانت لديك خطة Pro، يمكنك أيضًا ربط نطاق مخصص في أسفل هذه الصفحة — أدخل اسم نطاقك وانقر \"حفظ النطاق\". تذكر النقر على \"حفظ\" بعد إجراء أي تغييرات على ملفك الشخصي.",
          fr: "Dans la section Profil, vous pouvez mettre à jour votre nom d'affichage et votre adresse email. Votre statut de facturation et votre plan actuel sont affichés dans la section Facturation. Si vous avez un plan Pro, vous pouvez aussi connecter un domaine personnalisé en bas de cette page — entrez votre nom de domaine et cliquez sur « Enregistrer le domaine ». N'oubliez pas de cliquer sur « Enregistrer » après toute modification de votre profil.",
        },
        image: "/docs/settings/account-settings-2.svg",
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getCategory(slug: string): DocCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryArticles(categorySlug: string): DocArticle[] {
  return ARTICLES.filter((a) => a.category === categorySlug)
}

export function getArticle(categorySlug: string, articleSlug: string): DocArticle | undefined {
  return ARTICLES.find((a) => a.category === categorySlug && a.slug === articleSlug)
}

export function searchArticles(query: string, lang: "en" | "ar" | "fr"): DocArticle[] {
  const q = query.toLowerCase()
  return ARTICLES.filter(
    (a) =>
      a.title[lang].toLowerCase().includes(q) ||
      a.description[lang].toLowerCase().includes(q),
  )
}
