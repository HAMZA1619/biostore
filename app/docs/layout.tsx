import type { Metadata } from "next"
import { DocsShell } from "@/components/docs/docs-shell"

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

export const metadata: Metadata = {
  title: "Documentation — Leadivo",
  description: "Learn how to use Leadivo to create and manage your online store.",
  alternates: {
    canonical: `${APP_URL}/docs`,
  },
  openGraph: {
    type: "website",
    title: "Documentation — Leadivo",
    description: "Learn how to use Leadivo to create and manage your online store.",
    url: `${APP_URL}/docs`,
  },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>
}
