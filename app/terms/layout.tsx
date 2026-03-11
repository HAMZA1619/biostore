import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Leadivo",
  description: "Read the terms and conditions for using Leadivo, the online store builder for social media sellers.",
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
