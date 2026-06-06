"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DollarSign, Users, Calendar, Download, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { RevenueChart } from "./revenue-chart"
import { ServiceRevenueChart } from "./service-revenue-chart"
import { StaffPerformanceChart } from "./staff-performance-chart"
import { TopServicesTable } from "./top-services-table"
import { CustomerAnalytics } from "./customer-analytics"
import { DetailModal } from "./detail-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"
import { subDays, format } from "date-fns"

interface RevenueData {
  totalRevenue: number
  totalAppointments: number
  totalCustomers: number
  averageOrderValue: number
  previousRevenue: number
  previousAppointments: number
  previousCustomers: number
  previousAOV: number
}

const periodOptions = [
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "90d", label: "3 tháng qua" },
  { value: "1y", label: "1 năm qua" },
  { value: "custom", label: "Tùy chỉnh" },
]

const getPeriodDates = (period: string): { startDate: Date; endDate: Date } => {
  const endDate = new Date()
  // Set end date to end of today
  endDate.setHours(23, 59, 59, 999)

  let startDate: Date

  switch (period) {
    case "7d":
      startDate = subDays(endDate, 7)
      break
    case "30d":
      startDate = subDays(endDate, 30)
      break
    case "90d":
      startDate = subDays(endDate, 90)
      break
    case "1y":
      startDate = subDays(endDate, 365)
      break
    default:
      startDate = subDays(endDate, 30)
  }

  // Set start date to beginning of that day
  startDate.setHours(0, 0, 0, 0)

  return { startDate, endDate }
}

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  trend?: number
  gradient: string
  onClick?: () => void
}

function KpiCard({ title, value, subtitle, icon: Icon, trend, gradient, onClick }: KpiCardProps) {
  const isPositive = (trend ?? 0) >= 0
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.05)] border border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.15)] ${gradient} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ minHeight: 140 }}
    >
      {/* decorative circles */}
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/[0.08] blur-sm" />
      <div className="absolute -bottom-8 -right-2 h-20 w-20 rounded-full bg-white/[0.04] blur-xs" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-white/70 font-medium">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-xs ring-1 ring-white/10">
          <Icon className="h-5.5 w-5.5 text-white" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="relative z-10 mt-4 flex items-center gap-1 text-[11px] font-bold">
          {isPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-red-300" />
          )}
          <span className={isPositive ? "text-emerald-200" : "text-red-200"}>
            {Math.abs(trend).toFixed(1)}% so với kỳ trước
          </span>
        </div>
      )}
    </div>
  )
}

