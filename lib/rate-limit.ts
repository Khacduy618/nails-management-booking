type WindowConfig = {
    windowMs: number
    max: number
}

type Hit = {
    time: number
}

const buckets = new Map<string, Hit[]>()

function prune(list: Hit[], now: number, windowMs: number) {
    const cutoff = now - windowMs
    let i = 0
    while (i < list.length && list[i].time < cutoff) i++
    return i > 0 ? list.slice(i) : list
}

export function getClientKey(req: Request): string {
    // Prefer forwarded for, fallback to client IP if available via headers (behind proxies)
    const forwarded = req.headers.get('x-forwarded-for') || ''
    const ip = forwarded.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
    const ua = req.headers.get('user-agent') || ''
    return `${ip}|${ua}`
}

export function rateLimit(key: string, cfg: WindowConfig) {
    const now = Date.now()
    const list = buckets.get(key) ?? []
    const pruned = prune(list, now, cfg.windowMs)
    if (pruned.length >= cfg.max) {
        return { allowed: false, remaining: 0, resetMs: pruned[0] ? (pruned[0].time + cfg.windowMs - now) : cfg.windowMs }
    }
    pruned.push({ time: now })
    buckets.set(key, pruned)
    return { allowed: true, remaining: Math.max(0, cfg.max - pruned.length), resetMs: cfg.windowMs }
}

export const LIMITS = {
    lookupTight: { windowMs: 5 * 60 * 1000, max: 10 }, // 10 req / 5m per client
    booking: { windowMs: 10 * 60 * 1000, max: 6 }, // 6 bookings / 10m
    catalog: { windowMs: 60 * 1000, max: 60 }, // 60 req / 1m
}

export function rateLimitResponse(remaining: number, resetMs: number) {
    return {
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetMs / 1000)),
    }
}
