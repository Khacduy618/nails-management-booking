import { type NextRequest } from "next/server"
import { db } from "@/db"
import { appointments, reviews, staff, appointmentServices } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { addMinutes, format } from "date-fns"
import { ok, fail } from "@/lib/api-response"
import { logError, logInfo } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return fail("MISSING_TOKEN", "Review token is required", 400)
    }

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.reviewToken, token),
      with: {
        review: true,
        appointmentServices: {
          with: {
            service: { columns: { name: true } },
            staff: {
              with: {
                user: { columns: { name: true } }
              }
            }
          }
        }
      }
    })

    if (!appointment) {
      return fail("APPOINTMENT_NOT_FOUND", "Lịch hẹn không tồn tại hoặc liên kết không hợp lệ", 404)
    }

    if (appointment.status !== "completed") {
      return fail("INVALID_STATUS", "Chỉ có thể đánh giá nhân viên cho lịch hẹn đã hoàn thành", 400)
    }

    // Tính toán thời gian được phép đánh giá (kết thúc dịch vụ + 1 giờ)
    const start = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`)
    const serviceEnd = addMinutes(start, appointment.durationAtBooking)
    const allowedTime = addMinutes(serviceEnd, 60) // +1 hour
    const now = new Date()
    const isAllowed = now >= allowedTime

    const staffMember = appointment.appointmentServices?.[0]?.staff
    const staffName = staffMember?.user?.name || "Nhân viên"
    const staffId = staffMember?.id || null

    return ok({
      appointment: {
        id: appointment.id,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        status: appointment.status,
        durationAtBooking: appointment.durationAtBooking,
        staffName,
        staffId,
        services: appointment.appointmentServices.map((as: any) => as.service.name),
      },
      isAllowed,
      allowedTime: allowedTime.toISOString(),
      alreadyReviewed: !!appointment.review,
      review: appointment.review ? {
        rating: appointment.review.rating,
        comment: appointment.review.comment,
        createdAt: appointment.review.createdAt,
      } : null,
    })
  } catch (error) {
    logError(error, { route: "/api/reviews", method: "GET" })
    return fail("SERVER_ERROR", "Unable to fetch review details", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, rating, comment } = body

    if (!token || typeof rating !== "number" || rating < 1 || rating > 5) {
      return fail("INVALID_INPUT", "Token và số sao (1-5) là bắt buộc", 400)
    }

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.reviewToken, token),
      with: {
        review: true,
        appointmentServices: {
          columns: { staffId: true }
        }
      }
    })

    if (!appointment) {
      return fail("APPOINTMENT_NOT_FOUND", "Lịch hẹn không tồn tại hoặc liên kết không hợp lệ", 404)
    }

    if (appointment.status !== "completed") {
      return fail("INVALID_STATUS", "Chỉ có thể đánh giá nhân viên cho lịch hẹn đã hoàn thành", 400)
    }

    if (appointment.review) {
      return fail("ALREADY_REVIEWED", "Lịch hẹn này đã được đánh giá trước đó", 400)
    }

    // Kiểm tra thời gian + 1 giờ
    const start = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`)
    const serviceEnd = addMinutes(start, appointment.durationAtBooking)
    const allowedTime = addMinutes(serviceEnd, 60)
    const now = new Date()

    if (now < allowedTime) {
      return fail(
        "TIME_RESTRICTION",
        `Bạn chỉ có thể đánh giá nhân viên từ 1 giờ sau khi dịch vụ kết thúc (từ ${format(allowedTime, "HH:mm dd/MM/yyyy")})`,
        400
      )
    }

    const staffId = appointment.appointmentServices?.[0]?.staffId
    if (!staffId) {
      return fail("STAFF_NOT_FOUND", "Không tìm thấy thông tin nhân viên để đánh giá", 404)
    }

    await db.transaction(async (tx: any) => {
      // 1. Thêm review mới
      await tx.insert(reviews).values({
        appointmentId: appointment.id,
        staffId,
        rating,
        comment: comment || null,
        createdAt: new Date(),
      })

      // 2. Tính toán điểm trung bình thợ
      const avgResult = await tx
        .select({
          avgRating: sql<string>`avg(${reviews.rating})`,
        })
        .from(reviews)
        .where(eq(reviews.staffId, staffId))

      const newAvg = parseFloat(avgResult[0]?.avgRating || "0")
      const formattedAvg = newAvg.toFixed(2)

      // 3. Cập nhật rating vào bảng staff
      await tx
        .update(staff)
        .set({
          rating: formattedAvg,
          updatedAt: new Date(),
        })
        .where(eq(staff.id, staffId))
    })

    logInfo(`Review submitted successfully for Appointment #${appointment.id}, Staff ID #${staffId}, Rating: ${rating}`)

    return ok({ message: "Đánh giá nhân viên thành công" })
  } catch (error) {
    logError(error, { route: "/api/reviews", method: "POST" })
    return fail("SERVER_ERROR", "Unable to submit review", 500)
  }
}
