import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://biostore.app"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "BioStore — Turn Your Social Media Into a Store",
    template: "%s | BioStore",
  },
  description:
    "Create a beautiful storefront in seconds. Share one link in your bio. Receive orders directly — no coding needed.",
  openGraph: {
    type: "website",
    siteName: "BioStore",
    title: "BioStore — Turn Your Social Media Into a Store",
    description:
      "Create a beautiful storefront in seconds. Share one link in your bio. Receive orders directly — no coding needed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BioStore — Turn Your Social Media Into a Store",
    description:
      "Create a beautiful storefront in seconds. Share one link in your bio. Receive orders directly — no coding needed.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
