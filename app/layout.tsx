import type { Metadata } from "next"
import { Outfit, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const APP_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://www.leadivo.app"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Leadivo — Turn Your Social Media Into a Store",
    template: "%s | Leadivo",
  },
  description:
    "Turn followers into customers. Create a beautiful storefront in seconds. Share one link in your bio — no coding needed.",
  keywords: [
    "Leadivo",
    "online store builder",
    "link in bio store",
    "ecommerce",
    "storefront",
    "COD",
    "WhatsApp orders",
  ],
  openGraph: {
    type: "website",
    siteName: "Leadivo",
    title: "Leadivo — Turn Your Social Media Into a Store",
    description:
      "Turn followers into customers. Create a beautiful storefront in seconds. Share one link in your bio — no coding needed.",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Leadivo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leadivo — Turn Your Social Media Into a Store",
    description:
      "Turn followers into customers. Create a beautiful storefront in seconds. Share one link in your bio — no coding needed.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        className={`${outfit.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
