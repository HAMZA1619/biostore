import Link from "next/link"

interface StoreFooterProps {
  phone?: string | null
  showBranding: boolean
}

export function StoreFooter({ phone, showBranding }: StoreFooterProps) {
  return (
    <footer className="border-t py-6">
      <div className="mx-auto max-w-2xl px-4 text-center text-sm text-muted-foreground">
        {phone && (
          <p className="mb-2">
            Contact us on{" "}
            <a
              href={`https://wa.me/${phone.replace(/\s+/g, "").replace(/^\+/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 underline"
            >
              WhatsApp
            </a>
          </p>
        )}
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
