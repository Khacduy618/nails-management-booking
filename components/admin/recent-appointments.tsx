"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Phone } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"

interface Appointment {
  id: string
  customerName: string
  customerPhone: string
  serviceName: string
  appointmentTime: string
  appointmentDate: string
  status: string
  staffName: string
}

const statusColors = {
  completed: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary text-primary-foreground",
  "in-progress": "bg-accent text-accent-foreground",
  pending: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
}

const statusLabels = {
  completed: "Hoàn thành",
  confirmed: "Đã xác nhận",
  "in-progress": "Đang thực hiện",
  pending: "Chờ xác nhận",
  cancelled: "Đã hủy",
}

export function RecentAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

  useEffect(() => {
    const fetchRecentAppointments = async () => {
      try {
        setLoading(true)

        // Get today's appointments
        const today = new Date()
        const endDate = new Date()
        endDate.setHours(23, 59, 59, 999)

        const response = await fetch(
          `${apiBase}/admin/revenue?startDate=${format(today, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch appointments')
        }

        const result = await response.json()
        const allAppointments = result.data.appointments || []

        // Show only the first 5 recent appointments
        const recent = allAppointments.slice(0, 5)

        setAppointments(recent)
      } catch (error) {
        console.error('Error fetching recent appointments:', error)
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentAppointments()
  }, [apiBase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Lịch hẹn gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Lịch hẹn gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Không có lịch hẹn hôm nay
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Lịch hẹn gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {appointment.customerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="font-medium text-foreground">{appointment.customerName}</div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {appointment.customerPhone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appointment.appointmentTime || "N/A"}
                    </div>
                  </div>
                  <div className="text-sm text-foreground">
                    {appointment.serviceName || "N/A"} • {appointment.staffName || "N/A"}
                  </div>
                </div>
              </div>

              <Badge className={statusColors[appointment.status as keyof typeof statusColors] || statusColors.pending}>
                {statusLabels[appointment.status as keyof typeof statusLabels] || "Chờ xác nhận"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
