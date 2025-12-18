import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, appointmentServices, services, customers } from "@/db/schema"
import { eq, and, sql, inArray, not } from "drizzle-orm"
import { addMinutes, format } from "date-fns"
import { ok, fail } from "@/lib/api-response"
import { logError, logDebug, logInfo } from "@/lib/logger"
import { sendConfirmationEmail } from "@/lib/email-service"
import { getClientKey, rateLimit, rateLimitResponse, LIMITS } from "@/lib/rate-limit"

type AppointmentDTO = {
  id: number
  date: string
  time: string
  status: string
}

type CreateAppointmentPayload = {
  serviceIds: number[]
  customerName: string
  customerPhone: string
  customerEmail?: string
  date: string
  time: string
  staffId: number
  notes?: string
}

const sanitizePhone = (input: string) => input.replace(/\s|-/g, "")
const isBusinessHours = (date: Date) => {
  const hour = date.getHours()
  return hour >= 9 && hour < 18
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for lookup
    const key = `apt-lookup:${getClientKey(request as unknown as Request)}`
    const rl = rateLimit(key, LIMITS.lookupTight)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: { code: "FETCH_ERROR", message: "Too many requests" } }, { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any })
    }
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      logDebug('GET /api/appointments missing phone', { url: request.url })
      return fail("MISSING_PHONE", "Phone number is required", 400)
    }

    const cleanedPhone = sanitizePhone(phone)
    logDebug('GET /api/appointments request', { phone: cleanedPhone })

    const userAppointments = await db.query.appointments.findMany({
      where: eq(appointments.customerPhone, cleanedPhone),
      columns: {
        id: true,
        appointmentDate: true,
        appointmentTime: true,
        status: true,
      },
      orderBy: (appointments, { desc }) => [
        desc(appointments.appointmentDate),
        desc(appointments.appointmentTime),
      ],
    })

    logInfo(`GET /api/appointments: Found ${userAppointments.length} appointments for phone ${cleanedPhone}`, { phone: cleanedPhone, count: userAppointments.length })

    const formatted: AppointmentDTO[] = userAppointments.map((apt) => {
      return {
        id: apt.id,
        date: format(apt.appointmentDate, "yyyy-MM-dd"),
        time: apt.appointmentTime,
        status: apt.status,
      }
    })

    return ok({ data: formatted, total: formatted.length })
  } catch (error) {
    logError(error, { route: "/api/appointments", method: "GET" })
    return fail("SERVER_ERROR", "Unable to fetch appointments", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for booking
    const key = `apt-book:${getClientKey(request as unknown as Request)}`
    const rl = rateLimit(key, LIMITS.booking)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: { code: "CONFLICT", message: "Too many requests" } }, { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any })
    }
    const body = (await request.json()) as Partial<CreateAppointmentPayload>
    const { serviceIds, customerName, customerPhone, customerEmail, date, time, staffId, notes } = body
    logDebug('POST /api/appointments received', { body })

    if (!serviceIds?.length || !customerName || !customerPhone || !date || !time || !staffId) {
      logDebug('POST /api/appointments invalid input', { serviceIds, customerName, customerPhone, date, time, staffId })
      logInfo('POST /api/appointments: VALIDATION FAILED - Missing required fields', { serviceIds, customerName, customerPhone, date, time, staffId })
      return fail("INVALID_INPUT", "Missing required fields", 400)
    }

    const sanitizedPhone = sanitizePhone(customerPhone)

    const servicesSelected = await db.query.services.findMany({ where: inArray(services.id, serviceIds) })
    logDebug('Fetched services for booking', { serviceIds, found: servicesSelected.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })) })
    if (servicesSelected.length !== serviceIds.length) {
      logDebug('POST /api/appointments service not found', { requested: serviceIds, foundIds: servicesSelected.map(s => s.id) })
      logInfo('POST /api/appointments: SERVICE NOT FOUND', { requested: serviceIds, foundIds: servicesSelected.map(s => s.id), missing: serviceIds.filter(id => !servicesSelected.map(s => s.id).includes(id)) })
      return fail("SERVICE_NOT_FOUND", "One or more services not found", 404)
    }

    const appointmentStart = new Date(`${date}T${time}`)
    if (Number.isNaN(appointmentStart.getTime())) {
      return fail("INVALID_INPUT", "Invalid date or time", 400)
    }

    const totalDuration = servicesSelected.reduce((sum, svc) => sum + svc.duration, 0)
    const totalPrice = servicesSelected.reduce((sum, svc) => sum + Number(svc.price), 0)
    const appointmentEnd = addMinutes(appointmentStart, totalDuration)

    logDebug('Computed appointment totals', { totalDuration, totalPrice, appointmentStart: appointmentStart.toISOString(), appointmentEnd: appointmentEnd.toISOString() })

    const commission = isBusinessHours(appointmentStart) ? 10 : 30
    const existingEnd = sql`ADDTIME(${appointments.appointmentTime}, SEC_TO_TIME(${appointments.durationAtBooking} * 60))`

    const conflicting = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          sql`${staffId} IN (SELECT ${appointmentServices.staffId} FROM ${appointmentServices} WHERE ${appointmentServices.appointmentId} = ${appointments.id})`,
          sql`DATE(${appointments.appointmentDate}) = DATE(${format(appointmentStart, "yyyy-MM-dd")})`,
          not(eq(appointments.status, "cancelled")),
          sql`${appointments.appointmentTime} < ${format(appointmentEnd, "HH:mm:ss")}`,
          sql`${existingEnd} > ${format(appointmentStart, "HH:mm:ss")}`,
        ),
      )

    if (conflicting.length > 0) {
      logDebug('POST /api/appointments conflict detected', { staffId, date: format(appointmentStart, "yyyy-MM-dd"), time, conflictingCount: conflicting.length })
      logInfo(`POST /api/appointments: CONFLICT DETECTED - Staff ${staffId} has ${conflicting.length} appointment(s) on ${format(appointmentStart, "yyyy-MM-dd")} at ${time}`, { staffId, date: format(appointmentStart, "yyyy-MM-dd"), time, conflictingCount: conflicting.length, conflictingIds: conflicting.map(c => c.id) })
      return fail(
        "STAFF_CONFLICT",
        "Khung giờ này đã có lịch hẹn. Vui lòng chọn thời gian hoặc nhân viên khác.",
        409,
      )
    }

    // Prepare payloads for logging
    const appointmentInsertPayload = {
      customerName,
      customerPhone: sanitizedPhone,
      notes,
      appointmentDate: appointmentStart,
      appointmentTime: time,
      status: 'pending' as const,
      priceAtBooking: totalPrice.toString(),
      durationAtBooking: totalDuration,
      isOvertime: !isBusinessHours(appointmentStart),
    }

    const appointmentServicePayloads = servicesSelected.map((svc) => ({
      serviceId: svc.id,
      staffId,
      priceAtBooking: svc.price,
      workShare: "100.00",
      commissionPercentage: commission.toString(),
    }))

    logDebug('About to run booking transaction', { appointmentInsertPayload, appointmentServicePayloads })

    const createdAppointment = await db.transaction(async (tx) => {
      // Find or create customer
      let customerId: number | null = null

      try {
        const existingCustomer = await tx.query.customers.findFirst({
          where: eq(customers.phone, sanitizedPhone),
        })

        if (existingCustomer) {
          // Update existing customer
          customerId = existingCustomer.id
          await tx
            .update(customers)
            .set({
              serviceCount: existingCustomer.serviceCount + servicesSelected.length,
              totalAmount: (
                Number(existingCustomer.totalAmount) + totalPrice
              ).toString(),
              lastAppointmentDate: appointmentStart,
              email: customerEmail || existingCustomer.email,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, existingCustomer.id))
        } else {
          // Create new customer
          const [insertResult] = (await tx
            .insert(customers)
            .values({
              phone: sanitizedPhone,
              name: customerName,
              email: customerEmail || undefined,
              serviceCount: servicesSelected.length,
              totalAmount: totalPrice.toString(),
              lastAppointmentDate: appointmentStart,
              createdAt: new Date(),
              updatedAt: new Date(),
            })) as unknown as [{ insertId: number }]

          customerId = insertResult.insertId
        }
      } catch (customerError) {
        logError(customerError, { context: 'customer_upsert', phone: sanitizedPhone })
        // Continue even if customer creation fails, to not block appointment
      }

      const [insertResult] = (await tx
        .insert(appointments)
        .values({
          ...appointmentInsertPayload,
          customerId: customerId || undefined,
        })) as unknown as [{ insertId: number }]

      const appointmentId = insertResult.insertId

      if (servicesSelected.length) {
        await tx.insert(appointmentServices).values(
          servicesSelected.map((svc) => ({
            appointmentId,
            serviceId: svc.id,
            staffId: svc.id === svc.id ? staffId : staffId, // keep simple mapping
            priceAtBooking: svc.price,
            workShare: "100.00",
            commissionPercentage: commission.toString(),
          })),
        )
      }

      return tx.query.appointments.findFirst({
        where: eq(appointments.id, appointmentId),
        with: {
          appointmentServices: {
            with: {
              service: { columns: { name: true } },
              staff: { columns: { name: true } },
            },
          },
        },
      })
    })

    logDebug('Booking transaction committed', { createdAppointment: createdAppointment ?? null })

    logInfo(`POST /api/appointments: Appointment created successfully (ID: ${createdAppointment?.id}, Customer: ${customerName}, Services: ${serviceIds?.length || 0})`, {
      appointmentId: createdAppointment?.id,
      customerName,
      customerPhone: sanitizedPhone,
      serviceCount: serviceIds?.length,
      totalPrice: totalPrice,
      staffId,
    })

    // Send confirmation email if customer provided email
    if (customerEmail && createdAppointment) {
      const staffName = createdAppointment.appointmentServices?.[0]?.staff?.name || 'Nhân viên'
      sendConfirmationEmail({
        appointmentId: createdAppointment.id,
        customerName,
        customerEmail,
        customerPhone: sanitizedPhone,
        appointmentDate: format(appointmentStart, 'yyyy-MM-dd'),
        appointmentTime: time,
        services: createdAppointment.appointmentServices.map(as => ({
          name: as.service.name,
          price: as.priceAtBooking.toString(),
        })),
        staffName,
        totalPrice: totalPrice,
        totalDuration: totalDuration,
        notes,
      }).catch(err => logError(err, { context: 'email_sending', appointmentId: createdAppointment.id }))
    }

    return ok({ data: createdAppointment, message: "Appointment created successfully" }, 201)
  } catch (error) {
    logError(error, { route: "/api/appointments", method: "POST", payload: "booking" })
    return fail("SERVER_ERROR", "Unable to create appointment", 500)
  }
}
