"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"
import { subDays, format, eachDayOfInterval } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface AppointmentData {
  name: string
  date: string
  appointments: number
}

export function AppointmentChart() {
  const [data, setData] = useState<AppointmentData[]>([])
  const [loading, setLoading] = useState(true)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        setLoading(true)

        // Get 7-day period (last 7 days including today)
        const endDate = new Date()
        endDate.setHours(23, 59, 59, 999)
        const startDate = subDays(endDate, 6) // 6 days ago = 7 days total
        startDate.setHours(0, 0, 0, 0)

        const response = await fetch(
          `${apiBase}/admin/revenue?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch appointment data')
        }

        const result = await response.json()
        const appointments = result.data.appointments || []

        // Generate data for each day in the range
        const days = eachDayOfInterval({ start: startDate, end: endDate })

        // Create a map of appointment counts by date
        const appointmentsByDate: Record<string, number> = {}

        appointments.forEach((apt: any) => {
          const dateKey = format(new Date(apt.appointmentDate), 'yyyy-MM-dd')
          appointmentsByDate[dateKey] = (appointmentsByDate[dateKey] || 0) + 1
        })

        // Build chart data
        const chartData = days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const dateMidName = isToday
            ? `Hôm nay (${format(day, 'dd/MM')})`
            : format(day, 'dd/MM')

          return {
            name: dateMidName,
            date: dateMidName,
            appointments: appointmentsByDate[dateKey] || 0,
          }
        })

        setData(chartData)
      } catch (error) {
        console.error('Error fetching appointment data:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentData()
  }, [apiBase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Lịch hẹn 7 ngày qua</CardTitle>
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
        <CardTitle className="text-foreground">Lịch hẹn 7 ngày qua</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              height={80}
              angle={-45}
              textAnchor="end"
              tick={{ dy: 10 }}
              interval={0}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              formatter={(value: number) => [`${value}`, "Lịch hẹn"]}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "2px solid hsl(var(--accent))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
              cursor={{ fill: "hsl(var(--accent))", opacity: 0.2 }}
            />
            <Bar
              dataKey="appointments"
              fill="hsl(var(--accent))"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
