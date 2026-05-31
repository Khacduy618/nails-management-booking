import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

// Khai báo mock cho db
const mockSelect = vi.fn()
const mockFrom = vi.fn()
const mockWhere = vi.fn()

vi.mock("@/db", () => {
  return {
    db: {
      select: (...args: any[]) => mockSelect(...args),
    },
  }
})

// Khai báo mock cho rate limiter
const mockRateLimit = vi.fn()
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/rate-limit")>()
  return {
    ...original,
    rateLimit: (...args: any[]) => mockRateLimit(...args),
  }
})

describe("Public Stats API Route (/api/stats/public)", () => {
  let GET: any

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
    
    // Xóa cache module của Vitest để reset các biến module-level (cachedStats, cacheExpiry)
    vi.resetModules()
    
    // Import động module chứa route GET
    const module = await import("@/app/api/stats/public/route")
    GET = module.GET

    mockRateLimit.mockReturnValue({ allowed: true, remaining: 59, resetMs: 60000 })

    // Reset chaining mocks
    mockSelect.mockReset()
    mockFrom.mockReset()
    mockWhere.mockReset()

    // Cài đặt mặc định cho query chaining
    mockSelect.mockImplementation(() => {
      return {
        from: mockFrom.mockImplementation(() => {
          const fromObj = {
            where: mockWhere.mockImplementation(() => {
              return Promise.resolve([{ count: 10 }]) // Trả về 10 dịch vụ
            }),
          }
          // Thêm method then để biến nó thành thenable (hỗ trợ await trực tiếp)
          Object.defineProperty(fromObj, "then", {
            value: (onfulfilled: any) => Promise.resolve([{ count: 20 }]).then(onfulfilled),
            configurable: true,
            writable: true,
          })
          return fromObj
        }),
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should return the correct stats format and correct counts", async () => {
    const request = new NextRequest("http://localhost:3000/api/stats/public")
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    
    const body = await response.json()
    expect(body).toEqual({
      success: true,
      data: {
        totalCustomers: 20,
        totalServices: 10,
      },
    })

    expect(mockSelect).toHaveBeenCalledTimes(2)
  })

  it("should cache the response for 5 minutes and not hit the database on subsequent calls", async () => {
    const request1 = new NextRequest("http://localhost:3000/api/stats/public")
    
    // Gọi lần 1 - Phải chạm DB vì cache trống
    const res1 = await GET(request1)
    expect(res1.status).toBe(200)
    expect(mockSelect).toHaveBeenCalledTimes(2)

    // Reset đếm số lần gọi của mock để theo dõi lần gọi 2
    mockSelect.mockClear()

    // Gọi lần 2 (ngay lập tức) - Phải lấy từ cache
    const res2 = await GET(request1)
    expect(res2.status).toBe(200)
    const body2 = await res2.json()
    expect(body2.data).toEqual({
      totalCustomers: 20,
      totalServices: 10,
    })
    expect(mockSelect).not.toHaveBeenCalled()

    // Tua thời gian trôi qua 6 phút (CACHE_TTL = 5 phút)
    vi.advanceTimersByTime(6 * 60 * 1000)

    // Gọi lần 3 (sau khi cache hết hạn) - Phải chạm DB lại
    const res3 = await GET(request1)
    expect(res3.status).toBe(200)
    expect(mockSelect).toHaveBeenCalledTimes(2)
  })

  it("should block requests when rate limit is exceeded", async () => {
    // Giả lập rate limit bị chặn
    mockRateLimit.mockReturnValue({ allowed: false, remaining: 0, resetMs: 30000 })

    const request = new NextRequest("http://localhost:3000/api/stats/public")
    const response = await GET(request)

    expect(response.status).toBe(429)
    
    const body = await response.json()
    expect(body).toEqual({
      success: false,
      error: "Too many requests",
    })

    // Đảm bảo không gọi DB vì đã bị chặn từ middleware rate limit
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it("should handle database queries errors gracefully", async () => {
    // Giả lập db.select quăng lỗi
    mockSelect.mockImplementationOnce(() => {
      throw new Error("Connection failed")
    })

    const request = new NextRequest("http://localhost:3000/api/stats/public")
    const response = await GET(request)

    expect(response.status).toBe(500)
    
    const body = await response.json()
    expect(body).toEqual({
      success: false,
      error: "Connection failed",
    })
  })
})
