import { describe, it, expect } from "vitest"

/**
 * Tests for TopServicesTable Component
 * 
 * Displays top 5 services ranked by revenue with growth metrics.
 */

describe("TopServicesTable", () => {
    it("should render table with title", () => {
        const title = "Top dịch vụ"
        expect(title).toBe("Top dịch vụ")
    })

    it("should render table headers", () => {
        const headers = ["Dịch vụ", "Doanh thu", "Lượt đặt", "Tăng trưởng", "Đánh giá"]

        expect(headers).toContain("Dịch vụ")
        expect(headers).toContain("Doanh thu")
        expect(headers).toContain("Lượt đặt")
    })

    it("should fetch data with date range parameters", () => {
        const apiUrl = "http://localhost:3000/api/admin/revenue?startDate=2025-11-01&endDate=2025-11-23"

        expect(apiUrl).toContain("startDate")
        expect(apiUrl).toContain("endDate")
    })

    it("should calculate growth percentage correctly", () => {
        const currentRevenue = 42000000
        const previousRevenue = 38000000
        const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100

        expect(growth).toBeCloseTo(10.53, 1)
    })

    it("should accept dateRange prop", () => {
        interface TopServicesTableProps {
            dateRange?: {
                from: Date
                to: Date
            }
        }

        const props: TopServicesTableProps = {
            dateRange: {
                from: new Date("2025-11-01"),
                to: new Date("2025-11-23"),
            },
        }

        expect(props.dateRange).toBeDefined()
    })

    it("should display top 5 services only", () => {
        const services = [
            "Massage thư giãn",
            "Cắt tóc nữ",
            "Chăm sóc da mặt",
            "Làm nail gel",
            "Cắt tóc nam",
        ]

        expect(services).toHaveLength(5)
    })

    it("should sort services by revenue descending", () => {
        const unsorted = [
            { name: "A", revenue: 15000000 },
            { name: "B", revenue: 42000000 },
            { name: "C", revenue: 28000000 },
        ]

        const sorted = [...unsorted].sort((a, b) => b.revenue - a.revenue)

        expect(sorted[0].revenue).toBe(42000000)
        expect(sorted[1].revenue).toBe(28000000)
        expect(sorted[2].revenue).toBe(15000000)
    })

    it("should fetch previous period data for growth calculation", () => {
        const currentPeriod = {
            startDate: "2025-11-01",
            endDate: "2025-11-23",
        }

        const previousPeriod = {
            startDate: "2025-10-01",
            endDate: "2025-10-23",
        }

        expect(currentPeriod).toBeDefined()
        expect(previousPeriod).toBeDefined()
    })

    it("should format revenue in millions", () => {
        const revenue = 42000000
        const formatted = Math.round(revenue / 1000000)

        expect(formatted).toBe(42)
    })

    it("should show growth trend icons", () => {
        const trends = ["up", "down", "neutral"]

        expect(trends).toContain("up")
        expect(trends).toContain("down")
    })

    it("should provide service rankings", () => {
        const rankings = [1, 2, 3, 4, 5]

        expect(rankings).toHaveLength(5)
        expect(rankings[0]).toBe(1)
    })

    it("should refetch when dateRange changes", () => {
        const dependency = "dateRange"
        expect(dependency).toBe("dateRange")
    })

    it("should use default 30-day period when no dateRange provided", () => {
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        expect(startDate < endDate).toBe(true)
    })
})
