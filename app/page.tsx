import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Smartphone, Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <span className="text-lg font-bold">BioStore</span>
        <div className="flex gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
          Turn your Facebook page into a{" "}
          <span className="text-primary">store</span>
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          Create a beautiful storefront in seconds. Share one link with your followers.
          Receive orders directly. No coding needed.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Create your store — Free</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold">
            Everything you need to sell online
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold">Ready in 2 minutes</h3>
              <p className="text-sm text-muted-foreground">
                Create your store, add products, share the link. That simple.
              </p>
            </div>
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold">Mobile-first</h3>
              <p className="text-sm text-muted-foreground">
                Your store looks perfect on phones — where your Facebook customers are.
              </p>
            </div>
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold">Orders via COD</h3>
              <p className="text-sm text-muted-foreground">
                Cash on delivery or bank transfer. No online payment setup needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>BioStore — The simplest way to sell online</p>
      </footer>
    </div>
  )
}
