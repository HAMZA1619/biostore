"use client"

import urlJoin from "url-join"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useBaseHref } from "@/lib/hooks/use-base-href"
import { PackageX } from "lucide-react"
import "@/lib/i18n"

export default function StoreNotFound() {
  const { t } = useTranslation()
  const router = useRouter()
  const baseHref = useBaseHref()

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-center">
      <div>
        <PackageX className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 text-2xl font-bold">{t("storefront.notFoundTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("storefront.notFoundDescription")}</p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push(urlJoin(baseHref, "/"))}
        >
          {t("storefront.continueShopping")}
        </Button>
      </div>
    </div>
  )
}
