import { withSentryConfig } from "@sentry/nextjs"
import { fileURLToPath } from "url"
import path from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['import-in-the-middle', 'require-in-the-middle'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          // HSTS for production (adjust max-age and includeSubDomains if you serve HTTPS)
          { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG || undefined,
  project: process.env.SENTRY_PROJECT || undefined,
  silent: true,
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
