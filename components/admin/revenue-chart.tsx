"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { subDays, format, eachDayOfInterval } from "date-fns"
import type { DateRange } from "react-day-picker"
import { DetailModal } from "./detail-modal"
import { Activity } from "lucide-react"

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

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-neutral-200/50 bg-white/70 p-6 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(15,15,15,0.12),0_1px_2px_rgba(0,0,0,0.02)] ${className}`}
    >
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="rounded-2xl bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="font-sans font-bold text-neutral-800 text-lg tracking-tight leading-tight">{title}</h2>
        {subtitle && <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

export function RevenueChart({ dateRange }: RevenueChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [appointmentsByDate, setAppointmentsByDate] = useState<Record<string, any[]>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<any[]>([])

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

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
          `${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
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
  }, [dateRange, apiBase])

  const handleDotClick = (data: ChartData) => {
    const appointments = appointmentsByDate[data.dateKey] || []
    setModalData(appointments)
    setSelectedDate(data.date)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <GlassCard>
        <SectionTitle icon={Activity} title="Doanh thu theo ngày" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </GlassCard>
    )
  }

  // Custom tooltip to show different styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg backdrop-blur-md bg-white/95">
          <p className="font-semibold text-foreground text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{ color: "#f97316" }}
              className="font-bold text-xs"
            >
              Doanh thu: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <>
      <GlassCard>
        <SectionTitle icon={Activity} title="Doanh thu theo ngày" subtitle="Biểu đồ trực quan doanh thu theo thời gian" />
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} onClick={(state: any) => {
            if (state && state.activeTooltipIndex !== undefined) {
              const chartDataItem = data[state.activeTooltipIndex]
              if (chartDataItem && chartDataItem.revenue > 0) {
                handleDotClick(chartDataItem)
              }
            }
          }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              height={data.length > 14 ? 50 : 32}
              interval={data.length > 14 ? Math.floor(data.length / 8) : 0}
              angle={data.length > 14 ? -30 : 0}
              textAnchor={data.length > 14 ? "end" : "middle"}
              tick={{ dy: 6 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ fill: "#f97316", stroke: "#fff", strokeWidth: 2, r: 5, cursor: 'pointer' }}
              activeDot={{ r: 7, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
            />
            {data.map((item, index) => (
              item.revenue > 0 && (
                <ReferenceDot
                  key={`dot-${index}`}
                  x={item.name}
                  y={item.revenue}
                  onClick={() => handleDotClick(item)}
                  r={5}
                  fill="#f97316"
                  stroke="#fff"
                  strokeWidth={1.5}
                  cursor="pointer"
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

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
