import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password | Leadivo",
  description: "Set a new password for your Leadivo account.",
  robots: { index: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
