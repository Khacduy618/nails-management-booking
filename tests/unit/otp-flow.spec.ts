import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { POST as sendOTP } from "@/app/api/otp/send/route"
import { POST as verifyOTP } from "@/app/api/otp/verify/route"
import { NextRequest } from "next/server"

// Khai báo mock functions
const mockFindFirstAppointment = vi.fn()
const mockFindFirstOtpToken = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockUpdate = vi.fn()

vi.mock("@/db", () => {
  return {
    db: {
      query: {
        appointments: {
          findFirst: (...args: any[]) => mockFindFirstAppointment(...args),
        },
        otpTokens: {
          findFirst: (...args: any[]) => mockFindFirstOtpToken(...args),
        },
      },
      insert: (...args: any[]) => mockInsert(...args),
      delete: (...args: any[]) => mockDelete(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  }
})

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
vi.mock("@/lib/email-service", () => ({
  sendOTP: vi.fn().mockResolvedValue(true),
  sendCancellationEmail: vi.fn().mockResolvedValue(true),
  sendAdminCancellationNotification: vi.fn().mockResolvedValue(true),
}))

describe("OTP Secure Flow API Routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockRateLimit.mockReturnValue({ allowed: true, remaining: 9, resetMs: 60000 })

    // Reset all mock query functions
    mockFindFirstAppointment.mockReset()
    mockFindFirstOtpToken.mockReset()
    mockInsert.mockReset()
    mockDelete.mockReset()
    mockUpdate.mockReset()

    // Default setup for DB insert chain
    mockInsert.mockImplementation(() => ({
      values: () => ({
        onConflictDoUpdate: () => Promise.resolve([{ appointmentId: 1 }]),
      }),
    }))

    // Default setup for DB delete chain
    mockDelete.mockImplementation(() => ({
      where: () => Promise.resolve([{ appointmentId: 1 }]),
    }))

    // Default setup for DB update chain
    mockUpdate.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([{ id: 1, status: "cancelled" }]),
        }),
      }),
    }))
  })

  describe("POST /api/otp/send", () => {
    it("should generate and save secure OTP to DB when inputs are valid", async () => {
      // Giả lập lịch hẹn cách hiện tại 5 giờ (hợp lệ để hủy)
      const dateIn5Hours = new Date(Date.now() + 5 * 60 * 60 * 1000)
      const year = dateIn5Hours.getFullYear()
      const month = String(dateIn5Hours.getMonth() + 1).padStart(2, "0")
      const day = String(dateIn5Hours.getDate()).padStart(2, "0")
      const appointmentDateStr = `${year}-${month}-${day}`
      const hours = String(dateIn5Hours.getHours()).padStart(2, "0")
      const mins = String(dateIn5Hours.getMinutes()).padStart(2, "0")
      const appointmentTimeStr = `${hours}:${mins}`

      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        customerName: "Khách Test",
        customerPhone: "0901234567",
        appointmentDate: appointmentDateStr,
        appointmentTime: appointmentTimeStr,
        status: "confirmed",
      })

      const req = new NextRequest("http://localhost:3000/api/otp/send", {
        method: "POST",
        body: JSON.stringify({ appointmentId: 1, phone: "0901234567" }),
      })

      const res = await sendOTP(req)
      expect(res.status).toBe(200)
      
      const body = await res.json()
      expect(body).toEqual({
        success: true,
        message: "OTP sent successfully",
      })

      // Đảm bảo OTP đã được lưu vào database
      expect(mockInsert).toHaveBeenCalled()
    })

    it("should return 403 when phone number does not match appointment record", async () => {
      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        customerName: "Khách Test",
        customerPhone: "0901234567", // số điện thoại trong DB
        appointmentDate: "2030-01-01",
        appointmentTime: "12:00",
        status: "confirmed",
      })

      const req = new NextRequest("http://localhost:3000/api/otp/send", {
        method: "POST",
        body: JSON.stringify({ appointmentId: 1, phone: "0988888888" }), // số điện thoại gửi lên lệch
      })

      const res = await sendOTP(req)
      expect(res.status).toBe(403)

      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("UNAUTHORIZED")
    })

    it("should return 400 when cancellation request is within 2 hours of schedule", async () => {
      // Giả lập lịch hẹn chỉ cách hiện tại 1 giờ (không thể hủy)
      const dateIn1Hour = new Date(Date.now() + 1 * 60 * 60 * 1000)
      const year = dateIn1Hour.getFullYear()
      const month = String(dateIn1Hour.getMonth() + 1).padStart(2, "0")
      const day = String(dateIn1Hour.getDate()).padStart(2, "0")
      const appointmentDateStr = `${year}-${month}-${day}`
      const hours = String(dateIn1Hour.getHours()).padStart(2, "0")
      const mins = String(dateIn1Hour.getMinutes()).padStart(2, "0")
      const appointmentTimeStr = `${hours}:${mins}`

      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        customerName: "Khách Test",
        customerPhone: "0901234567",
        appointmentDate: appointmentDateStr,
        appointmentTime: appointmentTimeStr,
        status: "confirmed",
      })

      const req = new NextRequest("http://localhost:3000/api/otp/send", {
        method: "POST",
        body: JSON.stringify({ appointmentId: 1, phone: "0901234567" }),
      })

      const res = await sendOTP(req)
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("TOO_LATE")
    })
  })

  describe("POST /api/otp/verify", () => {
    it("should successfully cancel appointment and delete token when code matches and is not expired", async () => {
      // Mock OTP token từ DB còn hạn (expiresAt trong tương lai)
      mockFindFirstOtpToken.mockResolvedValue({
        appointmentId: 1,
        code: "123456",
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // còn hạn 2 phút
      })

      // Mock thông tin lịch hẹn đầy đủ relations
      mockFindFirstAppointment.mockResolvedValue({
        id: 1,
        customerName: "Khách Test",
        customerPhone: "0901234567",
        appointmentDate: "2030-01-01",
        appointmentTime: "10:00:00",
        priceAtBooking: "250000",
        durationAtBooking: 45,
        notes: "Ghi chú test",
        status: "confirmed",
        customer: {
          email: "khachtest@gmail.com",
        },
        appointmentServices: [
          {
            service: { name: "Nối Mi" },
            priceAtBooking: "250000",
            staff: {
              user: { name: "Nhân viên A" },
            },
          },
        ],
      })

      const req = new NextRequest("http://localhost:3000/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({ appointmentId: 1, code: "123456", phone: "0901234567" }),
      })

      const res = await verifyOTP(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toEqual({
        success: true,
        message: "Appointment cancelled successfully",
      })

      // Đảm bảo lịch hẹn được cập nhật và OTP Token được xóa sạch khỏi DB
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
    })

    it("should return 400 and delete token when OTP token is expired", async () => {
      // Mock OTP token từ DB đã hết hạn (expiresAt trong quá khứ)
      mockFindFirstOtpToken.mockResolvedValue({
        appointmentId: 1,
        code: "123456",
        expiresAt: new Date(Date.now() - 1000), // đã hết hạn 1 giây
      })

      const req = new NextRequest("http://localhost:3000/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({ appointmentId: 1, code: "123456", phone: "0901234567" }),
      })

      const res = await verifyOTP(req)
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("OTP_EXPIRED")

      // Đảm bảo token hết hạn đã bị dọn dẹp khỏi DB
      expect(mockDelete).toHaveBeenCalled()
      // Đảm bảo không gọi update trạng thái lịch hẹn
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it("should return 400 when OTP code is incorrect", async () => {
      // Mock OTP token đúng từ DB
      mockFindFirstOtpToken.mockResolvedValue({
        appointmentId: 1,
        code: "123456",
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      })

      const req = new NextRequest("http://localhost:3000/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({ appointmentId: 1, code: "999999", phone: "0901234567" }), // code gửi lên sai
      })

      const res = await verifyOTP(req)
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("INVALID_OTP")

      // Đảm bảo không xóa token và không cập nhật lịch hẹn
      expect(mockDelete).not.toHaveBeenCalled()
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })
})
