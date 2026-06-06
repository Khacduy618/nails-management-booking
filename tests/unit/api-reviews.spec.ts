import { vi, describe, it, expect, beforeEach } from "vitest"
import { GET as getReview, POST as postReview } from "@/app/api/reviews/route"
import { NextRequest } from "next/server"
import { appointments, reviews, staff } from "@/db/schema"

// Mocks
const mockFindFirstAppointment = vi.fn()
const mockFindManyReviews = vi.fn()
const mockSelect = vi.fn()
const mockTransaction = vi.fn()

vi.mock("@/db", () => {
  return {
    db: {
      query: {
        appointments: {
          findFirst: (...args: any[]) => mockFindFirstAppointment(...args),
        },
        reviews: {
          findMany: (...args: any[]) => mockFindManyReviews(...args),
        },
      },
      select: (...args: any[]) => mockSelect(...args),
      transaction: (cb: any) => mockTransaction(cb),
    },
  }
})

vi.mock("@/lib/email-service", () => ({
  sendReviewRequestEmail: vi.fn().mockResolvedValue(true),
}))

describe("Reviews API Routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFindFirstAppointment.mockReset()
    mockFindManyReviews.mockReset()
    mockSelect.mockReset()
    mockTransaction.mockReset()
  })

  describe("GET /api/reviews", () => {
    it("should return public reviews if token is missing", async () => {
      mockFindManyReviews.mockResolvedValue([
        {
          id: 1,
          comment: "Dịch vụ rất tốt",
          rating: 5,
          createdAt: new Date().toISOString(),
          appointment: {
            customerName: "Khách Test",
            appointmentDate: "2026-06-01",
            appointmentServices: [
              {
                service: { name: "Cắt Tóc" }
              }
            ]
          },
          staff: {
            user: { name: "Staff Test" }
          }
        }
      ])

      const req = new NextRequest("http://localhost:3000/api/reviews", {
        method: "GET",
      })

      const res = await getReview(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data[0].content).toBe("Dịch vụ rất tốt")
    })

    it("should return 404 if appointment is not found", async () => {
      mockFindFirstAppointment.mockResolvedValue(null)
      const req = new NextRequest("http://localhost:3000/api/reviews?token=invalid-token", {
        method: "GET",
      })

      const res = await getReview(req)
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("APPOINTMENT_NOT_FOUND")
    })

    it("should return 400 if appointment status is not completed", async () => {
      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        status: "confirmed",
        appointmentDate: "2026-06-02",
        appointmentTime: "10:00:00",
        durationAtBooking: 60,
      })

      const req = new NextRequest("http://localhost:3000/api/reviews?token=valid-token", {
        method: "GET",
      })

      const res = await getReview(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("INVALID_STATUS")
    })

    it("should return isAllowed=false if not yet 1 hour after service end", async () => {
      // Set appointment time to now, so service end + 1 hour is in the future
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      const hour = String(now.getHours()).padStart(2, "0")
      const minute = String(now.getMinutes()).padStart(2, "0")
      const second = String(now.getSeconds()).padStart(2, "0")

      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        status: "completed",
        appointmentDate: `${year}-${month}-${day}`,
        appointmentTime: `${hour}:${minute}:${second}`,
        durationAtBooking: 60,
        appointmentServices: [
          {
            service: { name: "Nails Basic" },
            staff: { id: 2, user: { name: "Staff Test" } },
          },
        ],
      })

      const req = new NextRequest("http://localhost:3000/api/reviews?token=valid-token", {
        method: "GET",
      })

      const res = await getReview(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.isAllowed).toBe(false)
    })

    it("should return isAllowed=true if more than 1 hour after service end", async () => {
      // Set appointment time to 3 hours ago
      const past = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const year = past.getFullYear()
      const month = String(past.getMonth() + 1).padStart(2, "0")
      const day = String(past.getDate()).padStart(2, "0")
      const hour = String(past.getHours()).padStart(2, "0")
      const minute = String(past.getMinutes()).padStart(2, "0")
      const second = String(past.getSeconds()).padStart(2, "0")

      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        status: "completed",
        appointmentDate: `${year}-${month}-${day}`,
        appointmentTime: `${hour}:${minute}:${second}`,
        durationAtBooking: 60,
        appointmentServices: [
          {
            service: { name: "Nails Basic" },
            staff: { id: 2, user: { name: "Staff Test" } },
          },
        ],
      })

      const req = new NextRequest("http://localhost:3000/api/reviews?token=valid-token", {
        method: "GET",
      })

      const res = await getReview(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.isAllowed).toBe(true)
      expect(data.alreadyReviewed).toBe(false)
    })
  })

  describe("POST /api/reviews", () => {
    it("should reject invalid inputs", async () => {
      const req = new NextRequest("http://localhost:3000/api/reviews", {
        method: "POST",
        body: JSON.stringify({ token: "", rating: 6 }),
      })

      const res = await postReview(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("INVALID_INPUT")
    })

    it("should prevent submission if not yet 1 hour after service end", async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      const hour = String(now.getHours()).padStart(2, "0")
      const minute = String(now.getMinutes()).padStart(2, "0")
      const second = String(now.getSeconds()).padStart(2, "0")

      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        status: "completed",
        appointmentDate: `${year}-${month}-${day}`,
        appointmentTime: `${hour}:${minute}:${second}`,
        durationAtBooking: 60,
        appointmentServices: [{ staffId: 2 }],
      })

      const req = new NextRequest("http://localhost:3000/api/reviews", {
        method: "POST",
        body: JSON.stringify({ token: "valid-token", rating: 5, comment: "Tuyệt vời" }),
      })

      const res = await postReview(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe("TIME_RESTRICTION")
    })

    it("should allow review submission if valid, saving to DB and updating staff", async () => {
      const past = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const year = past.getFullYear()
      const month = String(past.getMonth() + 1).padStart(2, "0")
      const day = String(past.getDate()).padStart(2, "0")
      const hour = String(past.getHours()).padStart(2, "0")
      const minute = String(past.getMinutes()).padStart(2, "0")
      const second = String(past.getSeconds()).padStart(2, "0")

      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        status: "completed",
        appointmentDate: `${year}-${month}-${day}`,
        appointmentTime: `${hour}:${minute}:${second}`,
        durationAtBooking: 60,
        appointmentServices: [{ staffId: 2 }],
      })

      // Transaction implementation
      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([{ id: 10 }]),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ avgRating: "4.50" }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 2 }]),
          }),
        }),
      }

      mockTransaction.mockImplementation(async (cb) => {
        return cb(mockTx)
      })

      const req = new NextRequest("http://localhost:3000/api/reviews", {
        method: "POST",
        body: JSON.stringify({ token: "valid-token", rating: 5, comment: "Tuyệt vời" }),
      })

      const res = await postReview(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(mockTx.insert).toHaveBeenCalled()
      expect(mockTx.update).toHaveBeenCalled()
    })
  })
})
