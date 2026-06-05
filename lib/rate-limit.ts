import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

type WindowConfig = {
    windowMs: number
    max: number
}

type Hit = {
    time: number
}

let redis: Redis | null = null
const ratelimitCache = new Map<string, Ratelimit>()

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
}

const buckets = new Map<string, Hit[]>()

function prune(list: Hit[], now: number, windowMs: number) {
    const cutoff = now - windowMs
    let i = 0
    while (i < list.length && list[i].time < cutoff) i++
    return i > 0 ? list.slice(i) : list
}

export function getClientKey(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for') || ''
    const ip = forwarded.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
    const ua = req.headers.get('user-agent') || ''
    return `${ip}|${ua}`
}

export async function rateLimit(key: string, cfg: WindowConfig) {
    if (redis) {
        const cacheKey = `${cfg.windowMs}:${cfg.max}`
        let limiter = ratelimitCache.get(cacheKey)
        if (!limiter) {
            const seconds = Math.ceil(cfg.windowMs / 1000)
            limiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(cfg.max, `${seconds} s`),
                analytics: true,
            })
            ratelimitCache.set(cacheKey, limiter)
        }
        const result = await limiter.limit(key)
        return {
            allowed: result.success,
            remaining: result.remaining,
            resetMs: result.reset - Date.now(),
        }
    }

    // Fallback to in-memory for dev/testing
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
    lookupTight: { windowMs: 5 * 60 * 1000, max: 10 },
    booking: { windowMs: 10 * 60 * 1000, max: 6 },
    catalog: { windowMs: 60 * 1000, max: 60 },
}

export function rateLimitResponse(remaining: number, resetMs: number) {
    return {
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetMs / 1000)),
    }
}

