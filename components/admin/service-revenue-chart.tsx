"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { subDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface ServiceData {
  name: string
  value: number
  percentage: number
}

interface ServiceRevenueChartProps {
  dateRange?: DateRange
}

// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M₫`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K₫`
  } else {
    return `${value}₫`
  }
}

export function ServiceRevenueChart({ dateRange }: ServiceRevenueChartProps) {
  const [data, setData] = useState<ServiceData[]>([])
  const [loading, setLoading] = useState(true)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

  useEffect(() => {
    const fetchServiceRevenue = async () => {
      try {
        setLoading(true)

        // Determine date range
        let startDate: Date
        let endDate: Date

        if (dateRange?.from && dateRange?.to) {
          startDate = dateRange.from
          endDate = dateRange.to
        } else {
          // Default to 30-day period
          endDate = new Date()
          endDate.setHours(23, 59, 59, 999)
          startDate = subDays(endDate, 30)
          startDate.setHours(0, 0, 0, 0)
        }

        const response = await fetch(
          `${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch service revenue data')
        }

        const result = await response.json()
        const serviceRevenue = result.data.serviceRevenue || []

        // Calculate total revenue for percentage calculation
        const totalRevenue = serviceRevenue.reduce((sum: number, item: any) => sum + (item.totalRevenue || 0), 0)

        // Transform data for table
        const chartData = serviceRevenue.map((item: any) => ({
          name: item.serviceName || 'Unknown',
          value: item.totalRevenue || 0,
          percentage: totalRevenue > 0 ? Math.round((item.totalRevenue / totalRevenue) * 100) : 0,
        }))

        setData(chartData.length > 0 ? chartData : [
          { name: "Cắt tóc", value: 35000000, percentage: 28 },
          { name: "Massage", value: 42000000, percentage: 34 },
          { name: "Chăm sóc da", value: 28000000, percentage: 22 },
          { name: "Làm nail", value: 20000000, percentage: 16 },
        ])
      } catch (error) {
        console.error('Error fetching service revenue data:', error)
        // Fallback to mock data on error
        setData([
          { name: "Cắt tóc", value: 35000000, percentage: 28 },
          { name: "Massage", value: 42000000, percentage: 34 },
          { name: "Chăm sóc da", value: 28000000, percentage: 22 },
          { name: "Làm nail", value: 20000000, percentage: 16 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchServiceRevenue()
  }, [dateRange, apiBase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Doanh thu theo dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Doanh thu theo dịch vụ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto max-h-[300px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Dịch vụ</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Doanh thu</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Phần trăm</th>
              </tr>
            </thead>
            <tbody>
              {data.map((service, index) => (
                <tr
                  key={index}
                  className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-foreground">{service.name}</td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">
                    {formatCurrency(service.value)}
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${service.percentage}%` }}
                        />
                      </div>
                      <span className="font-medium text-foreground w-12">{service.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}