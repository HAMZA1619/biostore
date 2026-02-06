import Link from "next/link"

interface StoreFooterProps {
  showBranding: boolean
}

export function StoreFooter({ showBranding }: StoreFooterProps) {
  return (
    <footer className="border-t py-6">
      <div className="mx-auto max-w-2xl px-4 text-center text-sm" style={{ color: "var(--store-text)", opacity: 0.6 }}>
        {showBranding && (
          <p>
            Powered by{" "}
            <Link href="/" className="underline">
              BioStore
            </Link>
          </p>
        )}
      </div>
    </footer>
  )
}