export function RevenueAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'revenue' | 'appointments' | 'customers' | null>(null)
  const [modalTitle, setModalTitle] = useState('')
  const [modalData, setModalData] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

  // Fetch revenue data khi period thay đổi
  useEffect(() => {
    fetchRevenueData()
  }, [selectedPeriod, dateRange, apiBase])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)

      let startDate: Date
      let endDate: Date

      if (selectedPeriod === 'custom' && dateRange?.from && dateRange?.to) {
        startDate = dateRange.from
        endDate = dateRange.to
      } else {
        const dates = getPeriodDates(selectedPeriod)
        startDate = dates.startDate
        endDate = dates.endDate
      }

      // Lấy dữ liệu kỳ này
      const currentResponse = await fetch(
        `${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      )

      if (!currentResponse.ok) {
        throw new Error('Failed to fetch revenue data')
      }

      const currentData = await currentResponse.json()

      // Lấy dữ liệu kỳ trước (gấp đôi khoảng thời gian)
      const daysInPeriod = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const previousStartDate = subDays(startDate, daysInPeriod)

      const previousResponse = await fetch(
        `${apiBase}/admin/revenue?startDate=${format(previousStartDate, 'yyyy-MM-dd')}&endDate=${format(startDate, 'yyyy-MM-dd')}`
      )

      if (!previousResponse.ok) {
        throw new Error('Failed to fetch previous revenue data')
      }

      const previousData = await previousResponse.json()

      // Xử lý dữ liệu
      const overview = currentData.data?.overview || {}
      const previousOverview = previousData.data?.overview || {}

      setRevenueData({
        totalRevenue: overview.totalRevenue || 0,
        totalAppointments: overview.totalAppointments || 0,
        totalCustomers: overview.totalCustomers || 0,
        averageOrderValue: overview.totalRevenue && overview.totalAppointments
          ? Math.round(overview.totalRevenue / overview.totalAppointments)
          : 0,
        previousRevenue: previousOverview.totalRevenue || 0,
        previousAppointments: previousOverview.totalAppointments || 0,
        previousCustomers: previousOverview.totalCustomers || 0,
        previousAOV: previousOverview.totalRevenue && previousOverview.totalAppointments
          ? Math.round(previousOverview.totalRevenue / previousOverview.totalAppointments)
          : 0,
      })
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      toast.error('Lỗi tải dữ liệu doanh thu')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    setShowCustomDate(value === "custom")
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const revenueGrowth = revenueData ? calculateGrowth(revenueData.totalRevenue, revenueData.previousRevenue) : 0
  const appointmentGrowth = revenueData ? calculateGrowth(revenueData.totalAppointments, revenueData.previousAppointments) : 0
  const customerGrowth = revenueData ? calculateGrowth(revenueData.totalCustomers, revenueData.previousCustomers) : 0
  const aovGrowth = revenueData ? calculateGrowth(revenueData.averageOrderValue, revenueData.previousAOV) : 0

  const handleExportReport = () => {
    // In real app, this would generate and download a report
    alert("Tính năng xuất báo cáo sẽ được triển khai trong phiên bản tiếp theo")
  }

  const fetchRevenueByService = async () => {
    try {
      setModalLoading(true)
      let startDate: Date
      let endDate: Date

      if (selectedPeriod === 'custom' && dateRange?.from && dateRange?.to) {
        startDate = dateRange.from
        endDate = dateRange.to
      } else {
        const dates = getPeriodDates(selectedPeriod)
        startDate = dates.startDate
        endDate = dates.endDate
      }

      const response = await fetch(
        `${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      )

      if (!response.ok) throw new Error('Failed to fetch service revenue')

      const result = await response.json()
      const serviceRevenue = result.data?.serviceRevenue || []

      // Calculate percentages
      const totalRev = serviceRevenue.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0)
      const dataWithPercentage = serviceRevenue.map((s: any) => ({
        ...s,
        percentage: totalRev > 0 ? ((s.totalRevenue / totalRev) * 100).toFixed(1) : 0
      }))

      setModalData(dataWithPercentage)
      setModalType('revenue')
      setModalTitle('Doanh thu theo dịch vụ')
      setModalOpen(true)
    } catch (error) {
      console.error('Error fetching service revenue:', error)
      toast.error('Lỗi tải dữ liệu dịch vụ')
    } finally {
      setModalLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      setModalLoading(true)
      let startDate: Date
      let endDate: Date

      if (selectedPeriod === 'custom' && dateRange?.from && dateRange?.to) {
        startDate = dateRange.from
        endDate = dateRange.to
      } else {
        const dates = getPeriodDates(selectedPeriod)
        startDate = dates.startDate
        endDate = dates.endDate
      }

      const response = await fetch(
        `${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      )

      if (!response.ok) throw new Error('Failed to fetch appointments')

      const result = await response.json()
      const appointments = result.data?.appointments || []

      setModalData(appointments)
      setModalType('appointments')
      setModalTitle('Danh sách lịch hẹn')
      setModalOpen(true)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Lỗi tải danh sách lịch hẹn')
    } finally {
      setModalLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      setModalLoading(true)
      let startDate: Date
      let endDate: Date

      if (selectedPeriod === 'custom' && dateRange?.from && dateRange?.to) {
        startDate = dateRange.from
        endDate = dateRange.to
      } else {
        const dates = getPeriodDates(selectedPeriod)
        startDate = dates.startDate
        endDate = dates.endDate
      }

      const response = await fetch(
        `${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      )

      if (!response.ok) throw new Error('Failed to fetch customers')

      const result = await response.json()
      const customers = result.data?.customers || []

      setModalData(customers)
      setModalType('customers')
      setModalTitle('Danh sách khách hàng')
      setModalOpen(true)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Lỗi tải danh sách khách hàng')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:ml-auto">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showCustomDate && (
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} placeholder="Chọn khoảng thời gian" />
          )}

          <Button onClick={handleExportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-[140px] w-full rounded-3xl" />
            <Skeleton className="h-[140px] w-full rounded-3xl" />
            <Skeleton className="h-[140px] w-full rounded-3xl" />
            <Skeleton className="h-[140px] w-full rounded-3xl" />
          </>
        ) : (
          <>
            <KpiCard
              title="Tổng doanh thu"
              value={`${((revenueData?.totalRevenue ?? 0) / 1000000).toFixed(1)}M₫`}
              subtitle={`${(revenueData?.totalRevenue ?? 0).toLocaleString('vi-VN')}₫`}
              icon={DollarSign}
              trend={revenueGrowth}
              gradient="bg-gradient-to-br from-orange-500 to-pink-500"
              onClick={fetchRevenueByService}
            />
            <KpiCard
              title="Tổng lịch hẹn"
              value={String(revenueData?.totalAppointments ?? 0)}
              subtitle="Lịch hẹn trong khoảng thời gian"
              icon={Calendar}
              trend={appointmentGrowth}
              gradient="bg-gradient-to-br from-purple-600 to-indigo-600"
              onClick={fetchAppointments}
            />
            <KpiCard
              title="Tổng khách hàng"
              value={String(revenueData?.totalCustomers ?? 0)}
              subtitle="Khách hàng duy nhất"
              icon={Users}
              trend={customerGrowth}
              gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
              onClick={fetchCustomers}
            />
            <KpiCard
              title="Giá trị trung bình"
              value={`${((revenueData?.averageOrderValue ?? 0) / 1000).toFixed(0)}K₫`}
              subtitle="Doanh thu trên mỗi lịch hẹn"
              icon={BarChart3}
              trend={aovGrowth}
              gradient="bg-gradient-to-br from-teal-500 to-emerald-500"
            />
          </>
        )}
      </div>

      {/* Revenue Chart */}
      <RevenueChart dateRange={dateRange || (selectedPeriod !== 'custom' ? {
        from: getPeriodDates(selectedPeriod).startDate,
        to: getPeriodDates(selectedPeriod).endDate
      } : undefined)} />

      {/* Service and Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ServiceRevenueChart dateRange={dateRange || (selectedPeriod !== 'custom' ? {
          from: getPeriodDates(selectedPeriod).startDate,
          to: getPeriodDates(selectedPeriod).endDate
        } : undefined)} />
        <StaffPerformanceChart dateRange={dateRange || (selectedPeriod !== 'custom' ? {
          from: getPeriodDates(selectedPeriod).startDate,
          to: getPeriodDates(selectedPeriod).endDate
        } : undefined)} />
      </div>

      {/* Customer Analytics */}
      <CustomerAnalytics dateRange={dateRange || (selectedPeriod !== 'custom' ? {
        from: getPeriodDates(selectedPeriod).startDate,
        to: getPeriodDates(selectedPeriod).endDate
      } : undefined)} />

      {/* Top Services Table */}
      <TopServicesTable dateRange={dateRange || (selectedPeriod !== 'custom' ? {
        from: getPeriodDates(selectedPeriod).startDate,
        to: getPeriodDates(selectedPeriod).endDate
      } : undefined)} />

      {/* Detail Modal */}
      <DetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
        title={modalTitle}
        data={modalData}
        loading={modalLoading}
      />
    </div>
  )
}
