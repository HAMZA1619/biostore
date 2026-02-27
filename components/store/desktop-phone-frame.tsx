"use client"

import { useState, useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { QrCode } from "@/components/store/qr-code"
import { getImageUrl } from "@/lib/utils"
import Image from "next/image"
import "@/lib/i18n"

interface DesktopPhoneFrameProps {
  storeName: string
  logoPath: string | null
  storeUrl: string
  children: React.ReactNode
}

const subscribe = () => () => {}
const getSnapshot = () => typeof window !== "undefined" && sessionStorage.getItem("biostore-desktop-mode") === "1"
const getServerSnapshot = () => false

export function DesktopPhoneFrame({ storeName, logoPath, storeUrl, children }: DesktopPhoneFrameProps) {
  const { t } = useTranslation()
  const savedDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [dismissed, setDismissed] = useState(false)

  const isDismissed = dismissed || savedDismissed

  const handleContinue = () => {
    sessionStorage.setItem("biostore-desktop-mode", "1")
    setDismissed(true)
  }

  if (isDismissed) return <>{children}</>

  const logoUrl = logoPath ? getImageUrl(logoPath) : null

  return (
    <>
      {/* Mobile: render normally */}
      <div className="md:hidden">{children}</div>

      {/* Desktop: phone frame + sidebar */}
      <div className="hidden md:flex min-h-screen items-center justify-center gap-12 p-8" style={{ backgroundColor: "var(--store-bg)", color: "var(--store-text)" }}>
        {/* Phone frame */}
        <div className="shrink-0">
          <div className="rounded-[2.5rem] border-[3px] border-gray-800 bg-white p-1.5 shadow-2xl">
            {/* Notch */}
            <div className="mx-auto mb-0.5 h-5 w-24 rounded-full bg-gray-800" />
            {/* Screen – transform creates a containing block so fixed elements stay inside */}
            <div className="phone-frame-screen relative w-[375px] h-[85vh] max-h-[780px] overflow-hidden rounded-[2rem]" style={{ transform: "translateZ(0)" }}>
              <style>{`
                @media (min-width: 640px) {
                  .phone-frame-screen [class~="fixed"][class~="left-1/2"] {
                    bottom: 0.75rem;
                    width: calc(100% - 2rem);
                  }
                  .phone-frame-screen [class~="fixed"][class~="left-1/2"] > a {
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                  }
                  .phone-frame-screen [class~="fixed"][class~="left-1/2"] a span {
                    font-size: inherit;
                  }
                  .phone-frame-screen [class~="fixed"][class~="left-1/2"] svg {
                    width: 1.25rem;
                    height: 1.25rem;
                  }
                }
              `}</style>
              <div className="h-full overflow-y-auto overflow-x-hidden">
                {children}
              </div>
            </div>
            {/* Home indicator */}
            <div className="mx-auto mt-1 h-1 w-28 rounded-full bg-gray-300" />
          </div>
        </div>

        {/* Sidebar info */}
        <div className="flex flex-col items-center gap-6 text-center max-w-[280px]">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              width={64}
              height={64}
              className="h-16 w-16 rounded-xl object-contain"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl font-bold text-2xl" style={{ backgroundColor: "var(--store-primary)", color: "var(--store-btn-text)" }}>
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}

          <h2 className="text-xl font-bold">{storeName}</h2>

          <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
            <QrCode url={storeUrl} size={180} />
          </div>

          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {t("storefront.scanToShop")}
          </p>

          <button
            onClick={handleContinue}
            className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
            style={{ color: "var(--store-primary)" }}
          >
            {t("storefront.continueOnDesktop")} &rarr;
          </button>
        </div>
      </div>
    </>
  )
}
