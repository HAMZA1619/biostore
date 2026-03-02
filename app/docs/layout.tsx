import type { Metadata } from "next"
import { DocsShell } from "@/components/docs/docs-shell"

export const metadata: Metadata = {
  title: "Documentation — BioStore",
  description: "Learn how to use BioStore to create and manage your online store.",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>
}
