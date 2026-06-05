import { type NextRequest } from "next/server"
import { db } from "@/db"
import { staff, staffServices, appointments, services, appointmentServices, staffSchedules } from "@/db/schema"
import { sql, eq, inArray, and, not } from "drizzle-orm"
import { addMinutes, format, getDay } from "date-fns"
import { ok, fail } from "@/lib/api-response"
import { logError } from "@/lib/logger"

// Map JavaScript getDay (0=Sunday) to day_of_week enum
const getDayOfWeek = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[getDay(date)]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceIdsParam = searchParams.get("serviceIds")
    const dateParam = searchParams.get("date")
    const timeParam = searchParams.get("time")

    if (!serviceIdsParam || !dateParam || !timeParam) {
      return fail("INVALID_INPUT", "Service IDs, date and time are required", 400)
    }

    const serviceIds = serviceIdsParam
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((id) => !Number.isNaN(id))

    if (!serviceIds.length) {
      return fail("INVALID_INPUT", "Invalid service IDs", 400)
    }

    const servicesInfo = await db.query.services.findMany({ where: inArray(services.id, serviceIds) })
    if (servicesInfo.length !== serviceIds.length) {
      return fail("SERVICE_NOT_FOUND", "Services not found", 404)
    }

    const start = new Date(`${dateParam}T${timeParam}:00`)
    if (Number.isNaN(start.getTime())) {
      return fail("INVALID_INPUT", "Invalid date or time", 400)
    }

    const totalDuration = servicesInfo.reduce((sum: number, svc: any) => sum + svc.duration, 0)
    const end = addMinutes(start, totalDuration)
    const startDateStr = format(start, "yyyy-MM-dd")
    const startTimeStr = format(start, "HH:mm:ss")
    const endTimeStr = format(end, "HH:mm:ss")

    const capableStaffSubquery = db
      .select({ staffId: staffServices.staffId })
      .from(staffServices)
      .where(inArray(staffServices.serviceId, serviceIds))
      .groupBy(staffServices.staffId)
      .having(sql`count(distinct ${staffServices.serviceId}) = ${serviceIds.length}`)
      .as("capable_staff")

    const capableStaffIdsResult = await db.select({ id: capableStaffSubquery.staffId }).from(capableStaffSubquery)
    const capableStaffIds = capableStaffIdsResult.map((record: any) => record.id)

    if (!capableStaffIds.length) {
      return ok({ staff: [] })
    }

    const busyStaffQuery = db
      .selectDistinct({ staffId: appointmentServices.staffId })
      .from(appointmentServices)
      .leftJoin(appointments, eq(appointmentServices.appointmentId, appointments.id))
      .where(
        and(
          inArray(appointmentServices.staffId, capableStaffIds),
          eq(appointments.appointmentDate, startDateStr),
          not(eq(appointments.status, "cancelled")),
          sql`${appointments.appointmentTime} < ${endTimeStr}::time`,
          sql`${appointments.appointmentTime} + (${appointments.durationAtBooking} * interval '1 minute') > ${startTimeStr}::time`,
        ),
      )

    const busyStaff = await busyStaffQuery
    const busyStaffIds = new Set(busyStaff.map((item: any) => item.staffId).filter((id: any): id is number => id !== null))

    const availableStaffIds = capableStaffIds.filter((id: any) => !busyStaffIds.has(id))
    if (!availableStaffIds.length) {
      return ok({ staff: [] })
    }

    // 🆕 Kiểm tra lịch làm của nhân viên (staffSchedules)
    const dayOfWeek = getDay(start) // 0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7

    const staffWithSchedules = await db.query.staff.findMany({
      where: and(inArray(staff.id, availableStaffIds), eq(staff.status, "active")),
      with: {
        staffSchedules: {
          where: eq(staffSchedules.dayOfWeek, dayOfWeek),
        },
        user: {
          columns: { name: true },
        },
      },
      columns: { id: true, rating: true },
    })

    // Truy vấn số lượng lịch hẹn hoạt động trong ngày hẹn yêu cầu của từng nhân viên
    const appointmentCountsResult = await db
      .select({
        staffId: appointmentServices.staffId,
        count: sql<number>`count(distinct ${appointmentServices.appointmentId})`.mapWith(Number),
      })
      .from(appointmentServices)
      .leftJoin(appointments, eq(appointmentServices.appointmentId, appointments.id))
      .where(
        and(
          inArray(appointmentServices.staffId, availableStaffIds),
          eq(appointments.appointmentDate, startDateStr),
          not(eq(appointments.status, "cancelled"))
        )
      )
      .groupBy(appointmentServices.staffId)

    const appointmentCountMap = new Map<number, number>()
    appointmentCountsResult.forEach((row: { staffId: number | null; count: number }) => {
      if (row.staffId !== null) {
        appointmentCountMap.set(row.staffId, row.count)
      }
    })

    // Lọc nhân viên có lịch làm hợp lệ
    const staffWithValidSchedule = staffWithSchedules.filter((s: any) => {
      if (s.staffSchedules.length === 0) {
        // Không có schedule cho ngày này - coi là không làm
        return false
      }
      const schedule = s.staffSchedules[0]
      // Kiểm tra có thời gian làm hợp lệ (startTime và endTime không trống)
      if (!schedule.startTime || !schedule.endTime) {
        // Nếu không có thời gian làm - coi là ngày nghỉ
        return false
      }
      // Kiểm tra giờ yêu cầu có nằm trong khung giờ làm không
      const [scheduleStartHour, scheduleStartMin] = schedule.startTime.split(':').map(Number)
      const [scheduleEndHour, scheduleEndMin] = schedule.endTime.split(':').map(Number)
      const [requestHour, requestMin] = timeParam.split(':').map(Number)

      const scheduleStart = scheduleStartHour * 60 + scheduleStartMin
      const scheduleEnd = scheduleEndHour * 60 + scheduleEndMin
      const requestTime = requestHour * 60 + requestMin

      return requestTime >= scheduleStart && requestTime < scheduleEnd
    })

    const availableStaffDetails = staffWithValidSchedule.map((s: any) => {
      const count = appointmentCountMap.get(s.id) ?? 0
      const ratingVal = s.rating ? parseFloat(s.rating) : 0
      return {
        id: s.id,
        name: s.user?.name ?? "",
        rating: ratingVal,
        appointmentCount: count,
        appointment_count_today: count,
      }
    })

    // Sắp xếp: rating DESC, sau đó đến appointmentCount ASC
    availableStaffDetails.sort((a: { rating: number; appointmentCount: number }, b: { rating: number; appointmentCount: number }) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }
      return a.appointmentCount - b.appointmentCount
    })

    return ok({ staff: availableStaffDetails })
  } catch (error) {
    logError(error, { route: "/api/staff/available", method: "GET" })
    return fail("SERVER_ERROR", "Unable to fetch staff availability", 500)
  }
}
