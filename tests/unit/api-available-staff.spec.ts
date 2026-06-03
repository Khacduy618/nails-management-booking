import { vi, describe, it, expect, beforeEach } from "vitest"
import { GET } from "@/app/api/staff/available/route"
import { NextRequest } from "next/server"

const mockFindManyServices = vi.fn()
const mockFindManyStaff = vi.fn()

let queryCount = 0

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
      // First await: capableStaffIdsResult
      result = [{ id: 1 }, { id: 2 }, { id: 3 }]
    } else if (queryCount === 2) {
      // Second await: busyStaffQuery
      result = []
    } else if (queryCount === 3) {
      // Third await: appointmentCountsResult
      result = [
        { staffId: 1, count: 2 },
        { staffId: 3, count: 1 },
      ]
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
      selectDistinct: () => mockQueryBuilder,
    },
  }
})

function makeGetRequest(query: string) {
  return new NextRequest(`http://localhost:3000/api/staff/available?${query}`, {
    method: "GET",
  })
}

describe("GET /api/staff/available - Smart Auto-assign & Available Staff Logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFindManyServices.mockReset()
    mockFindManyStaff.mockReset()
    queryCount = 0
  })

  it("should return staff sorted by rating DESC then appointmentCount ASC", async () => {
    // 1. Mock servicesInfo to return service duration
    mockFindManyServices.mockResolvedValue([
      { id: 1, name: "Gel Manicure", duration: 45 },
    ])

    // 2. Mock staffWithSchedules findMany query
    mockFindManyStaff.mockResolvedValue([
      {
        id: 1,
        rating: "4.50",
        user: { name: "Sarah Staff" },
        staffSchedules: [
          { startTime: "09:00:00", endTime: "18:00:00" },
        ],
      },
      {
        id: 2,
        rating: "4.80",
        user: { name: "John Staff" },
        staffSchedules: [
          { startTime: "09:00:00", endTime: "18:00:00" },
        ],
      },
      {
        id: 3,
        rating: "4.50",
        user: { name: "Emma Staff" },
        staffSchedules: [
          { startTime: "09:00:00", endTime: "18:00:00" },
        ],
      },
    ])

    const req = makeGetRequest("serviceIds=1&date=2026-06-02&time=10:00")
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)

    // Expected order:
    // 1. John Staff (rating 4.8, appointmentCount 0)
    // 2. Emma Staff (rating 4.5, appointmentCount 1)
    // 3. Sarah Staff (rating 4.5, appointmentCount 2)
    const staffList = body.staff
    expect(staffList).toHaveLength(3)

    expect(staffList[0].id).toBe(2)
    expect(staffList[0].name).toBe("John Staff")
    expect(staffList[0].rating).toBe(4.8)
    expect(staffList[0].appointmentCount).toBe(0)

    expect(staffList[1].id).toBe(3)
    expect(staffList[1].name).toBe("Emma Staff")
    expect(staffList[1].rating).toBe(4.5)
    expect(staffList[1].appointmentCount).toBe(1)

    expect(staffList[2].id).toBe(1)
    expect(staffList[2].name).toBe("Sarah Staff")
    expect(staffList[2].rating).toBe(4.5)
    expect(staffList[2].appointmentCount).toBe(2)
  })
})
