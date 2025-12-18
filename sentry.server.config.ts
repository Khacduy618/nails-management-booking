import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  maxBreadcrumbs: 50,
})
