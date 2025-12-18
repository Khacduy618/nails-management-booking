import * as Sentry from "@sentry/nextjs"

type Context = Record<string, unknown>

function scrub(value: unknown): unknown {
  if (typeof value === 'string') {
    // Mask emails and phones
    if (value.includes('@')) return value.replace(/([^@]{2})[^@]*(@.*)/, '$1***$2')
    const digits = value.replace(/\D/g, '')
    if (digits.length >= 8) return `***${digits.slice(-2)}`
    return value
  }
  if (Array.isArray(value)) return value.map(scrub)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (/password|secret|token|authorization/i.test(k)) {
        out[k] = '[REDACTED]'
      } else if (/phone|email|notes|customerName|customerPhone|customerEmail/i.test(k)) {
        out[k] = scrub(v)
      } else {
        out[k] = v
      }
    }
    return out
  }
  return value
}

export function logError(error: unknown, context: Context = {}): void {
  const safeContext = scrub(context)
  console.error((context as any)?.message || "Unexpected error", error, safeContext)
  Sentry.captureException(error, { extra: safeContext as any })
}

export function logInfo(message: string, context: Context = {}): void {
  const safeContext = scrub(context)
  console.info(message, safeContext)
  Sentry.captureMessage(message, { level: "info", extra: safeContext as any })
}

export function logDebug(message: string, context: Context = {}): void {
  const enableDebug = process.env.DEBUG_BOOKING === 'true' || process.env.NODE_ENV !== 'production'
  if (!enableDebug) return
  const safeContext = scrub(context)
  console.debug(message, safeContext)
  Sentry.addBreadcrumb({ message, data: safeContext as Record<string, any>, level: 'debug' as any })
}
