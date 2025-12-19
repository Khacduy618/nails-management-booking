import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments } from "@/db/schema"
import { eq } from "drizzle-orm"
import { fail, ok } from "@/lib/api-response"
import { logError, logDebug, logInfo } from "@/lib/logger"
import { getClientKey, rateLimit, rateLimitResponse, LIMITS } from "@/lib/rate-limit"
import { otpStore } from "../send/route"

const sanitizePhone = (input: string) => input.replace(/\D/g, "")

export async function POST(request: NextRequest) {
    try {
        // Rate limiting for OTP verification
        const key = `otp-verify:${getClientKey(request as unknown as Request)}`
        const rl = rateLimit(key, LIMITS.lookupTight)
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: { code: "RATE_LIMITED", message: "Too many verification attempts" } },
                { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any }
            )
        }

        const body = await request.json()
        const { appointmentId, code, phone } = body

        if (!appointmentId || !code || !phone) {
            return fail("MISSING_FIELDS", "Appointment ID, OTP code, and phone are required", 400)
        }

        const sanitizedPhone = sanitizePhone(phone)

        // Verify OTP
        const storedOTP = otpStore.get(appointmentId)

        if (!storedOTP) {
            return fail("OTP_EXPIRED", "OTP has expired or not requested", 400)
        }

        if (storedOTP.expiresAt < Date.now()) {
            otpStore.delete(appointmentId)
            return fail("OTP_EXPIRED", "OTP has expired (5 minutes timeout)", 400)
        }

        if (storedOTP.code !== code.toString()) {
            return fail("INVALID_OTP", "OTP code is incorrect", 400)
        }

        // Verify appointment and phone
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

        // Cancel the appointment
        try {
            const result = await db
                .update(appointments)
                .set({ status: "cancelled" })
                .where(eq(appointments.id, appointmentId))
                .returning()

            if (result.length === 0) {
                return fail("NOT_FOUND", "Appointment not found", 404)
            }

            // Clear OTP after successful verification
            otpStore.delete(appointmentId)

            logInfo("Appointment cancelled successfully via OTP verification", { appointmentId, phone: sanitizedPhone })

            return ok({ message: "Appointment cancelled successfully" })
        } catch (error) {
            logError(error, { context: "Failed to cancel appointment after OTP verification", appointmentId })
            return fail("SERVER_ERROR", "Unable to cancel appointment", 500)
        }
    } catch (error) {
        logError(error, { route: "/api/otp/verify", method: "POST" })
        return fail("SERVER_ERROR", "Unable to verify OTP", 500)
    }
}
