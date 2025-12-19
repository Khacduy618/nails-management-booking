/**
 * Time utilities for Vietnam timezone (Asia/Ho_Chi_Minh, UTC+7)
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'

/**
 * Get current date/time in Vietnam timezone
 */
export function getVietnamNow(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }))
}

/**
 * Convert any date to Vietnam timezone
 */
export function toVietnamTime(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Date(d.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }))
}

/**
 * Format date to YYYY-MM-DD in Vietnam timezone
 */
export function formatDateVN(date: Date | string): string {
    const d = toVietnamTime(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Format datetime to ISO string in Vietnam timezone
 */
export function toISOStringVN(date: Date | string): string {
    return toVietnamTime(date).toISOString()
}

/**
 * Get start of day in Vietnam timezone
 */
export function startOfDayVN(date?: Date | string): Date {
    const d = date ? toVietnamTime(date) : getVietnamNow()
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * Get end of day in Vietnam timezone
 */
export function endOfDayVN(date?: Date | string): Date {
    const d = date ? toVietnamTime(date) : getVietnamNow()
    d.setHours(23, 59, 59, 999)
    return d
}
