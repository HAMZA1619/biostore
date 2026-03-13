import type { Metadata } from "next"

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

export const metadata: Metadata = {
  title: "Privacy Policy | Leadivo",
  description: "Learn how Leadivo collects, uses, and protects your personal data. Read our full privacy policy.",
  alternates: {
    canonical: `${APP_URL}/privacy`,
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
