"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { subDays, format, eachDayOfInterval } from "date-fns"
import { vi } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { DetailModal } from "./detail-modal"

interface ChartData {
  name: string
  date: string
  revenue: number
  dateKey: string
}

interface RevenueChartProps {
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

export function RevenueChart({ dateRange }: RevenueChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [appointmentsByDate, setAppointmentsByDate] = useState<Record<string, any[]>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<any[]>([])

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/'

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)

        // Determine date range
        let startDate: Date
        let endDate: Date

        if (dateRange?.from && dateRange?.to) {
          startDate = dateRange.from
          endDate = dateRange.to
        } else {
          // Default to 7-day period (end of today)
          endDate = new Date()
          // Set to end of day to include today
          endDate.setHours(23, 59, 59, 999)
          startDate = subDays(endDate, 7)
          // Set start to beginning of day
          startDate.setHours(0, 0, 0, 0)
        }

        const response = await fetch(
          `${apiUrl}admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch revenue data')
        }

        const result = await response.json()
        const appointments = result.data.appointments || []

        // Generate data for each day in the range
        const days = eachDayOfInterval({ start: startDate, end: endDate })

        // Create a map of revenue by date and appointments by date
        const revenueByDate: Record<string, number> = {}
        const appointmentsByDateMap: Record<string, any[]> = {}

        appointments.forEach((apt: any) => {
          const dateKey = format(new Date(apt.appointmentDate), 'yyyy-MM-dd')
          revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + (apt.revenue || 0)

          if (!appointmentsByDateMap[dateKey]) {
            appointmentsByDateMap[dateKey] = []
          }
          appointmentsByDateMap[dateKey].push(apt)
        })

        // Build chart data
        const chartData = days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          // Format: "Hôm nay (25/11)" or "25/11" for other days
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const dateMidName = isToday
            ? `Hôm nay (${format(day, 'dd/MM')})`
            : format(day, 'dd/MM')

          return {
            name: dateMidName,
            date: dateMidName,
            dateKey: dateKey,
            revenue: revenueByDate[dateKey] || 0,
          }
        })

        setData(chartData)
        setAppointmentsByDate(appointmentsByDateMap)
      } catch (error) {
        console.error('Error fetching revenue data:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [dateRange])

  const handleDotClick = (data: ChartData) => {
    const appointments = appointmentsByDate[data.dateKey] || []
    setModalData(appointments)
    setSelectedDate(data.date)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Doanh thu theo ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Doanh thu theo ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} onClick={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined) {
                const chartDataItem = data[state.activeTooltipIndex]
                if (chartDataItem && chartDataItem.revenue > 0) {
                  handleDotClick(chartDataItem)
                }
              }
            }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                height={80}
                interval={0}
                angle={-45}
                textAnchor="end"
                tick={{ dy: 10 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                labelFormatter={(label) => label}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--primary))",
                  borderRadius: "8px",
                  padding: "12px",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
                wrapperStyle={{ zIndex: 1000 }}
                cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--primary))' }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5, cursor: 'pointer' }}
                activeDot={{ r: 7, fill: "hsl(var(--primary))" }}
              />
              {data.map((item, index) => (
                item.revenue > 0 && (
                  <ReferenceDot
                    key={`dot-${index}`}
                    x={item.name}
                    y={item.revenue}
                    onClick={() => handleDotClick(item)}
                    r={5}
                    fill="hsl(var(--primary))"
                    cursor="pointer"
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <DetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type="appointments"
        title={`Chi tiết ngày ${selectedDate}`}
        data={modalData}
      />
    </>
  )
}
