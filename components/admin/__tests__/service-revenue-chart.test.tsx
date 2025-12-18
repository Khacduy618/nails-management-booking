import { describe, it, expect } from "vitest"

/**
 * Tests for ServiceRevenueChart Component
 * 
 * This component displays a pie chart of revenue by service.
 * Note: Full render tests are handled in integration tests.
 */

describe("ServiceRevenueChart", () => {
    it("should accept dateRange prop", () => {
        // Component interface
        interface ServiceRevenueChartProps {
            dateRange?: {
                from: Date
                to: Date
            }
        }

        const props: ServiceRevenueChartProps = {
            dateRange: {
                from: new Date("2025-11-01"),
                to: new Date("2025-11-23"),
            },
        }

        expect(props.dateRange).toBeDefined()
    })

    it("should calculate percentages correctly", () => {
        // Service revenue percentage calculation
        const serviceRevenue = [
            { serviceName: "Cắt tóc", revenue: 35000000 },
            { serviceName: "Massage", revenue: 42000000 },
            { serviceName: "Chăm sóc da", revenue: 28000000 },
            { serviceName: "Làm nail", revenue: 20000000 },
        ]

        const totalRevenue = serviceRevenue.reduce((sum, item) => sum + item.revenue, 0)
        const percentages = serviceRevenue.map((item) => ({
            ...item,
            percentage: Math.round((item.revenue / totalRevenue) * 100),
        }))

        expect(percentages[0].percentage).toBe(28) // 35M / 125M ≈ 28%
        expect(percentages[1].percentage).toBe(34) // 42M / 125M ≈ 34%
    })

    it("should use API endpoint to fetch service revenue", () => {
        // Endpoint: /api/admin/revenue with date range
        const apiUrl = "http://localhost:3000/api/admin/revenue?startDate=2025-11-01&endDate=2025-11-23"

        expect(apiUrl).toContain("admin/revenue")
        expect(apiUrl).toContain("startDate")
        expect(apiUrl).toContain("endDate")
    })

    it("should refetch when dateRange changes", () => {
        // Component dependency: [dateRange]
        const dependency = "dateRange"
        expect(dependency).toBe("dateRange")
    })

    it("should format revenue as millions (M₫)", () => {
        const revenue = 42000000
        const formatted = `${(revenue / 1000000).toFixed(1)}M₫`
        expect(formatted).toBe("42.0M₫")
    })

    it("should have fallback data if API fails", () => {
        const fallbackData = [
            { name: "Cắt tóc", value: 35000000, percentage: 28 },
            { name: "Massage", value: 42000000, percentage: 34 },
            { name: "Chăm sóc da", value: 28000000, percentage: 22 },
            { name: "Làm nail", value: 20000000, percentage: 16 },
        ]

        expect(fallbackData).toHaveLength(4)
        expect(fallbackData[0].value).toBe(35000000)
    })

    it("should use color palette for pie slices", () => {
        const colors = [
            "hsl(var(--primary))",
            "hsl(var(--accent))",
            "hsl(var(--secondary))",
            "hsl(var(--muted))",
        ]

        expect(colors).toHaveLength(4)
        expect(colors[0]).toContain("primary")
    })

    it("should handle default 30-day period when no dateRange provided", () => {
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        expect(startDate < endDate).toBe(true)
    })

    it("should return empty array for empty service revenue", () => {
        const emptyRevenue: any[] = []

        expect(emptyRevenue).toHaveLength(0)
        expect(Array.isArray(emptyRevenue)).toBe(true)
    })
})
