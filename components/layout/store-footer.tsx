import Link from "next/link"
import { getT } from "@/lib/i18n/storefront"

interface StoreFooterProps {
  showBranding: boolean
  storeLang?: string
}

export function StoreFooter({ showBranding, storeLang = "en" }: StoreFooterProps) {
  const t = getT(storeLang)

  return (
    <footer className="border-t py-6">
      <div className="mx-auto max-w-2xl px-4 text-center text-sm" style={{ color: "var(--store-text)", opacity: 0.6 }}>
        {showBranding && (
          <p>
            {t("storefront.poweredBy")}{" "}
            <Link href="/" className="underline">
              BioStore
            </Link>
          </p>
        )}
      </div>
    </footer>
  )
}
