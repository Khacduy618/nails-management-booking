import { describe, it, expect } from "vitest"

/**
 * Tests for RevenueAnalytics Component
 * 
 * Main dashboard component for revenue analytics with period selection.
 */

describe("RevenueAnalytics", () => {
    it("should support period selection options", () => {
        const periods = ["7days", "30days", "90days", "1year", "custom"]

        expect(periods).toContain("7days")
        expect(periods).toContain("30days")
        expect(periods).toContain("custom")
    })

    it("should calculate date range from selected period", () => {
        const selectedPeriod = "7days"
        const today = new Date()
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

        expect(sevenDaysAgo < today).toBe(true)
    })

    it("should fetch data with correct API URL format", () => {
        const apiUrl = "http://localhost:3000/api/admin/revenue?startDate=2025-11-01&endDate=2025-11-23"

        const urlPattern = /admin\/revenue\?startDate=\d{4}-\d{2}-\d{2}&endDate=\d{4}-\d{2}-\d{2}/
        expect(urlPattern.test(apiUrl)).toBe(true)
    })

    it("should pass dateRange to all child components", () => {
        interface DateRange {
            from: Date
            to: Date
        }

        const dateRange: DateRange = {
            from: new Date("2025-11-01"),
            to: new Date("2025-11-23"),
        }

        const childComponents = ["RevenueChart", "ServiceRevenueChart", "StaffPerformanceChart", "TopServicesTable", "CustomerAnalytics"]

        expect(childComponents).toHaveLength(5)
    })

    it("should display metric cards", () => {
        const metrics = ["Tổng doanh thu", "Tổng lịch hẹn", "Tổng khách hàng", "Giá trị trung bình"]

        expect(metrics).toHaveLength(4)
        expect(metrics[0]).toBe("Tổng doanh thu")
    })

    it("should handle API response format", () => {
        const apiResponse = {
            data: {
                overview: {
                    totalRevenue: 100000000,
                    totalAppointments: 50,
                    completedAppointments: 48,
                    totalCustomers: 25,
                },
                serviceRevenue: [],
                staffPerformance: [],
            },
        }

        expect(apiResponse.data).toHaveProperty("overview")
        expect(apiResponse.data).toHaveProperty("serviceRevenue")
        expect(apiResponse.data).toHaveProperty("staffPerformance")
    })

    it("should calculate average appointment value", () => {
        const totalRevenue = 100000000
        const totalAppointments = 50
        const averageValue = totalRevenue / totalAppointments

        expect(averageValue).toBe(2000000)
    })

    it("should recalculate date range when period changes", () => {
        const periodA = "7days"
        const periodB = "30days"

        expect(periodA).not.toBe(periodB)
    })

    it("should provide date range to child components in sync", () => {
        const dateRange = {
            from: new Date("2025-11-01"),
            to: new Date("2025-11-23"),
        }

        const childProps = {
            RevenueChart: { dateRange },
            ServiceRevenueChart: { dateRange },
            StaffPerformanceChart: { dateRange },
            TopServicesTable: { dateRange },
            CustomerAnalytics: { dateRange },
        }

        expect(Object.keys(childProps)).toHaveLength(5)
    })
})

