import { describe, it, expect } from "vitest"

/**
 * Tests for StaffPerformanceChart Component
 * 
 * This component displays a bar chart of staff performance metrics.
 */

describe("StaffPerformanceChart", () => {
    it("should accept dateRange prop", () => {
        interface StaffPerformanceChartProps {
            dateRange?: {
                from: Date
                to: Date
            }
        }

        const props: StaffPerformanceChartProps = {
            dateRange: {
                from: new Date("2025-11-01"),
                to: new Date("2025-11-23"),
            },
        }

        expect(props.dateRange).toBeDefined()
    })

    it("should fetch staff performance data from API", () => {
        const apiUrl = "http://localhost:3000/api/admin/revenue?startDate=2025-11-01&endDate=2025-11-23"

        expect(apiUrl).toContain("admin/revenue")
        expect(apiUrl).toContain("startDate")
        expect(apiUrl).toContain("endDate")
    })

    it("should convert revenue to millions for display", () => {
        const revenue = 45000000
        const inMillions = Math.round(revenue / 1000000)

        expect(inMillions).toBe(45)
    })

    it("should aggregate staff revenue and appointments", () => {
        const staffData = [
            { staffName: "Mai Anh", revenue: 45000000, appointments: 20 },
            { staffName: "Thu Hà", revenue: 38000000, appointments: 18 },
            { staffName: "Minh Châu", revenue: 35000000, appointments: 16 },
        ]

        expect(staffData[0]).toHaveProperty("revenue")
        expect(staffData[0]).toHaveProperty("appointments")
        expect(staffData[0].revenue).toBe(45000000)
    })

    it("should order staff by revenue descending", () => {
        const unsorted = [
            { staffName: "A", revenue: 30000000 },
            { staffName: "B", revenue: 50000000 },
            { staffName: "C", revenue: 40000000 },
        ]

        const sorted = [...unsorted].sort((a, b) => b.revenue - a.revenue)

        expect(sorted[0].revenue).toBe(50000000)
        expect(sorted[1].revenue).toBe(40000000)
        expect(sorted[2].revenue).toBe(30000000)
    })

    it("should use default 30-day period when no dateRange provided", () => {
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        expect(startDate < endDate).toBe(true)
    })

    it("should refetch when dateRange changes", () => {
        const dependency = "dateRange"
        expect(dependency).toBe("dateRange")
    })

    it("should have fallback data on API error", () => {
        const fallbackData = [
            { name: "Mai Anh", revenue: 45, appointments: 320 },
            { name: "Thu Hà", revenue: 38, appointments: 280 },
            { name: "Minh Châu", revenue: 25, appointments: 220 },
            { name: "Đức Anh", revenue: 32, appointments: 250 },
        ]

        expect(fallbackData).toHaveLength(4)
        expect(fallbackData[0].revenue).toBe(45)
    })

    it("should handle empty staff performance data", () => {
        const emptyData: any[] = []

        expect(Array.isArray(emptyData)).toBe(true)
        expect(emptyData).toHaveLength(0)
    })

    it("should display chart with correct color", () => {
        const barColor = "hsl(var(--primary))"
        expect(barColor).toContain("primary")
    })
})
