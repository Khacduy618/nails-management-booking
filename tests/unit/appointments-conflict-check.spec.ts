import { vi, describe, it, expect, beforeEach } from "vitest"
import { POST } from "@/app/api/appointments/route"
import { NextRequest } from "next/server"

// Mock rate limiter
const mockRateLimit = vi.fn()
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/rate-limit")>()
  return {
    ...original,
    rateLimit: (...args: any[]) => mockRateLimit(...args),
  }
})

// Mock email service
const mockSendConfirmationEmail = vi.fn()
vi.mock("@/lib/email-service", () => ({
  sendConfirmationEmail: (...args: any[]) => mockSendConfirmationEmail(...args),
}))

// Mock Drizzle queries
const mockFindManyServices = vi.fn()
const mockFindFirstStaff = vi.fn()
const mockFindManyStaffServices = vi.fn()
const mockFindFirstStaffSchedules = vi.fn()
const mockFindFirstCustomers = vi.fn()
const mockFindFirstAppointments = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockTransaction = vi.fn()

vi.mock("@/db", () => {
  return {
    db: {
      query: {
        services: {
          findMany: (...args: any[]) => mockFindManyServices(...args),
        },
        staff: {
          findFirst: (...args: any[]) => mockFindFirstStaff(...args),
        },
        staffServices: {
          findMany: (...args: any[]) => mockFindManyStaffServices(...args),
        },
        staffSchedules: {
          findFirst: (...args: any[]) => mockFindFirstStaffSchedules(...args),
        },
        customers: {
          findFirst: (...args: any[]) => mockFindFirstCustomers(...args),
        },
        appointments: {
          findFirst: (...args: any[]) => mockFindFirstAppointments(...args),
        },
      },
      select: (...args: any[]) => mockSelect(...args),
      insert: (...args: any[]) => mockInsert(...args),
      update: (...args: any[]) => mockUpdate(...args),
      transaction: (callback: any) => mockTransaction(callback),
    },
  }
})

/** Helper: create a POST request that passes CSRF checks */
function makePostRequest(payload: object) {
  return new NextRequest("http://localhost:3000/api/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Origin: "http://localhost:3000",
    },
  })
}

