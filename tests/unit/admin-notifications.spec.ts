import { vi, describe, it, expect, beforeEach } from "vitest"
import { GET, PUT } from "@/app/api/admin/notifications/route"
import { NextRequest } from "next/server"

// Mock next-auth's getServerSession
const mockGetServerSession = vi.fn()
vi.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}))

// Mock Drizzle query and fluent API chains
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()

vi.mock("@/db", () => {
  return {
    db: {
      select: (...args: any[]) => mockSelect(...args),
      update: (...args: any[]) => mockUpdate(...args),
      insert: (...args: any[]) => mockInsert(...args),
    },
  }
})

describe("Admin Notifications API Routes (/api/admin/notifications)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockGetServerSession.mockReset()
    mockSelect.mockReset()
    mockUpdate.mockReset()
    mockInsert.mockReset()
  })

  describe("GET /api/admin/notifications", () => {
    it("should return 401 when user is not logged in", async () => {
      mockGetServerSession.mockResolvedValue(null)
      const req = new NextRequest("http://localhost:3000/api/admin/notifications")
      const res = await GET(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("UNAUTHORIZED")
    })

    it("should return 401 when logged in user is a customer (not admin/staff)", async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: "customer" } })
      const req = new NextRequest("http://localhost:3000/api/admin/notifications")
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it("should return 200 and unread notifications for admin", async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: "admin" } })
      
      const mockNotifications = [
        { id: 1, title: "Khách hủy lịch", message: "Khách hủy #1", isRead: false, createdAt: new Date() },
        { id: 2, title: "Khách hủy lịch", message: "Khách hủy #2", isRead: false, createdAt: new Date() },
      ]

      const mockLimit = vi.fn().mockResolvedValue(mockNotifications)
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      mockSelect.mockReturnValue({ from: mockFrom })

      const req = new NextRequest("http://localhost:3000/api/admin/notifications")
      const res = await GET(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(2)
      expect(body.data[0].id).toBe(1)
    })
  })

  describe("PUT /api/admin/notifications", () => {
    it("should return 401 when unauthorized", async () => {
      mockGetServerSession.mockResolvedValue(null)
      const req = new NextRequest("http://localhost:3000/api/admin/notifications", {
        method: "PUT",
        body: JSON.stringify({ id: 1 }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(401)
    })

    it("should return 400 when missing fields", async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: "admin" } })
      const req = new NextRequest("http://localhost:3000/api/admin/notifications", {
        method: "PUT",
        body: JSON.stringify({}),
      })
      const res = await PUT(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error.code).toBe("MISSING_FIELDS")
    })

    it("should mark all notifications as read when all=true is passed", async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: "admin" } })

      // Mock update chain for update(...).set(...).where(...)
      const mockWhereResult = Promise.resolve([])
      const mockWhereUpdate = vi.fn().mockReturnValue(mockWhereResult)
      const mockSetUpdate = vi.fn().mockReturnValue({ where: mockWhereUpdate })
      mockUpdate.mockReturnValue({ set: mockSetUpdate })

      const req = new NextRequest("http://localhost:3000/api/admin/notifications", {
        method: "PUT",
        body: JSON.stringify({ all: true }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.message).toBe("All notifications marked as read")
      expect(mockUpdate).toHaveBeenCalled()
    })

    it("should mark specific notification as read when ID is passed", async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: "admin" } })

      // Mock update chain for update(...).set(...).where(...).returning()
      const mockReturnedData = [{ id: 123, isRead: true }]
      const mockUpdateWhereResult = Promise.resolve(mockReturnedData) as any
      mockUpdateWhereResult.returning = vi.fn().mockResolvedValue(mockReturnedData)

      const mockWhereUpdate = vi.fn().mockReturnValue(mockUpdateWhereResult)
      const mockSetUpdate = vi.fn().mockReturnValue({ where: mockWhereUpdate })
      mockUpdate.mockReturnValue({ set: mockSetUpdate })

      const req = new NextRequest("http://localhost:3000/api/admin/notifications", {
        method: "PUT",
        body: JSON.stringify({ id: 123 }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(123)
    })

    it("should return 404 if notification to update is not found", async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: "admin" } })

      // Mock returning empty list
      const mockUpdateWhereResult = Promise.resolve([]) as any
      mockUpdateWhereResult.returning = vi.fn().mockResolvedValue([])

      const mockWhereUpdate = vi.fn().mockReturnValue(mockUpdateWhereResult)
      const mockSetUpdate = vi.fn().mockReturnValue({ where: mockWhereUpdate })
      mockUpdate.mockReturnValue({ set: mockSetUpdate })

      const req = new NextRequest("http://localhost:3000/api/admin/notifications", {
        method: "PUT",
        body: JSON.stringify({ id: 999 }),
      })
      const res = await PUT(req)
      expect(res.status).toBe(404)
    })
  })
})
