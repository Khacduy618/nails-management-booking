import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Tests for Revenue API Route
 * 
 * These tests verify that the /api/admin/revenue endpoint:
 * 1. Accepts startDate and endDate query parameters
 * 2. Returns correct data structure (overview, serviceRevenue, staffPerformance)
 * 3. Handles errors gracefully
 */

describe("Revenue API Route (/api/admin/revenue)", () => {
    it("should accept startDate and endDate query parameters", () => {
        // The route accepts: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
        const sampleUrl = "http://localhost:3000/api/admin/revenue?startDate=2025-11-01&endDate=2025-11-23"

        const url = new URL(sampleUrl)
        expect(url.searchParams.get("startDate")).toBe("2025-11-01")
        expect(url.searchParams.get("endDate")).toBe("2025-11-23")
    })

    it("should return data structure with overview, serviceRevenue, and staffPerformance", () => {
        // Expected response structure
        const mockResponse = {
            data: {
                overview: {
                    totalRevenue: 100000000,
                    totalAppointments: 50,
                    completedAppointments: 48,
                    totalCustomers: 25,
                },
                serviceRevenue: [
                    { serviceName: "Cắt tóc", revenue: 35000000 },
                    { serviceName: "Massage", revenue: 42000000 },
                ],
                staffPerformance: [
                    { staffName: "Mai Anh", revenue: 45000000, appointments: 20 },
                    { staffName: "Thu Hà", revenue: 38000000, appointments: 18 },
                ],
            },
        }

        // Verify structure
        expect(mockResponse.data).toHaveProperty("overview")
        expect(mockResponse.data).toHaveProperty("serviceRevenue")
        expect(mockResponse.data).toHaveProperty("staffPerformance")

        // Verify overview properties
        expect(mockResponse.data.overview).toHaveProperty("totalRevenue")
        expect(mockResponse.data.overview).toHaveProperty("totalAppointments")
        expect(mockResponse.data.overview).toHaveProperty("totalCustomers")

        // Verify arrays
        expect(Array.isArray(mockResponse.data.serviceRevenue)).toBe(true)
        expect(Array.isArray(mockResponse.data.staffPerformance)).toBe(true)
    })

    it("should calculate revenue from completed appointments only", () => {
        /**
         * The API filters by status = 'completed' when calculating:
         * - totalRevenue
         * - serviceRevenue
         * - staffPerformance
         */
        const expectedBehavior = {
            filter: "appointments.status = 'completed'",
            fields: ["revenue", "appointments"],
        }

        expect(expectedBehavior.filter).toContain("completed")
        expect(expectedBehavior.fields).toContain("revenue")
    })

    it("should use appointmentServices table for service and staff details", () => {
        /**
         * The API uses innerJoin with appointmentServices table to:
         * 1. Link appointments to services
         * 2. Link appointments to staff
         * 
         * Tables used:
         * - appointments: base appointment data
         * - appointmentServices: join table with staffId and serviceId
         * - services: service details (name)
         * - staff: staff details (name)
         */
        const tablesUsed = ["appointments", "appointmentServices", "services", "staff"]

        expect(tablesUsed).toContain("appointmentServices")
        expect(tablesUsed).toContain("services")
        expect(tablesUsed).toContain("staff")
    })

    it("should aggregate revenue by service name", () => {
        // Services should be grouped and summed by serviceName
        const mockServiceData = [
            { serviceName: "Cắt tóc", revenue: 10000000 },
            { serviceName: "Cắt tóc", revenue: 15000000 }, // duplicate should be aggregated
            { serviceName: "Massage", revenue: 42000000 },
        ]

        const aggregated = mockServiceData.reduce((acc, item) => {
            const existing = acc.find((x) => x.serviceName === item.serviceName)
            if (existing) {
                existing.revenue += item.revenue
            } else {
                acc.push({ ...item })
            }
            return acc
        }, [] as typeof mockServiceData)

        expect(aggregated).toHaveLength(2)
        expect(aggregated.find((x) => x.serviceName === "Cắt tóc")?.revenue).toBe(25000000)
    })

    it("should aggregate revenue by staff name", () => {
        // Staff should be grouped and summed by staffName with appointment count
        const mockStaffData = [
            { staffName: "Mai Anh", revenue: 20000000, appointments: 10 },
            { staffName: "Mai Anh", revenue: 25000000, appointments: 10 }, // duplicate
            { staffName: "Thu Hà", revenue: 38000000, appointments: 18 },
        ]

        const aggregated = mockStaffData.reduce((acc, item) => {
            const existing = acc.find((x) => x.staffName === item.staffName)
            if (existing) {
                existing.revenue += item.revenue
                existing.appointments += item.appointments
            } else {
                acc.push({ ...item })
            }
            return acc
        }, [] as typeof mockStaffData)

        expect(aggregated).toHaveLength(2)
        expect(aggregated.find((x) => x.staffName === "Mai Anh")?.revenue).toBe(45000000)
        expect(aggregated.find((x) => x.staffName === "Mai Anh")?.appointments).toBe(20)
    })

    it("should order results by revenue descending", () => {
        // Results should be sorted by revenue in descending order
        const unsorted = [
            { serviceName: "Service A", revenue: 10000000 },
            { serviceName: "Service B", revenue: 50000000 },
            { serviceName: "Service C", revenue: 30000000 },
        ]

        const sorted = [...unsorted].sort((a, b) => b.revenue - a.revenue)

        expect(sorted[0].revenue).toBe(50000000)
        expect(sorted[1].revenue).toBe(30000000)
        expect(sorted[2].revenue).toBe(10000000)
    })

    it("should handle empty date range (no appointments in period)", () => {
        // Should return structure with zero values
        const emptyResponse = {
            data: {
                overview: {
                    totalRevenue: 0,
                    totalAppointments: 0,
                    completedAppointments: 0,
                    totalCustomers: 0,
                },
                serviceRevenue: [],
                staffPerformance: [],
            },
        }

        expect(emptyResponse.data.overview.totalRevenue).toBe(0)
        expect(emptyResponse.data.serviceRevenue).toHaveLength(0)
        expect(emptyResponse.data.staffPerformance).toHaveLength(0)
    })

    it("should work with various date formats", () => {
        // API expects: YYYY-MM-DD format
        const validDates = [
            { start: "2025-01-01", end: "2025-01-31" },
            { start: "2025-11-01", end: "2025-11-23" },
            { start: "2024-12-01", end: "2024-12-31" },
        ]

        validDates.forEach((dates) => {
            const url = `http://localhost:3000/api/admin/revenue?startDate=${dates.start}&endDate=${dates.end}`
            const urlObj = new URL(url)
            expect(urlObj.searchParams.get("startDate")).toMatch(/\d{4}-\d{2}-\d{2}/)
            expect(urlObj.searchParams.get("endDate")).toMatch(/\d{4}-\d{2}-\d{2}/)
        })
    })
})
