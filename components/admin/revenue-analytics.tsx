"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DollarSign, Users, Calendar, Download, BarChart3 } from "lucide-react"
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/'

  // Fetch revenue data khi period thay đổi
  useEffect(() => {
    fetchRevenueData()
  }, [selectedPeriod, dateRange])

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
        `${apiUrl}admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      )

      if (!currentResponse.ok) {
        throw new Error('Failed to fetch revenue data')
      }

      const currentData = await currentResponse.json()

      // Lấy dữ liệu kỳ trước (gấp đôi khoảng thời gian)
      const daysInPeriod = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const previousStartDate = subDays(startDate, daysInPeriod)

      const previousResponse = await fetch(
        `${apiUrl}admin/revenue?startDate=${format(previousStartDate, 'yyyy-MM-dd')}&endDate=${format(startDate, 'yyyy-MM-dd')}`
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
        `${apiUrl}admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
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
        `${apiUrl}admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
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
        `${apiUrl}admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Thống kê doanh thu</h1>
        <div className="flex items-center gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={fetchRevenueByService}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  {((revenueData?.totalRevenue ?? 0) / 1000000).toFixed(1)}M₫
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={fetchAppointments}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng lịch hẹn</CardTitle>
            <Calendar className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">{revenueData?.totalAppointments ?? 0}</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={fetchCustomers}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng khách hàng</CardTitle>
            <Users className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">{revenueData?.totalCustomers ?? 0}</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Giá trị trung bình</CardTitle>
            <BarChart3 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  {((revenueData?.averageOrderValue ?? 0) / 1000).toFixed(0)}K₫
                </div>
              </>
            )}
          </CardContent>
        </Card>
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
