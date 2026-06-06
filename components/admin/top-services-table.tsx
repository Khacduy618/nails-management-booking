"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { subDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface ServiceItem {
  id: number
  name: string
  bookings: number
  revenue: number
  growth: number
  avgRating: number
  category: string
}

interface TopServicesTableProps {
  dateRange?: DateRange
}

export function TopServicesTable({ dateRange }: TopServicesTableProps) {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

  useEffect(() => {
    const fetchTopServices = async () => {
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

        const previousStartDate = subDays(startDate, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
        const previousEndDate = subDays(startDate, 1)

        // Fetch both periods
        const [currentResponse, previousResponse] = await Promise.all([
          fetch(`${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`),
          fetch(`${apiBase}/admin/revenue?startDate=${format(previousStartDate, 'yyyy-MM-dd')}&endDate=${format(previousEndDate, 'yyyy-MM-dd')}`),
        ])

        if (!currentResponse.ok || !previousResponse.ok) {
          throw new Error('Failed to fetch service data')
        }

        const currentData = await currentResponse.json()
        const previousData = await previousResponse.json()

        const currentServices = currentData.data.serviceRevenue || []
        const previousServices = previousData.data.serviceRevenue || []

        // Create a map of previous revenue by service
        const previousRevenueMap = new Map(
          previousServices.map((item: any) => [item.serviceName, item.revenue || 0])
        )

        // Calculate growth and transform data
        const chartData = currentServices
          .map((item: any, index: number) => {
            const currentRevenue = item.revenue || 0
            const previousRev = previousRevenueMap.get(item.serviceName) as number || 0
            const growth =
              previousRev > 0
                ? ((currentRevenue - previousRev) / previousRev) * 100
                : 0

            return {
              id: index + 1,
              name: item.serviceName || 'Unknown',
              bookings: item.appointments || 0,
              revenue: currentRevenue,
              growth: growth,
              avgRating: 4.5, // Default rating
              category: 'Dịch vụ', // Default category
            }
          })
          .sort((a: ServiceItem, b: ServiceItem) => b.revenue - a.revenue)
          .slice(0, 5)

        setServices(chartData.length > 0 ? chartData : [
          { id: 1, name: "Massage thư giãn", bookings: 342, revenue: 42000000, growth: 15.2, avgRating: 4.9, category: "Spa" },
          { id: 2, name: "Cắt tóc nữ", bookings: 298, revenue: 35000000, growth: 8.7, avgRating: 4.8, category: "Tóc" },
          { id: 3, name: "Chăm sóc da mặt", bookings: 186, revenue: 28000000, growth: -2.1, avgRating: 4.7, category: "Spa" },
          { id: 4, name: "Làm nail gel", bookings: 224, revenue: 20000000, growth: 12.3, avgRating: 4.6, category: "Nail" },
          { id: 5, name: "Cắt tóc nam", bookings: 156, revenue: 15000000, growth: 0, avgRating: 4.5, category: "Tóc" },
        ])
      } catch (error) {
        console.error('Error fetching top services:', error)
        // Fallback to mock data on error
        setServices([
          { id: 1, name: "Massage thư giãn", bookings: 342, revenue: 42000000, growth: 15.2, avgRating: 4.9, category: "Spa" },
          { id: 2, name: "Cắt tóc nữ", bookings: 298, revenue: 35000000, growth: 8.7, avgRating: 4.8, category: "Tóc" },
          { id: 3, name: "Chăm sóc da mặt", bookings: 186, revenue: 28000000, growth: -2.1, avgRating: 4.7, category: "Spa" },
          { id: 4, name: "Làm nail gel", bookings: 224, revenue: 20000000, growth: 12.3, avgRating: 4.6, category: "Nail" },
          { id: 5, name: "Cắt tóc nam", bookings: 156, revenue: 15000000, growth: 0, avgRating: 4.5, category: "Tóc" },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopServices()
  }, [dateRange, apiBase])

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-3 w-3 text-primary" />
    if (growth < 0) return <TrendingDown className="h-3 w-3 text-destructive" />
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }

  const getTrendColor = (growth: number) => {
    if (growth > 0) return "text-primary"
    if (growth < 0) return "text-destructive"
    return "text-muted-foreground"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Top dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Top dịch vụ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Dịch vụ</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Danh mục</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Lượt đặt</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Doanh thu</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Tăng trưởng</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service: ServiceItem, index: number) => (
                <tr key={service.id} className="border-b border-border hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="font-medium text-foreground">{service.name}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{service.category}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-medium text-foreground">{service.bookings}</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-medium text-primary">{(service.revenue / 1000000).toFixed(1)}M₫</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className={`flex items-center justify-end gap-1 ${getTrendColor(service.growth)}`}>
                      {getTrendIcon(service.growth)}
                      <span className="font-medium">{Math.abs(service.growth).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-medium text-foreground">{service.avgRating}</span>
                      <span className="text-yellow-400">★</span>
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
