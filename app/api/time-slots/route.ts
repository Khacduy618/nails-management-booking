import { type NextRequest } from "next/server"
import { db } from "@/db"
import { staff, staffServices, appointments, appointmentServices, staffSchedules, services } from "@/db/schema"
import { sql, eq, inArray, and, not } from "drizzle-orm"
import { addMinutes, getDay } from "date-fns"
import { ok, fail } from "@/lib/api-response"
import { logError } from "@/lib/logger"

// Map JavaScript getDay (0=Sunday) to day_of_week enum index
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    const serviceIdsParam = searchParams.get("serviceIds")

    if (!dateParam || !serviceIdsParam) {
      return fail("INVALID_INPUT", "Date and serviceIds are required", 400)
    }

    const serviceIds = serviceIdsParam
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !Number.isNaN(id))

    if (serviceIds.length === 0) {
      return fail("INVALID_INPUT", "Invalid serviceIds", 400)
    }

    // Fetch services to calculate total duration
    const servicesInfo = await db.query.services.findMany({
      where: inArray(services.id, serviceIds),
    })

    if (servicesInfo.length !== serviceIds.length) {
      return fail("SERVICE_NOT_FOUND", "One or more services not found", 404)
    }

    const totalDuration = servicesInfo.reduce((sum: number, svc: any) => sum + svc.duration, 0)

    // Parse date
    const parsedDate = new Date(`${dateParam}T00:00:00`)
    if (Number.isNaN(parsedDate.getTime())) {
      return fail("INVALID_INPUT", "Invalid date format", 400)
    }
    const dayOfWeek = getDay(parsedDate) // 0=Sunday, 1=Monday, ..., 6=Saturday

    // 1. Find all qualified staff members who have skills for ALL selected services
    const capableStaffSubquery = db
      .select({ staffId: staffServices.staffId })
      .from(staffServices)
      .where(inArray(staffServices.serviceId, serviceIds))
      .groupBy(staffServices.staffId)
      .having(sql`count(distinct ${staffServices.serviceId}) = ${serviceIds.length}`)
      .as("capable_staff")

    const capableStaffIdsResult = await db.select({ id: capableStaffSubquery.staffId }).from(capableStaffSubquery)
    const capableStaffIds = capableStaffIdsResult.map((r: any) => r.id)

    if (capableStaffIds.length === 0) {
      return ok({ slots: [] })
    }

    // 2. Fetch schedules for these capable staff members on this dayOfWeek
    const workingStaff = await db.query.staff.findMany({
      where: and(inArray(staff.id, capableStaffIds), eq(staff.status, "active")),
      with: {
        staffSchedules: {
          where: eq(staffSchedules.dayOfWeek, dayOfWeek),
        },
      },
    })

    // Filter staff who actually work on this day
    const staffSchedulesList = workingStaff
      .map((s: any) => {
        const schedule = s.staffSchedules[0]
        if (!schedule || !schedule.startTime || !schedule.endTime) return null
        return {
          staffId: s.id,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        }
      })
      .filter((ss: any): ss is { staffId: number; startTime: string; endTime: string } => ss !== null)

    if (staffSchedulesList.length === 0) {
      return ok({ slots: [] })
    }

    const workingStaffIds = staffSchedulesList.map((ss: any) => ss.staffId)

    // 3. Fetch all active appointments for these working staff members on this date
    const dayAppointments = await db
      .select({
        id: appointments.id,
        appointmentTime: appointments.appointmentTime,
        durationAtBooking: appointments.durationAtBooking,
        staffId: appointmentServices.staffId,
      })
      .from(appointments)
      .leftJoin(appointmentServices, eq(appointments.id, appointmentServices.appointmentId))
      .where(
        and(
          inArray(appointmentServices.staffId, workingStaffIds),
          eq(appointments.appointmentDate, dateParam),
          not(eq(appointments.status, "cancelled"))
        )
      )

    // Helper: convert HH:mm:ss or HH:mm string to minutes from midnight
    const timeToMinutes = (timeStr: string): number => {
      const parts = timeStr.split(":")
      const hours = Number(parts[0]) || 0
      const minutes = Number(parts[1]) || 0
      return hours * 60 + minutes
    }

    // Map busy intervals for each staff member
    const busyIntervalsMap = new Map<number, Array<{ start: number; end: number }>>()
    workingStaffIds.forEach((sid: number) => busyIntervalsMap.set(sid, []))

    dayAppointments.forEach((apt: any) => {
      if (apt.staffId !== null) {
        const startMin = timeToMinutes(apt.appointmentTime)
        const duration = apt.durationAtBooking
        const intervals = busyIntervalsMap.get(apt.staffId)
        if (intervals) {
          intervals.push({ start: startMin, end: startMin + duration })
        }
      }
    })

    // Generate potential slots from 09:00 to 20:00 (every 30 minutes)
    const potentialSlots: string[] = []
    for (let hour = 9; hour <= 20; hour++) {
      potentialSlots.push(`${String(hour).padStart(2, "0")}:00`)
      if (hour < 20) {
        potentialSlots.push(`${String(hour).padStart(2, "0")}:30`)
      }
    }

    const availableSlots: string[] = []

    // For each slot, check if at least one staff member is available
    potentialSlots.forEach((slot) => {
      const slotStart = timeToMinutes(slot)
      const slotEnd = slotStart + totalDuration

      const isAnyStaffAvailable = staffSchedulesList.some((ss: any) => {
        const schedStart = timeToMinutes(ss.startTime)
        const schedEnd = timeToMinutes(ss.endTime)

        // 1. Must be within working hours
        if (slotStart < schedStart || slotEnd > schedEnd) {
          return false
        }

        // 2. Must not overlap with busy intervals
        const busyIntervals = busyIntervalsMap.get(ss.staffId) || []
        const hasOverlap = busyIntervals.some(
          (interval: any) => interval.start < slotEnd && interval.end > slotStart
        )

        return !hasOverlap
      })

      if (isAnyStaffAvailable) {
        availableSlots.push(slot)
      }
    })

    return ok({ slots: availableSlots })
  } catch (error) {
    logError(error, { route: "/api/time-slots", method: "GET" })
    return fail("SERVER_ERROR", "Unable to compute time slots", 500)
  }
}
