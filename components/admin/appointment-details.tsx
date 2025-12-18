"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Edit, Calendar, Clock, Phone, User, DollarSign, FileText } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ApiAppointment, AppointmentStatus } from "@/types";


interface AppointmentDetailsProps {
  appointment: ApiAppointment | null;
  onClose: () => void;
  onUpdateStatus: () => void;
}

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800 border-blue-200" },
  'in-progress': { label: "Đang làm", color: "bg-green-100 text-green-800 border-green-200" },
  completed: { label: "Hoàn thành", color: "bg-gray-100 text-gray-800 border-gray-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200" },
};

export function AppointmentDetails({ appointment, onClose, onUpdateStatus }: AppointmentDetailsProps) {
  if (!appointment) return null;

  const serviceNames = appointment.appointmentServices.map(as => as.service.name).join(' + ');
  const staffNames = [...new Set(appointment.appointmentServices.map(as => as.staff?.name).filter(Boolean))].join(', ');
  const config = statusConfig[appointment.status];
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Chi tiết lịch hẹn #{appointment.id}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>

        <CardContent className="space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold">Trạng thái</h3>
            {config ? (
              <Badge className={config.color}>{config.label}</Badge>
            ) : (
              <Badge variant="secondary">{appointment.status}</Badge>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Thông tin khách hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBox icon={User} label="Tên khách hàng" value={appointment.customerName} />
              <InfoBox icon={Phone} label="Số điện thoại" value={appointment.customerPhone} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Thông tin dịch vụ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBox icon={FileText} label="Dịch vụ" value={serviceNames} />
              <InfoBox icon={User} label="Nhân viên" value={staffNames} />
              <InfoBox icon={Clock} label="Tổng thời gian" value={`${appointment.durationAtBooking} phút`} />
              <InfoBox icon={DollarSign} label="Tổng giá" value={`${Number(appointment.priceAtBooking).toLocaleString("vi-VN")}₫`} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Thời gian hẹn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBox icon={Calendar} label="Ngày hẹn" value={format(new Date(appointment.appointmentDate), "EEEE, dd/MM/yyyy", { locale: vi })} />
              <InfoBox icon={Clock} label="Giờ hẹn" value={appointment.appointmentTime.substring(0, 5)} />
            </div>
          </div>

          {appointment.notes && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Ghi chú</h3>
              <p className="p-3 bg-muted rounded-lg text-sm">{appointment.notes}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-right">
            Đặt lúc: {format(new Date(appointment.createdAt), "HH:mm, dd/MM/yyyy")}
          </div>

          <div className="flex gap-2 pt-4 border-t justify-end">
            <Button variant="outline" onClick={onClose}>Đóng</Button>
            <Button onClick={onUpdateStatus}><Edit className="h-4 w-4 mr-2" />Cập nhật trạng thái</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component con để hiển thị thông tin
function InfoBox({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}