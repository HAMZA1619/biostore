import { redirect } from "next/navigation"

// Billing disabled for now — redirect to dashboard
export default function BillingPage() {
  redirect("/dashboard")
}
