import type { Metadata } from "next"
import { DocsShell } from "@/components/docs/docs-shell"

export const metadata: Metadata = {
  title: "Documentation — Leadivo",
  description: "Learn how to use Leadivo to create and manage your online store.",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>
}
