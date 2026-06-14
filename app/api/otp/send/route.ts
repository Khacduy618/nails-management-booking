import { withEncryption } from "@/lib/api-middleware";
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, otpTokens } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendOTP } from "@/lib/email-service"
import { decrypt } from "@/lib/crypto"
import { fail, ok } from "@/lib/api-response"
import { logError, logDebug, logInfo } from "@/lib/logger"
import { getClientKey, rateLimit, rateLimitResponse, LIMITS } from "@/lib/rate-limit"
import { randomInt } from "crypto"

const sanitizePhone = (input: string) => input.replace(/\D/g, "")

async function _POST(request: NextRequest) {
    try {
        // Rate limiting for OTP requests
        const key = `otp-send:${getClientKey(request as unknown as Request)}`
        const rl = await rateLimit(key, LIMITS.lookupTight)
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: { code: "RATE_LIMITED", message: "Too many OTP requests" } },
                { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any }
            )
        }

        const body = await request.json()
        const { appointmentId, phone, recaptchaToken } = body

        if (!appointmentId || !phone) {
            return fail("MISSING_FIELDS", "Appointment ID and phone are required", 400)
        }

        // Verify reCAPTCHA token if secret key is configured
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
        if (recaptchaSecret) {
            if (!recaptchaToken) {
                return fail("RECAPTCHA_REQUIRED", "reCAPTCHA verification is required to prevent spam", 400)
            }

            try {
                const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`
                const verifyRes = await fetch(verifyUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        secret: recaptchaSecret,
                        response: recaptchaToken,
                    }).toString(),
                })

                if (!verifyRes.ok) {
                    throw new Error(`Google reCAPTCHA responded with status ${verifyRes.status}`)
                }

                const verifyData = await verifyRes.json()
                if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
                    logError(new Error("reCAPTCHA validation failed"), { verifyData })
                    return fail("RECAPTCHA_INVALID", "reCAPTCHA verification failed, please try again", 400)
                }
            } catch (error) {
                logError(error, { context: "reCAPTCHA verification error" })
                return fail("RECAPTCHA_ERROR", "Error verifying reCAPTCHA", 500)
            }
        }

        const decryptedPhone = decrypt(phone) || phone
        const sanitizedPhone = sanitizePhone(decryptedPhone)

        // Verify appointment exists and phone matches
        const appointment = await db.query.appointments.findFirst({
            where: eq(appointments.id, appointmentId),
        })

        if (!appointment) {
            return fail("NOT_FOUND", "Appointment not found", 404)
        }

        const isPhoneMatch = (p1: string, p2: string): boolean => {
            const clean = (p: string) => p.replace(/\D/g, "")
            const c1 = clean(p1)
            const c2 = clean(p2)
            if (c1 === c2) return true
            
            const normalize = (c: string) => {
                if (c.startsWith("84")) return c.slice(2)
                if (c.startsWith("0")) return c.slice(1)
                return c
            }
            return normalize(c1) === normalize(c2)
        }

        if (!isPhoneMatch(decrypt(appointment.customerPhone) || "", decryptedPhone)) {
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

        // Generate cryptographically secure 6-digit OTP
        const otp = randomInt(100000, 999999).toString()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        // Store or overwrite OTP in Database
        await db
            .insert(otpTokens)
            .values({
                appointmentId,
                code: otp,
                expiresAt,
            })
            .onConflictDoUpdate({
                target: otpTokens.appointmentId,
                set: {
                    code: otp,
                    expiresAt,
                    createdAt: new Date(),
                },
            })

        // Send OTP via SMS/Email
        try {
            await sendOTP(decryptedPhone, otp, appointment.customerName)
            
            // Secure logging: no plaintext OTP, masked phone
            logInfo("OTP sent successfully", { 
                appointmentId, 
                phone: sanitizedPhone.length > 4 ? `***${sanitizedPhone.slice(-4)}` : sanitizedPhone 
            })

            // Development mode: log OTP to console
            if (process.env.NODE_ENV === "development") {
                console.log(`\n🔐 [DEV] OTP Code for testing: ${otp}\n`)
            }
        } catch (error: any) {
            logError(error, { context: "Failed to send OTP", appointmentId })
            return fail("SMS_SEND_FAILED", `Không thể gửi SMS OTP: ${error.message || "Lỗi dịch vụ gửi tin"}`, 500)
        }

        return ok({ message: "OTP sent successfully" })
    } catch (error) {
        logError(error, { route: "/api/otp/send", method: "POST" })
        return fail("SERVER_ERROR", "Unable to send OTP", 500)
    }
}


// Wrapped exports for encryption/decryption
export const POST = withEncryption(_POST);
