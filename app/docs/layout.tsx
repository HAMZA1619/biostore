import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation — BioStore",
  description: "Learn how to use BioStore to create and manage your online store.",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <a href="/" className="text-lg font-bold text-primary">
            BioStore
          </a>
          <span className="ml-3 text-sm text-muted-foreground">Docs</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
