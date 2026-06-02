import { type NextRequest } from "next/server"
import { db } from "@/db"
import { appointments } from "@/db/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { sendReviewRequestEmail } from "@/lib/email-service"
import { ok, fail } from "@/lib/api-response"
import { logError } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId } = body

    if (!appointmentId) {
      return fail("INVALID_INPUT", "Mã lịch hẹn là bắt buộc", 400)
    }

    const fullApt = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        customer: true,
        review: true,
        appointmentServices: {
          with: {
            service: true,
            staff: {
              with: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!fullApt) {
      return fail("APPOINTMENT_NOT_FOUND", "Lịch hẹn không tồn tại", 404)
    }

    if (fullApt.status !== "completed") {
      return fail("INVALID_STATUS", "Lịch hẹn chưa hoàn thành", 400)
    }

    if (fullApt.review) {
      return fail("ALREADY_REVIEWED", "Lịch hẹn này đã được đánh giá", 400)
    }

    if (!fullApt.customer?.email) {
      return fail("EMAIL_NOT_FOUND", "Khách hàng không đăng ký địa chỉ email cho lịch hẹn này", 404)
    }

    let token = fullApt.reviewToken
    if (!token) {
      token = randomUUID()
      await db
        .update(appointments)
        .set({ reviewToken: token, updatedAt: new Date() })
        .where(eq(appointments.id, appointmentId))
    }

    const staffName = fullApt.appointmentServices?.[0]?.staff?.user?.name || "Nhân viên"
    const emailData = {
      appointmentId: fullApt.id,
      customerName: fullApt.customerName,
      customerEmail: fullApt.customer.email,
      appointmentDate: fullApt.appointmentDate,
      appointmentTime: fullApt.appointmentTime,
      services: fullApt.appointmentServices.map((as: any) => ({
        name: as.service.name,
        price: as.priceAtBooking.toString(),
      })),
      staffName,
      reviewToken: token,
    }

    const emailSent = await sendReviewRequestEmail(emailData)
    if (!emailSent) {
      return fail("EMAIL_SEND_FAILED", "Không thể gửi email lúc này. Vui lòng thử lại sau.", 500)
    }

    return ok({ message: "Đã gửi email đánh giá thành công!" })
  } catch (error) {
    logError(error, { route: "/api/reviews/send-email", method: "POST" })
    return fail("SERVER_ERROR", "Unable to resend review email", 500)
  }
}
