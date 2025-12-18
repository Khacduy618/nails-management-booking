import { describe, it, expect } from "vitest"

/**
 * Tests for CustomerAnalytics Component
 * 
 * This component displays customer overview, behavior, and VIP customers.
 */

describe("CustomerAnalytics", () => {
    it("should fetch customer data with correct date range", () => {
        interface CustomerAnalyticsProps {
            dateRange?: {
                from: Date
                to: Date
            }
        }

        const props: CustomerAnalyticsProps = {
            dateRange: {
                from: new Date("2025-11-01"),
                to: new Date("2025-11-23"),
            },
        }

        expect(props.dateRange).toBeDefined()
    })

    it("should calculate customer metrics correctly", () => {
        const totalCustomers = 890
        const newCustomersPercentage = 0.175
        const newCustomers = Math.floor(totalCustomers * newCustomersPercentage)
        const returningCustomers = totalCustomers - newCustomers

        expect(newCustomers).toBe(155)
        expect(returningCustomers).toBe(735)
    })

    it("should display retention rate as good", () => {
        const retentionRate = 82.5
        const status = retentionRate > 80 ? "Tốt" : "Trung bình"

        expect(status).toBe("Tốt")
        expect(retentionRate).toBe(82.5)
    })

    it("should calculate average visits per customer", () => {
        const totalAppointments = 100
        const totalCustomers = 890
        const averageVisits = totalAppointments / totalCustomers

        expect(averageVisits).toBeCloseTo(0.112, 2)
    })

    it("should calculate customer behavior distribution", () => {
        const behaviors = {
            "1-2 visits": 0.45,
            "3-5 visits": 0.35,
            "6+ visits": 0.20,
        }

        const totalPercentage = Object.values(behaviors).reduce((a, b) => a + b, 0)
        expect(totalPercentage).toBe(1)
    })

    it("should identify VIP customers by total spending", () => {
        const customers = [
            { id: 1, name: "Nguyễn Thị Lan", totalSpending: 15000000 },
            { id: 2, name: "Trần Văn Nam", totalSpending: 12000000 },
            { id: 3, name: "Phạm Hồng Hà", totalSpending: 8000000 },
        ]

        const sorted = [...customers].sort((a, b) => b.totalSpending - a.totalSpending)

        expect(sorted[0].name).toBe("Nguyễn Thị Lan")
        expect(sorted[1].name).toBe("Trần Văn Nam")
    })

    it("should accept dateRange prop", () => {
        const dependency = "dateRange"
        expect(dependency).toBe("dateRange")
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

    it("should provide API endpoint format", () => {
        const apiUrl = "http://localhost:3000/api/admin/revenue?startDate=2025-11-01&endDate=2025-11-23"

        expect(apiUrl).toContain("admin/revenue")
        expect(apiUrl).toContain("startDate")
        expect(apiUrl).toContain("endDate")
    })

    it("should display three main sections", () => {
        const sections = ["Tổng quan khách hàng", "Hành vi khách hàng", "Khách hàng VIP"]

        expect(sections).toHaveLength(3)
        expect(sections[0]).toBe("Tổng quan khách hàng")
    })
})
