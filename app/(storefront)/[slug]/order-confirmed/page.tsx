import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ order?: string }>
}) {
  const { slug } = await params
  const { order } = await searchParams

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h1 className="text-2xl font-bold">Order Confirmed!</h1>
      {order && (
        <p className="text-lg text-muted-foreground">Order #{order}</p>
      )}
      <p className="max-w-sm text-muted-foreground">
        Thank you for your order. Your order details have been sent to the
        seller via WhatsApp. They will confirm your order shortly.
      </p>
      <Button asChild variant="outline">
        <Link href={`/${slug}`}>Continue shopping</Link>
      </Button>
    </div>
  )
}
