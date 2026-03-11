import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Leadivo",
  description: "Learn how Leadivo collects, uses, and protects your personal data. Read our full privacy policy.",
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
