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
          // CSP được xử lý bởi middleware.ts (nonce-based, per-request)
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
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
  // Tắt auto-instrument để Sentry không tự inject CSP headers (middleware.ts đã xử lý)
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
  disableLogger: true,
  widenClientFileUpload: false,
  hideSourceMaps: true,
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
