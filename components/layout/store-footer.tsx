interface StoreFooterProps {
  storeName: string
}

export function StoreFooter({ storeName }: StoreFooterProps) {
  return (
    <footer className="border-t py-6">
      <div className="mx-auto max-w-2xl px-4 text-center text-sm" style={{ color: "var(--store-text)", opacity: 0.6 }}>
        <p>&copy; {new Date().getFullYear()} {storeName}</p>
      </div>
    </footer>
  )
}
