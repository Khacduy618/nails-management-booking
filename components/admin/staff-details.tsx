"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Edit, Phone, Mail, Calendar, Star, TrendingUp, Clock, DollarSign } from "lucide-react"

interface StaffDetailsProps {
  staff: any
  onClose: () => void
  onEdit: () => void
}

const daysOfWeek = [
  { key: "monday", label: "Thứ 2" },
  { key: "tuesday", label: "Thứ 3" },
  { key: "wednesday", label: "Thứ 4" },
  { key: "thursday", label: "Thứ 5" },
  { key: "friday", label: "Thứ 6" },
  { key: "saturday", label: "Thứ 7" },
  { key: "sunday", label: "Chủ nhật" },
]

export function StaffDetails({ staff, onClose, onEdit }: StaffDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Chi tiết nhân viên</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Staff Profile */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={staff.avatar || "/placeholder.svg"}
                alt={staff.name}
                onError={(e) => {
                  e.currentTarget.src = `/placeholder.svg?height=96&width=96&query=${encodeURIComponent(staff.name)}`
                }}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {staff.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">{staff.name}</h2>
                <Badge
                  className={
                    staff.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }
                >
                  {staff.status === "active" ? "Đang làm việc" : "Tạm nghỉ"}
                </Badge>
              </div>

              <p className="text-lg text-muted-foreground">{staff.position}</p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">{staff.rating}</span>
                  <span className="text-sm text-muted-foreground">đánh giá</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Kinh nghiệm: {staff.experience}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {staff.phone}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {staff.email}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{staff.totalAppointments}</div>
                <div className="text-sm text-muted-foreground">Tổng lịch hẹn</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <DollarSign className="h-8 w-8 text-accent" />
              <div>
                <div className="text-2xl font-bold text-foreground">{(staff.revenue / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-muted-foreground">Doanh thu (VNĐ)</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <TrendingUp className="h-8 w-8 text-secondary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{staff.rating}</div>
                <div className="text-sm text-muted-foreground">Điểm đánh giá</div>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Chuyên môn</h3>
            <div className="flex flex-wrap gap-2">
              {staff.specialties.map((specialty: string) => (
                <Badge key={specialty} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Work Schedule */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Lịch làm việc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {daysOfWeek.map((day) => {
                const schedule = staff.schedule[day.key as keyof typeof staff.schedule]
                const isWorking = schedule.start && schedule.end

                return (
                  <div key={day.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">{day.label}</span>
                    {isWorking ? (
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <Clock className="h-3 w-3" />
                        {schedule.start} - {schedule.end}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nghỉ</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Employment Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Thông tin công việc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Ngày vào làm</div>
                <div className="font-medium text-foreground">
                  {new Date(staff.joinDate).toLocaleDateString("vi-VN")}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Thời gian làm việc</div>
                <div className="font-medium text-foreground">
                  {Math.floor((Date.now() - new Date(staff.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} năm
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={onEdit} className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
