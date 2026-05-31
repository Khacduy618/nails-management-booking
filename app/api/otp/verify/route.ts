import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, otpTokens, adminNotifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { fail, ok } from "@/lib/api-response"
import { logError, logDebug, logInfo } from "@/lib/logger"
import { getClientKey, rateLimit, rateLimitResponse, LIMITS } from "@/lib/rate-limit"
import { sendCancellationEmail, sendAdminCancellationNotification } from "@/lib/email-service"

const sanitizePhone = (input: string) => input.replace(/\D/g, "")

export async function POST(request: NextRequest) {
    try {
        // Rate limiting for OTP verification
        const key = `otp-verify:${getClientKey(request as unknown as Request)}`
        const rl = await rateLimit(key, LIMITS.lookupTight)
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

        // Verify OTP from database
        const storedOTP = await db.query.otpTokens.findFirst({
            where: eq(otpTokens.appointmentId, appointmentId),
        })

        if (!storedOTP) {
            return fail("OTP_EXPIRED", "OTP has expired or not requested", 400)
        }

        const now = new Date()
        if (storedOTP.expiresAt < now) {
            // Delete expired OTP
            await db.delete(otpTokens).where(eq(otpTokens.appointmentId, appointmentId))
            return fail("OTP_EXPIRED", "OTP has expired (5 minutes timeout)", 400)
        }

        if (storedOTP.code !== code.toString()) {
            return fail("INVALID_OTP", "OTP code is incorrect", 400)
        }

        // Verify appointment and phone with relations
        const appointment = await db.query.appointments.findFirst({
            where: eq(appointments.id, appointmentId),
            with: {
                customer: true,
                appointmentServices: {
                    with: {
                        service: true,
                        staff: {
                            with: {
                                user: true,
                            },
                        },
                    },
                },
            },
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
            await db.delete(otpTokens).where(eq(otpTokens.appointmentId, appointmentId))

            // Ghi nhận thông báo cho admin
            await db.insert(adminNotifications).values({
                title: `Khách hủy lịch: #${appointmentId}`,
                message: `Khách hàng ${appointment.customerName} (${sanitizedPhone}) đã hủy lịch hẹn lúc ${appointment.appointmentTime.substring(0, 5)} ngày ${appointment.appointmentDate}.`,
            })

            // Secure logging: masked phone
            logInfo("Appointment cancelled successfully via OTP verification", { 
                appointmentId, 
                phone: sanitizedPhone.length > 4 ? `***${sanitizedPhone.slice(-4)}` : sanitizedPhone 
            })

            // Async send emails
            const customerEmail = appointment.customer?.email || ""
            const staffName = appointment.appointmentServices?.[0]?.staff?.user?.name || "Nhân viên"
            const emailData = {
                appointmentId,
                customerName: appointment.customerName,
                customerEmail,
                customerPhone: appointment.customerPhone,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                services: appointment.appointmentServices.map((as: any) => ({
                    name: as.service.name,
                    price: as.priceAtBooking.toString(),
                })),
                staffName,
                totalPrice: Number(appointment.priceAtBooking),
                totalDuration: appointment.durationAtBooking,
                notes: appointment.notes,
            }

            if (customerEmail) {
                sendCancellationEmail(emailData).catch(err => {
                    logError(err, { context: "Failed to send cancellation email to customer", appointmentId })
                })
            }

            sendAdminCancellationNotification(emailData).catch(err => {
                logError(err, { context: "Failed to send cancellation notification to admin", appointmentId })
            })

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
