import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['import-in-the-middle', 'require-in-the-middle'],
  turbopack: {
    root: '/Users/khacduy/Downloads/appointment-booking/nailsapp',
  },
  async headers() {
    // Development mode requires 'unsafe-eval' for HMR and debugging
    const isDev = process.env.NODE_ENV === 'development'

    // Note: tune CSP to your script/style usage as needed
    const csp = [
      "default-src 'self'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
      "media-src 'self'",
      "connect-src 'self' https: http: ws: wss:", // Added ws/wss for dev server
      "style-src 'self' 'unsafe-inline'",
      // Allow unsafe-eval in development for Next.js HMR
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
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