describe("POST /api/appointments - Server-side Conflict & Validation Checks", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockRateLimit.mockReturnValue({ allowed: true, remaining: 9, resetMs: 60000 })
    mockSendConfirmationEmail.mockResolvedValue(true)

    mockFindManyServices.mockReset()
    mockFindFirstStaff.mockReset()
    mockFindManyStaffServices.mockReset()
    mockFindFirstStaffSchedules.mockReset()
    mockFindFirstCustomers.mockReset()
    mockFindFirstAppointments.mockReset()
    mockSelect.mockReset()
    mockInsert.mockReset()
    mockUpdate.mockReset()
    mockTransaction.mockReset()

    // Default mock setup for successful run
    mockFindManyServices.mockResolvedValue([
      { id: 10, name: "Cắt Tóc", price: "150000", duration: 30 },
      { id: 11, name: "Gội Đầu", price: "50000", duration: 15 },
    ])

    mockFindFirstStaff.mockResolvedValue({
      id: 5,
      status: "active",
    })

    mockFindManyStaffServices.mockResolvedValue([
      { staffId: 5, serviceId: 10 },
      { staffId: 5, serviceId: 11 },
    ])

    mockFindFirstStaffSchedules.mockResolvedValue({
      staffId: 5,
      dayOfWeek: 1, // Thứ 2
      startTime: "09:00:00",
      endTime: "18:00:00",
    })

    // Mock select chain for conflict check: returns no conflicting records
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]), // no conflicts
    })

    // Mock db.transaction to run the database logic callback
    mockTransaction.mockImplementation(async (callback) => {
      // Mock transaction query runner
      const tx = {
        query: {
          customers: {
            findFirst: vi.fn().mockResolvedValue(null), // new customer
          },
          appointments: {
            findFirst: vi.fn().mockResolvedValue({
              id: 99,
              customerName: "Khách Test",
              customerPhone: "0901234567",
              customerEmail: "test@example.com",
              appointmentDate: "2026-06-01",
              appointmentTime: "10:00:00",
              priceAtBooking: "200000",
              durationAtBooking: 45,
              appointmentServices: [
                {
                  service: { name: "Cắt Tóc" },
                  priceAtBooking: "150000",
                  staff: { user: { name: "Nhân viên A" } },
                },
              ],
            }),
          },
        },
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 99 }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      }
      return await callback(tx)
    })
  })

  it("should successfully create appointment when all checks pass", async () => {
    const payload = {
      serviceIds: [10, 11],
      customerName: "Khách Test",
      customerPhone: "0901234567",
      customerEmail: "test@example.com",
      date: "2026-06-01", // Thứ Hai
      time: "10:00",
      staffId: 5,
    }

    const req = makePostRequest(payload)

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe(99)
  })

  it("should fail validation if staff member does not exist", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 10, name: "Cắt Tóc", price: "150000", duration: 30 },
    ])
    mockFindFirstStaff.mockResolvedValue(null) // Staff not found

    const payload = {
      serviceIds: [10],
      customerName: "Khách Test",
      customerPhone: "0901234567",
      date: "2026-06-01",
      time: "10:00",
      staffId: 5,
    }

    const req = makePostRequest(payload)

    const res = await POST(req)
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("INVALID_INPUT")
    expect(body.error.message).toContain("Nhân viên không tồn tại")
  })

  it("should fail validation if staff member is inactive", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 10, name: "Cắt Tóc", price: "150000", duration: 30 },
    ])
    mockFindFirstStaff.mockResolvedValue({
      id: 5,
      status: "inactive", // Staff is inactive
    })

    const payload = {
      serviceIds: [10],
      customerName: "Khách Test",
      customerPhone: "0901234567",
      date: "2026-06-01",
      time: "10:00",
      staffId: 5,
    }

    const req = makePostRequest(payload)

    const res = await POST(req)
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.message).toContain("Nhân viên hiện đang không hoạt động")
  })

  it("should fail validation if staff lacks skills for any service", async () => {
    // Staff has only skill for service 10, not 11
    mockFindManyStaffServices.mockResolvedValue([
      { staffId: 5, serviceId: 10 },
    ])

    const payload = {
      serviceIds: [10, 11],
      customerName: "Khách Test",
      customerPhone: "0901234567",
      date: "2026-06-01",
      time: "10:00",
      staffId: 5,
    }

    const req = makePostRequest(payload)

    const res = await POST(req)
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.message).toContain("Nhân viên không có đủ kỹ năng")
  })

  it("should fail validation if staff does not work on that day of week", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 10, name: "Cắt Tóc", price: "150000", duration: 30 },
    ])
    mockFindFirstStaffSchedules.mockResolvedValue(null) // Doesn't work on Monday

    const payload = {
      serviceIds: [10],
      customerName: "Khách Test",
      customerPhone: "0901234567",
      date: "2026-06-01",
      time: "10:00",
      staffId: 5,
    }

    const req = makePostRequest(payload)

    const res = await POST(req)
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("NO_AVAILABILITY")
    expect(body.error.message).toContain("Nhân viên không làm việc vào ngày này")
  })

  it("should fail validation if booking is outside working hours", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 10, name: "Cắt Tóc", price: "150000", duration: 30 },
    ])
    // Works 09:00 - 18:00
    mockFindFirstStaffSchedules.mockResolvedValue({
      staffId: 5,
      dayOfWeek: 1,
      startTime: "09:00:00",
      endTime: "18:00:00",
    })

    // Booking from 17:45 for 30 minutes duration ends at 18:15 (which is outside working hours)
    const payload = {
      serviceIds: [10], // 30 minutes duration
      customerName: "Khách Test",
      customerPhone: "0901234567",
      date: "2026-06-01",
      time: "17:45",
      staffId: 5,
    }

    const req = makePostRequest(payload)

    const res = await POST(req)
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.message).toContain("Thời gian hẹn ngoài ca làm việc")
  })

  it("should fail conflict check if staff is already booked in that window", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 10, name: "Cắt Tóc", price: "150000", duration: 30 },
    ])
    // Mock select chain to return conflicting appointment ID
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 101 }]), // returns conflict
    })

    const payload = {
      serviceIds: [10],
      customerName: "Khách Test",
      customerPhone: "0901234567",
      date: "2026-06-01",
      time: "10:00",
      staffId: 5,
    }

    const req = makePostRequest(payload)

    const res = await POST(req)
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("STAFF_CONFLICT")
  })
})
