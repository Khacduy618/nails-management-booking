import { withEncryption } from "@/lib/api-middleware";
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, appointmentServices, services, customers, staff, staffServices, staffSchedules } from "@/db/schema"
import { eq, and, sql, inArray, not, desc } from "drizzle-orm"
import { addMinutes, format } from "date-fns"
import { ok, fail } from "@/lib/api-response"
import { encrypt, decrypt, generateBlindIndex } from "@/lib/crypto"
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

async function _GET(request: NextRequest) {
  try {
    // Rate limiting for lookup
    const key = `apt-lookup:${getClientKey(request as unknown as Request)}`
    const rl = await rateLimit(key, LIMITS.lookupTight)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: { code: "FETCH_ERROR", message: "Too many requests" } }, { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any })
    }
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      logDebug('GET /api/appointments missing phone', { url: request.url })
      return fail("MISSING_PHONE", "Phone number is required", 400)
    }

    const decryptedPhone = decrypt(phone) || phone
    const cleanedPhone = sanitizePhone(decryptedPhone)
    logDebug('GET /api/appointments request', { phone: cleanedPhone })

    const phoneVariants = [cleanedPhone]
    if (cleanedPhone.startsWith('0')) {
        phoneVariants.push('+84' + cleanedPhone.slice(1))
    } else if (cleanedPhone.startsWith('+84')) {
        phoneVariants.push('0' + cleanedPhone.slice(3))
    } else if (cleanedPhone.startsWith('+')) {
        phoneVariants.push(cleanedPhone.slice(1))
    } else {
        phoneVariants.push('+' + cleanedPhone)
    }

    const hashedPhoneVariants = phoneVariants
      .map((p) => generateBlindIndex(p))
      .filter((p): p is string => p !== null)

    const userAppointments = await db.query.appointments.findMany({
      where: inArray(appointments.customerPhoneHash, hashedPhoneVariants),
      with: {
        review: true,
        appointmentServices: {
          with: {
            staff: {
              with: {
                user: {
                  columns: { name: true }
                }
              }
            }
          }
        }
      },
      columns: {
        id: true,
        appointmentDate: true,
        appointmentTime: true,
        status: true,
        durationAtBooking: true,
        reviewToken: true,
        customerPhone: true,
        notes: true,
      },
      orderBy: [desc(appointments.appointmentDate), desc(appointments.appointmentTime)],
    })

    logInfo(`GET /api/appointments: Found ${userAppointments.length} appointments for phone ${cleanedPhone}`, { phone: cleanedPhone, count: userAppointments.length })

    const formatted = userAppointments.map((apt: any) => {
      const staffMember = apt.appointmentServices?.[0]?.staff;
      const staffName = staffMember?.user?.name || "Nhân viên";
      const staffId = staffMember?.id || null;
      return {
        id: apt.id,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        status: apt.status,
        durationAtBooking: apt.durationAtBooking,
        reviewToken: apt.reviewToken,
        staffId,
        staffName,
        customerPhone: apt.customerPhone,
        notes: apt.notes,
        review: apt.review ? {
          rating: apt.review.rating,
          comment: apt.review.comment,
        } : null,
      }
    })

    return ok({ data: formatted, total: formatted.length })
  } catch (error) {
    logError(error, { route: "/api/appointments", method: "GET" })
    return fail("SERVER_ERROR", "Unable to fetch appointments", 500)
  }
}

