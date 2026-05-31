"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, DollarSign, Users, Scissors, TrendingUp, Clock } from "lucide-react"
import { RevenueChart } from "./revenue-chart"
import { AppointmentChart } from "./appointment-chart"
import { RecentAppointments } from "./recent-appointments"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

const formatCurrency = (value: number): string => {
  return `${Math.round(value).toLocaleString('vi-VN')}₫`
}

interface DashboardStats {
  totalRevenueToday: number
  appointmentsToday: number
  newCustomersToday: number
  topService: { name: string; count: number }
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)

        // Get today's data
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const endToday = new Date()
        endToday.setHours(23, 59, 59, 999)

        const response = await fetch(
          `${apiBase}/admin/revenue?startDate=${format(today, 'yyyy-MM-dd')}&endDate=${format(today, 'yyyy-MM-dd')}`
        )

        if (!response.ok) throw new Error('Failed to fetch dashboard stats')

        const result = await response.json()
        const overview = result.data?.overview || {}
        const appointments = result.data?.appointments || []
        const serviceRevenue = result.data?.serviceRevenue || []

        // Get unique customers today
        const uniqueCustomers = new Set(appointments.map((apt: any) => apt.customerPhone)).size

        // Get top service
        const topService = serviceRevenue.length > 0
          ? { name: serviceRevenue[0].serviceName, count: serviceRevenue[0].count }
          : { name: 'N/A', count: 0 }

        setStats({
          totalRevenueToday: overview.totalRevenue || 0,
          appointmentsToday: appointments.length,
          newCustomersToday: uniqueCustomers,
          topService: topService,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        // Fallback to empty stats
        setStats({
          totalRevenueToday: 0,
          appointmentsToday: 0,
          newCustomersToday: 0,
          topService: { name: 'N/A', count: 0 },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [apiBase])

  // Set lastUpdated on client only to avoid SSR/hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("vi-VN"))
  }, [loading])

  const statCards = stats ? [
    {
      title: "Tổng doanh thu hôm nay",
      value: formatCurrency(stats.totalRevenueToday),
      change: `${stats.totalRevenueToday > 0 ? '+' : ''}${stats.totalRevenueToday.toLocaleString('vi-VN')}₫`,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Lịch hẹn hôm nay",
      value: stats.appointmentsToday.toString(),
      change: `${stats.appointmentsToday} lịch hẹn`,
      icon: Calendar,
      color: "text-accent",
    },
    {
      title: "Khách hàng hôm nay",
      value: stats.newCustomersToday.toString(),
      change: `${stats.newCustomersToday} khách hàng`,
      icon: Users,
      color: "text-secondary",
    },
    {
      title: "Dịch vụ phổ biến",
      value: stats.topService.name,
      change: `${stats.topService.count} lượt`,
      icon: Scissors,
      color: "text-primary",
    },
  ] : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
            <Clock className="h-4 w-4" />
            Cập nhật lần cuối:{" "}
            <span suppressHydrationWarning>{lastUpdated ?? "--:--:--"}</span>
          </div>
        </div>

        {/* Stats Grid Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-[10px] pb-2 sm:p-6 sm:pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent className="p-[10px] sm:p-6">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>

        {/* Recent Appointments Loading */}
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
          <Clock className="h-4 w-4" />
          Cập nhật lần cuối:{" "}
          <span suppressHydrationWarning>{lastUpdated ?? "--:--:--"}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-[10px] pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-[10px] sm:p-6">
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-primary" />
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RevenueChart />
        <AppointmentChart />
      </div>

      {/* Recent Appointments */}
      <RecentAppointments />
    </div>
  )
}
