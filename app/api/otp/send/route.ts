import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendOTP } from "@/lib/email-service"
import { fail, ok } from "@/lib/api-response"
import { logError, logDebug, logInfo } from "@/lib/logger"
import { getClientKey, rateLimit, rateLimitResponse, LIMITS } from "@/lib/rate-limit"

const sanitizePhone = (input: string) => input.replace(/\D/g, "")

// Store OTP in memory (in production, use Redis or database)
// Format: { appointmentId: { code: string, expiresAt: number } }
const otpStore = new Map<number, { code: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
    try {
        // Rate limiting for OTP requests
        const key = `otp-send:${getClientKey(request as unknown as Request)}`
        const rl = rateLimit(key, LIMITS.lookupTight)
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: { code: "RATE_LIMITED", message: "Too many OTP requests" } },
                { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any }
            )
        }

        const body = await request.json()
        const { appointmentId, phone } = body

        if (!appointmentId || !phone) {
            return fail("MISSING_FIELDS", "Appointment ID and phone are required", 400)
        }

        const sanitizedPhone = sanitizePhone(phone)

        // Verify appointment exists and phone matches
        const appointment = await db.query.appointments.findFirst({
            where: eq(appointments.id, appointmentId),
        })

        if (!appointment) {
            return fail("NOT_FOUND", "Appointment not found", 404)
        }

        const ownerPhone = sanitizePhone(appointment.customerPhone)
        if (ownerPhone !== sanitizedPhone) {
            return fail("UNAUTHORIZED", "Phone number does not match appointment", 403)
        }

        // Check if appointment can be cancelled
        const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`)
        const now = new Date()
        const hoursDiff = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (!["confirmed", "pending"].includes(appointment.status)) {
            return fail("INVALID_STATUS", "This appointment cannot be cancelled", 400)
        }

        if (hoursDiff <= 2) {
            return fail("TOO_LATE", "Cannot cancel appointments within 2 hours of scheduled time", 400)
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

        // Store OTP
        otpStore.set(appointmentId, { code: otp, expiresAt })

        // Send OTP via SMS/Email
        try {
            await sendOTP(phone, otp, appointment.customerName)
            logInfo("OTP sent successfully", { appointmentId, phone: sanitizedPhone, otpCode: otp })

            // Development mode: log OTP to console and return it
            if (process.env.NODE_ENV === "development") {
                console.log(`\n🔐 [DEV] OTP Code for testing: ${otp}\n`)
            }
        } catch (error) {
            logError(error, { context: "Failed to send OTP", appointmentId })
            // Don't fail the request, just log the error
            // In production, you might want to return an error here
        }

        return ok({ message: "OTP sent successfully" })
    } catch (error) {
        logError(error, { route: "/api/otp/send", method: "POST" })
        return fail("SERVER_ERROR", "Unable to send OTP", 500)
    }
}

export { otpStore }
