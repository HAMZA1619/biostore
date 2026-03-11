import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In | Leadivo",
  description: "Sign in to your Leadivo dashboard to manage your store, products, and orders.",
  robots: { index: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
