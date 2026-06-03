import { vi, describe, it, expect, beforeEach } from "vitest"
import { PUT as updateAppointment } from "@/app/api/admin/appointments/[id]/route"
import { NextRequest } from "next/server"
import { appointments } from "@/db/schema"
import * as emailService from "@/lib/email-service"

// Mock functions
const mockFindFirst = vi.fn()
const mockUpdate = vi.fn()

vi.mock("@/db", () => {
  return {
    db: {
      query: {
        appointments: {
          findFirst: (...args: any[]) => mockFindFirst(...args),
        },
      },
      update: (...args: any[]) => mockUpdate(...args),
    },
  }
})

vi.mock("@/lib/email-service", () => ({
  sendReviewRequestEmail: vi.fn().mockResolvedValue(true),
  sendConfirmationEmail: vi.fn().mockResolvedValue(true),
  sendCancellationEmail: vi.fn().mockResolvedValue(true),
}))

describe("Admin PUT Appointment Route", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFindFirst.mockReset()
    mockUpdate.mockReset()

    // Default setup for update query builder mock
    mockUpdate.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: vi.fn().mockResolvedValue([{ id: 1, status: "completed" }]),
        }),
      }),
    }))
  })

  it("should generate token and send review request email when transitioning to completed", async () => {
    // 1. First findFirst is for checking the existing status
    mockFindFirst.mockResolvedValueOnce({
      id: 1,
      status: "confirmed",
      reviewToken: null,
    })

    // 2. Second findFirst is for gathering the email details (fullApt)
    mockFindFirst.mockResolvedValueOnce({
      id: 1,
      customerName: "Khách Hàng A",
      customerPhone: "0901234567",
      appointmentDate: "2026-06-02",
      appointmentTime: "10:00:00",
      priceAtBooking: "250000",
      durationAtBooking: 60,
      notes: "Test notes",
      reviewToken: "generated-uuid-token",
      customer: { email: "customer@example.com" },
      appointmentServices: [
        {
          priceAtBooking: "250000",
          service: { name: "Nails Basic" },
          staff: {
            user: { name: "Staff X" }
          }
        }
      ]
    })

    const req = new NextRequest("http://localhost:3000/api/admin/appointments/1", {
      method: "PUT",
      body: JSON.stringify({ status: "completed" }),
    })

    const res = await updateAppointment(req, { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)

    // Wait a brief tick for async catch-block to process
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(emailService.sendReviewRequestEmail).toHaveBeenCalled()
    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled()
    expect(emailService.sendCancellationEmail).not.toHaveBeenCalled()
  })

  it("should send confirmation email when transitioning to confirmed", async () => {
    // 1. Existing status
    mockFindFirst.mockResolvedValueOnce({
      id: 1,
      status: "pending",
      reviewToken: null,
    })

    // 2. Full details
    mockFindFirst.mockResolvedValueOnce({
      id: 1,
      customerName: "Khách Hàng A",
      customerPhone: "0901234567",
      appointmentDate: "2026-06-02",
      appointmentTime: "10:00:00",
      priceAtBooking: "250000",
      durationAtBooking: 60,
      notes: "Test notes",
      customer: { email: "customer@example.com" },
      appointmentServices: [
        {
          priceAtBooking: "250000",
          service: { name: "Nails Basic" },
          staff: {
            user: { name: "Staff X" }
          }
        }
      ]
    })

    const req = new NextRequest("http://localhost:3000/api/admin/appointments/1", {
      method: "PUT",
      body: JSON.stringify({ status: "confirmed" }),
    })

    const res = await updateAppointment(req, { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(200)

    await new Promise(resolve => setTimeout(resolve, 10))

    expect(emailService.sendConfirmationEmail).toHaveBeenCalled()
    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled()
    expect(emailService.sendCancellationEmail).not.toHaveBeenCalled()
  })

  it("should send cancellation email when transitioning to cancelled", async () => {
    // 1. Existing status
    mockFindFirst.mockResolvedValueOnce({
      id: 1,
      status: "confirmed",
      reviewToken: null,
    })

    // 2. Full details
    mockFindFirst.mockResolvedValueOnce({
      id: 1,
      customerName: "Khách Hàng A",
      customerPhone: "0901234567",
      appointmentDate: "2026-06-02",
      appointmentTime: "10:00:00",
      priceAtBooking: "250000",
      durationAtBooking: 60,
      notes: "Test notes",
      customer: { email: "customer@example.com" },
      appointmentServices: [
        {
          priceAtBooking: "250000",
          service: { name: "Nails Basic" },
          staff: {
            user: { name: "Staff X" }
          }
        }
      ]
    })

    const req = new NextRequest("http://localhost:3000/api/admin/appointments/1", {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    })

    const res = await updateAppointment(req, { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(200)

    await new Promise(resolve => setTimeout(resolve, 10))

    expect(emailService.sendCancellationEmail).toHaveBeenCalled()
    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled()
    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled()
  })

  it("should not send any email if status is unchanged", async () => {
    // 1. Existing status is already completed
    mockFindFirst.mockResolvedValueOnce({
      id: 1,
      status: "completed",
      reviewToken: "existing-token",
    })

    const req = new NextRequest("http://localhost:3000/api/admin/appointments/1", {
      method: "PUT",
      body: JSON.stringify({ status: "completed", notes: "Updated notes" }),
    })

    const res = await updateAppointment(req, { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(200)

    await new Promise(resolve => setTimeout(resolve, 10))

    expect(emailService.sendReviewRequestEmail).not.toHaveBeenCalled()
    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled()
    expect(emailService.sendCancellationEmail).not.toHaveBeenCalled()
  })
})
