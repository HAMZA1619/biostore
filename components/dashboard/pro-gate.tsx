import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock } from "lucide-react"
import Link from "next/link"

interface ProGateProps {
  tier: string
  feature: string
  children: React.ReactNode
}

export function ProGate({ tier, feature, children }: ProGateProps) {
  if (tier === "pro") return <>{children}</>

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">
          <strong>{feature}</strong> is available on the Pro plan
        </p>
        <Button asChild>
          <Link href="/dashboard/billing">Upgrade to Pro</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
