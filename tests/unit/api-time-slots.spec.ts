import { vi, describe, it, expect, beforeEach } from "vitest"
import { GET } from "@/app/api/time-slots/route"
import { NextRequest } from "next/server"

const mockFindManyServices = vi.fn()
const mockFindManyStaff = vi.fn()

let queryCount = 0
let mockCapableStaffResult: any = []
let mockDayAppointmentsResult: any = []

const mockQueryBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  having: vi.fn().mockReturnThis(),
  as: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  then: vi.fn().mockImplementation(function (onFulfilled) {
    queryCount++
    let result: any = []
    if (queryCount === 1) {
      result = mockCapableStaffResult
    } else if (queryCount === 2) {
      result = mockDayAppointmentsResult
    }
    return Promise.resolve(onFulfilled ? onFulfilled(result) : result)
  }),
}

vi.mock("@/db", () => {
  return {
    db: {
      query: {
        services: {
          findMany: (...args: any[]) => mockFindManyServices(...args),
        },
        staff: {
          findMany: (...args: any[]) => mockFindManyStaff(...args),
        },
      },
      select: () => mockQueryBuilder,
    },
  }
})

function makeGetRequest(query: string) {
  return new NextRequest(`http://localhost:3000/api/time-slots?${query}`, {
    method: "GET",
  })
}

describe("GET /api/time-slots", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFindManyServices.mockReset()
    mockFindManyStaff.mockReset()
    queryCount = 0
    mockCapableStaffResult = []
    mockDayAppointmentsResult = []
  })

  it("should fail with 400 if date or serviceIds are missing", async () => {
    const req1 = makeGetRequest("date=2026-06-02")
    const res1 = await GET(req1)
    expect(res1.status).toBe(400)
    const body1 = await res1.json()
    expect(body1.success).toBe(false)

    const req2 = makeGetRequest("serviceIds=1")
    const res2 = await GET(req2)
    expect(res2.status).toBe(400)
  })

  it("should fail with 400 if serviceIds format is invalid", async () => {
    const req = makeGetRequest("date=2026-06-02&serviceIds=abc")
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it("should fail with 404 if some services are not found", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 1, duration: 30 },
    ])
    const req = makeGetRequest("date=2026-06-02&serviceIds=1,2")
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it("should return empty slots if no staff are capable", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 1, duration: 30 },
    ])
    mockCapableStaffResult = []

    const req = makeGetRequest("date=2026-06-02&serviceIds=1")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.slots).toEqual([])
  })

  it("should return correct available slots when staff has schedule and no busy intervals", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 1, duration: 30 },
    ])
    mockCapableStaffResult = [{ id: 101 }]
    mockFindManyStaff.mockResolvedValue([
      {
        id: 101,
        status: "active",
        staffSchedules: [
          { startTime: "09:00:00", endTime: "12:00:00" }, // Works 9 AM - 12 PM
        ],
      },
    ])
    mockDayAppointmentsResult = [] // No appointments

    const req = makeGetRequest("date=2026-06-02&serviceIds=1") // 2026-06-02 is a Tuesday (dayOfWeek = 2)
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    // 09:00 (ends 09:30) - ok
    // 09:30 (ends 10:00) - ok
    // 10:00 (ends 10:50) ...
    // Working hours: 09:00 to 12:00. Last slot can start at 11:30 (ends 12:00).
    expect(body.slots).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ])
  })

  it("should filter out slots overlapping with busy intervals of the staff", async () => {
    mockFindManyServices.mockResolvedValue([
      { id: 1, duration: 30 },
    ])
    mockCapableStaffResult = [{ id: 101 }]
    mockFindManyStaff.mockResolvedValue([
      {
        id: 101,
        status: "active",
        staffSchedules: [
          { startTime: "09:00:00", endTime: "12:00:00" },
        ],
      },
    ])
    // Appointment at 10:00 for 30 minutes (ends at 10:30)
    mockDayAppointmentsResult = [
      {
        id: 10,
        appointmentTime: "10:00:00",
        durationAtBooking: 30,
        staffId: 101,
      },
    ]

    const req = makeGetRequest("date=2026-06-02&serviceIds=1")
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    // 10:00 starts at 600, ends at 630. Busy interval is 10:00 (600) to 10:30 (630).
    // An overlap occurs if A_start < B_end && B_start < A_end.
    // 09:30 slot starts at 570, ends at 600. No overlap with 600-630 (570 < 630 && 600 < 600 - wait, 600 is not < 600, so false).
    // 10:00 slot starts at 600, ends at 630. Overlaps (600 < 630 && 600 < 630). Filtered out.
    // 10:30 slot starts at 630, ends at 660. No overlap (630 < 630 is false).
    expect(body.slots).toEqual([
      "09:00",
      "09:30",
      "10:30",
      "11:00",
      "11:30",
    ])
  })

  it("should require slots to fit completely within staff schedules", async () => {
    // Service duration is 90 minutes (1.5 hours)
    mockFindManyServices.mockResolvedValue([
      { id: 1, duration: 90 },
    ])
    mockCapableStaffResult = [{ id: 101 }]
    mockFindManyStaff.mockResolvedValue([
      {
        id: 101,
        status: "active",
        staffSchedules: [
          { startTime: "09:00:00", endTime: "11:00:00" }, // Works only 2 hours
        ],
      },
    ])
    mockDayAppointmentsResult = []

    const req = makeGetRequest("date=2026-06-02&serviceIds=1")
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    // Slot 09:00 starts 09:00, ends 10:30 (within schedule 9-11). OK.
    // Slot 09:30 starts 09:30, ends 11:00 (within schedule 9-11). OK.
    // Slot 10:00 starts 10:00, ends 11:30 (exceeds 11:00 limit). Filtered out.
    expect(body.slots).toEqual([
      "09:00",
      "09:30",
    ])
  })
})
