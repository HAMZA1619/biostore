import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    // Type checking runs via `npm run typecheck` before `next build`
    // Next.js's built-in worker OOMs on large projects
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
}

export default nextConfig
