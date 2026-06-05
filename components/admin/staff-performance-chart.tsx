"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { subDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { DetailModal } from "./detail-modal"

interface StaffData {
  name: string
  revenue: number
  appointments: number
}

interface ChartData {
  name: string
  rawName?: string
  "Doanh thu": number
  "Lịch hẹn": number
}

interface StaffPerformanceChartProps {
  dateRange?: DateRange
}

const formatCurrency = (value: number): string => {
  // Format as VND without rounding, show full amount
  return `${Math.round(value).toLocaleString('vi-VN')}₫`
}

const formatCurrencyShort = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M₫`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K₫`
  } else {
    return `${value}₫`
  }
}

export function StaffPerformanceChart({ dateRange }: StaffPerformanceChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [staffData, setStaffData] = useState<StaffData[]>([])
  const [staffMap, setStaffMap] = useState<Record<string, string>>({}) // name -> id mapping
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [modalData, setModalData] = useState<any[]>([])

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

  useEffect(() => {
    const fetchStaffPerformance = async () => {
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
          throw new Error('Failed to fetch staff performance data')
        }

        const result = await response.json()
        const staffPerformance = result.data.staffPerformance || []
        const appointments = result.data.appointments || []

        // Store staff data for modal and create id mapping
        setStaffData(staffPerformance)

        // Create staff name -> id mapping from appointments to ensure we have the right IDs
        const staffIdMap: Record<string, string> = {}
        appointments.forEach((apt: any) => {
          if (apt.staffName && apt.staffId) {
            staffIdMap[apt.staffName] = apt.staffId
          }
        })
        setStaffMap(staffIdMap)

        // Transform data for bar chart with both metrics
        const chartData = staffPerformance.map((item: any) => {
          const rawName = item.staffName || 'Unknown'
          const name = rawName.includes("@") ? rawName.split("@")[0] : rawName
          console.log(`Staff: ${rawName}, Revenue: ${item.revenue}`)
          return {
            name: name,
            rawName: rawName,
            "Doanh thu": Math.round((item.revenue || 0) * 100) / 100, // Ensure 2 decimal places
            "Lịch hẹn": item.appointments || 0,
          }
        })

        setData(chartData.length > 0 ? chartData : [])
      } catch (error) {
        console.error('Error fetching staff performance data:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchStaffPerformance()
  }, [dateRange, apiBase])

  const handleBarClick = async (staffName: string) => {
    try {
      // Determine date range
      let startDate: Date
      let endDate: Date

      if (dateRange?.from && dateRange?.to) {
        startDate = dateRange.from
        endDate = dateRange.to
      } else {
        endDate = new Date()
        endDate.setHours(23, 59, 59, 999)
        startDate = subDays(endDate, 30)
        startDate.setHours(0, 0, 0, 0)
      }

      const response = await fetch(
        `${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      )

      if (!response.ok) throw new Error('Failed to fetch staff details')

      const result = await response.json()
      const appointments = result.data.appointments || []

      // Get staffId from map or try to extract from first matching appointment
      let staffId = staffMap[staffName]
      if (!staffId && appointments.length > 0) {
        const firstMatch = appointments.find((apt: any) => apt.staffName === staffName)
        staffId = firstMatch?.staffId
      }

      // Filter appointments by staffId (more reliable than name)
      const staffAppointments = staffId
        ? appointments.filter((apt: any) => apt.staffId === staffId)
        : appointments.filter((apt: any) => apt.staffName === staffName)

      console.log('Staff appointments:', staffAppointments)
      console.log('First appointment:', staffAppointments[0])

      setSelectedStaff(staffName)
      setSelectedStaffId(staffId || null)
      setModalData(staffAppointments)
      setModalOpen(true)
    } catch (error) {
      console.error('Error fetching staff details:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Hiệu suất nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // Custom tooltip to show different styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{ color: entry.color }}
              className="font-medium text-sm"
            >
              {entry.name === "Doanh thu"
                ? `${entry.name}: ${formatCurrency(entry.value)}`
                : `${entry.name}: ${entry.value} lịch hẹn`
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Hiệu suất nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: Math.max(data.length * 120, 600) }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 5 }} onClick={(state: any) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    const chartDataItem = data[state.activeTooltipIndex]
                    if (chartDataItem && chartDataItem.rawName) {
                      handleBarClick(chartDataItem.rawName)
                    }
                  }
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} cursor="pointer" />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    yAxisId="left"
                    label={{ value: 'Doanh thu', angle: -90, position: 'insideLeft', offset: 0 }}
                    tickFormatter={(value) => formatCurrencyShort(value)}
                    width={55}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    orientation="right"
                    yAxisId="right"
                    label={{ value: 'Lịch hẹn', angle: 90, position: 'insideRight', offset: 0 }}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} cursor="pointer" />
                  <Bar yAxisId="right" dataKey="Lịch hẹn" fill="#f97316" radius={[4, 4, 0, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>      <DetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type="appointments"
        title={`Chi tiết nhân viên: ${selectedStaff}`}
        data={modalData}
        staffTotalRevenue={modalData.reduce((sum: number, apt: any) => {
          const price = apt.priceAtBooking || apt.revenue || 0
          console.log('Apt:', apt.serviceName, 'Price:', price, 'Type:', typeof price)
          return sum + (parseFloat(String(price)) || 0)
        }, 0)}
      />
    </>
  )
}
