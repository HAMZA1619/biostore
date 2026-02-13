"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { T } from "@/components/dashboard/translated-text"

export function SubscriptionGate() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">
            <T k="billing.gateTitle" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <T k="billing.gateDescription" />
          </p>
          <Button onClick={handleSubscribe} disabled={loading} className="w-full">
            {loading ? <T k="billing.subscribing" /> : <T k="billing.subscribe" />}
          </Button>
          <p className="text-xs text-muted-foreground">
            <T k="billing.priceNote" />
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