async function _POST(request: NextRequest) {
  try {
    // Rate limiting for booking
    const key = `apt-book:${getClientKey(request as unknown as Request)}`
    const rl = await rateLimit(key, LIMITS.booking)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: { code: "CONFLICT", message: "Too many requests" } }, { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any })
    }

    // CSRF Protection
    const origin = request.headers.get("origin")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl && origin && origin !== appUrl) {
      logError(new Error("CSRF check failed: Origin mismatch"), { origin, appUrl })
      return NextResponse.json({ success: false, error: { code: "CSRF_ERROR", message: "Forbidden" } }, { status: 403 })
    }
    const xRequestedWith = request.headers.get("x-requested-with")
    if (!xRequestedWith || xRequestedWith !== "XMLHttpRequest") {
      logError(new Error("CSRF check failed: Missing or invalid X-Requested-With header"), { xRequestedWith })
      return NextResponse.json({ success: false, error: { code: "CSRF_ERROR", message: "Forbidden" } }, { status: 403 })
    }

    const body = (await request.json()) as Partial<CreateAppointmentPayload>
    const { serviceIds, customerName, customerPhone, customerEmail, date, time, staffId, notes } = body
    logDebug('POST /api/appointments received', { body })

    const plainName = customerName ? (decrypt(customerName) || customerName) : ""
    const plainPhone = decrypt(customerPhone) || customerPhone
    const plainEmail = customerEmail ? (decrypt(customerEmail) || customerEmail) : undefined
    const plainNotes = notes

    if (!serviceIds?.length || !plainName || !plainPhone || !date || !time || !staffId) {
      logDebug('POST /api/appointments invalid input', { serviceIds, plainName, plainPhone, date, time, staffId })
      logInfo('POST /api/appointments: VALIDATION FAILED - Missing required fields', { serviceIds, plainName, plainPhone, date, time, staffId })
      return fail("INVALID_INPUT", "Missing required fields", 400)
    }

    const sanitizedPhone = sanitizePhone(plainPhone)

    const servicesSelected = await db.query.services.findMany({ where: inArray(services.id, serviceIds) })
    logDebug('Fetched services for booking', { serviceIds, found: servicesSelected.map((s: any) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })) })
    if (servicesSelected.length !== serviceIds.length) {
      logDebug('POST /api/appointments service not found', { requested: serviceIds, foundIds: servicesSelected.map((s: any) => s.id) })
      logInfo('POST /api/appointments: SERVICE NOT FOUND', { requested: serviceIds, foundIds: servicesSelected.map((s: any) => s.id), missing: serviceIds.filter((id: number) => !servicesSelected.map((s: any) => s.id).includes(id)) })
      return fail("SERVICE_NOT_FOUND", "One or more services not found", 404)
    }

    const appointmentStart = new Date(`${date}T${time}`)
    if (Number.isNaN(appointmentStart.getTime())) {
      return fail("INVALID_INPUT", "Invalid date or time", 400)
    }

    const totalDuration = servicesSelected.reduce((sum: number, svc: any) => sum + svc.duration, 0)
    const totalPrice = servicesSelected.reduce((sum: number, svc: any) => sum + Number(svc.price), 0)
    const appointmentEnd = addMinutes(appointmentStart, totalDuration)

    const appointmentDateStr = format(appointmentStart, "yyyy-MM-dd")
    const appointmentStartTimeStr = format(appointmentStart, "HH:mm:ss")
    const appointmentEndTimeStr = format(appointmentEnd, "HH:mm:ss")

    logDebug('Computed appointment totals', { totalDuration, totalPrice, appointmentStart: appointmentStart.toISOString(), appointmentEnd: appointmentEnd.toISOString() })

    const commission = isBusinessHours(appointmentStart) ? 10 : 30

    // --- Bước 1: Xác thực Nhân viên (Staff Validation) ---
    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
    })
    if (!staffMember) {
      logInfo(`POST /api/appointments: STAFF NOT FOUND (ID: ${staffId})`, { staffId })
      return fail("INVALID_INPUT", "Nhân viên không tồn tại", 400)
    }
    if (staffMember.status !== "active") {
      logInfo(`POST /api/appointments: STAFF INACTIVE (ID: ${staffId})`, { staffId })
      return fail("INVALID_INPUT", "Nhân viên hiện đang không hoạt động", 400)
    }

    // --- Bước 2: Kiểm tra Kỹ năng của Nhân viên (Skills Validation) ---
    const skills = await db.query.staffServices.findMany({
      where: eq(staffServices.staffId, staffId),
    })
    const skilledServiceIds = new Set(skills.map((s: any) => s.serviceId))
    const lacksSkills = serviceIds.some((id: number) => !skilledServiceIds.has(id))
    if (lacksSkills) {
      logInfo(`POST /api/appointments: STAFF LACKS SKILLS (ID: ${staffId}, Services: ${serviceIds})`, { staffId, serviceIds })
      return fail("INVALID_INPUT", "Nhân viên không có đủ kỹ năng thực hiện các dịch vụ yêu cầu", 400)
    }

    // --- Bước 3: Kiểm tra Lịch làm việc (Schedule Validation) ---
    const dayOfWeek = appointmentStart.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    const schedule = await db.query.staffSchedules.findFirst({
      where: and(
        eq(staffSchedules.staffId, staffId),
        eq(staffSchedules.dayOfWeek, dayOfWeek)
      ),
    })
    if (!schedule) {
      logInfo(`POST /api/appointments: STAFF DOES NOT WORK ON THIS DAY (ID: ${staffId}, Day: ${dayOfWeek})`, { staffId, dayOfWeek })
      return fail("NO_AVAILABILITY", "Nhân viên không làm việc vào ngày này", 400)
    }

    const timeToMinutes = (timeStr: string): number => {
      const [h, m, s] = timeStr.split(":").map(Number)
      return h * 60 + (m || 0)
    }

    const appStartMin = timeToMinutes(appointmentStartTimeStr)
    const appEndMin = timeToMinutes(appointmentEndTimeStr)
    const schedStartMin = timeToMinutes(schedule.startTime)
    const schedEndMin = timeToMinutes(schedule.endTime)

    if (appEndMin < appStartMin || appStartMin < schedStartMin || appEndMin > schedEndMin) {
      logInfo(`POST /api/appointments: TIME OUTSIDE SCHEDULE (ID: ${staffId}, App: ${appointmentStartTimeStr}-${appointmentEndTimeStr}, Sched: ${schedule.startTime}-${schedule.endTime})`, { staffId, appStart: appointmentStartTimeStr, appEnd: appointmentEndTimeStr, schedStart: schedule.startTime, schedEnd: schedule.endTime })
      return fail("NO_AVAILABILITY", "Thời gian hẹn ngoài ca làm việc của nhân viên", 400)
    }

    // --- Bước 4: Kiểm tra Trùng lịch (Conflict Validation) ---
    const conflicting = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          sql`${staffId} IN (SELECT ${appointmentServices.staffId} FROM ${appointmentServices} WHERE ${appointmentServices.appointmentId} = ${appointments.id})`,
          eq(appointments.appointmentDate, appointmentDateStr),
          not(eq(appointments.status, "cancelled")),
          sql`${appointments.appointmentTime} < ${appointmentEndTimeStr}::time`,
          sql`${appointments.appointmentTime} + (${appointments.durationAtBooking} * interval '1 minute') > ${appointmentStartTimeStr}::time`,
        ),
      )

    if (conflicting.length > 0) {
      logDebug('POST /api/appointments conflict detected', { staffId, date: format(appointmentStart, "yyyy-MM-dd"), time, conflictingCount: conflicting.length })
      logInfo(`POST /api/appointments: CONFLICT DETECTED - Staff ${staffId} has ${conflicting.length} appointment(s) on ${format(appointmentStart, "yyyy-MM-dd")} at ${time}`, { staffId, date: format(appointmentStart, "yyyy-MM-dd"), time, conflictingCount: conflicting.length, conflictingIds: conflicting.map((c: any) => c.id) })
      return fail(
        "STAFF_CONFLICT",
        "Khung giờ này đã có lịch hẹn. Vui lòng chọn thời gian hoặc nhân viên khác.",
        409,
      )
    }

    const phoneHash = generateBlindIndex(sanitizedPhone)!

    // Prepare payloads for logging
    const appointmentInsertPayload = {
      customerName: encrypt(plainName)!,
      customerPhone: encrypt(sanitizedPhone)!,
      customerPhoneHash: phoneHash,
      notes: plainNotes,
      appointmentDate: appointmentDateStr,
      appointmentTime: time,
      status: 'pending' as const,
      priceAtBooking: totalPrice.toString(),
      durationAtBooking: totalDuration,
      isOvertime: !isBusinessHours(appointmentStart),
    }

    const appointmentServicePayloads = servicesSelected.map((svc: any) => ({
      serviceId: svc.id,
      staffId,
      priceAtBooking: svc.price,
      workShare: "100.00",
      commissionPercentage: commission.toString(),
    }))

    logDebug('About to run booking transaction', { appointmentInsertPayload, appointmentServicePayloads })

    const createdAppointment = await db.transaction(async (tx: any) => {
      // Find or create customer
      let customerId: number | null = null

      try {
        const existingCustomer = await tx.query.customers.findFirst({
          where: eq(customers.phoneHash, phoneHash),
        })

        if (existingCustomer) {
          // Update existing customer
          customerId = existingCustomer.id
          await tx
            .update(customers)
            .set({
              lastAppointmentDate: format(appointmentStart, 'yyyy-MM-dd'),
              name: encrypt(plainName)!,
              email: plainEmail ? encrypt(plainEmail) : existingCustomer.email,
              emailHash: plainEmail ? generateBlindIndex(plainEmail) : existingCustomer.emailHash,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, existingCustomer.id))
        } else {
          // Create new customer
          const insertResult = await tx
            .insert(customers)
            .values({
              phone: encrypt(sanitizedPhone)!,
              phoneHash: phoneHash,
              name: encrypt(plainName)!,
              email: plainEmail ? encrypt(plainEmail) : undefined,
              emailHash: plainEmail ? generateBlindIndex(plainEmail) : undefined,
              lastAppointmentDate: format(appointmentStart, 'yyyy-MM-dd'),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning()

          customerId = insertResult[0]?.id
        }
      } catch (customerError) {
        logError(customerError, { context: 'customer_upsert', phone: sanitizedPhone })
        // Continue even if customer creation fails, to not block appointment
      }

      const insertResult = await tx
        .insert(appointments)
        .values({
          ...appointmentInsertPayload,
          customerId: customerId || undefined,
        })
        .returning()

      const appointmentId = insertResult[0].id

      if (servicesSelected.length) {
        await tx.insert(appointmentServices).values(
          servicesSelected.map((svc: any) => ({
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
              staff: {
                with: {
                  user: {
                    columns: { name: true, email: true, phone: true }
                  }
                }
              },
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
    if (plainEmail && createdAppointment) {
      const rawStaffName = createdAppointment.appointmentServices?.[0]?.staff?.user?.name
        || createdAppointment.appointmentServices?.[0]?.staff?.user?.email
        || 'Nhân viên'
      const staffName = rawStaffName.startsWith("v1:") ? (decrypt(rawStaffName) || rawStaffName) : rawStaffName

      try {
        await sendConfirmationEmail({
          appointmentId: createdAppointment.id,
          customerName: plainName,
          customerEmail: plainEmail,
          customerPhone: sanitizedPhone,
          appointmentDate: format(appointmentStart, 'yyyy-MM-dd'),
          appointmentTime: time,
          services: createdAppointment.appointmentServices.map((as: any) => ({
            name: as.service.name,
            price: as.priceAtBooking.toString(),
          })),
          staffName,
          totalPrice: totalPrice,
          totalDuration: totalDuration,
          notes: plainNotes,
        })
      } catch (err) {
        logError(err, { context: 'email_sending', appointmentId: createdAppointment.id })
      }
    }

    return ok({ data: createdAppointment, message: "Appointment created successfully" }, 201)
  } catch (error) {
    logError(error, { route: "/api/appointments", method: "POST", payload: "booking" })
    return fail("SERVER_ERROR", "Unable to create appointment", 500)
  }
}


// Wrapped exports for encryption/decryption
export const GET = withEncryption(_GET);
export const POST = withEncryption(_POST);
