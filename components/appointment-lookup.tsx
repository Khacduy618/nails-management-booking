"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Trash2, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// --- Định nghĩa kiểu dữ liệu ---
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "in-progress";

// Kiểu dữ liệu cho một lịch hẹn nhận từ API (chỉ hiển thị ngày, giờ, trạng thái)
interface Appointment {
  id: number;
  date: string; // "yyyy-MM-dd"
  time: string; // "HH:mm:ss"
  status: AppointmentStatus;
}

const statusConfig: Record<AppointmentStatus, { label: string; variant: "secondary" | "default" | "outline" | "destructive"; icon: React.ElementType }> = {
  pending: { label: "Chờ xác nhận", variant: "secondary", icon: AlertCircle },
  confirmed: { label: "Đã xác nhận", variant: "default", icon: CheckCircle },
  completed: { label: "Hoàn thành", variant: "outline", icon: CheckCircle },
  cancelled: { label: "Đã hủy", variant: "destructive", icon: XCircle },
  'in-progress': { label: "Đang thực hiện", variant: "default", icon: Clock }, // Thêm trạng thái mới
};

export function AppointmentLookup() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState<number | null>(null); // State để biết đang hủy lịch nào
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!phoneNumber.trim() || !/^[0-9]{10,11}$/.test(phoneNumber.replace(/\s/g, ""))) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}appointments?phone=${phoneNumber.replace(/\s/g, "")}`);

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "Không thể tra cứu lịch hẹn.");
      }

      setAppointments(result.data);
      setHasSearched(true);
      if (result.data.length > 0) {
        toast.success(`Đã tìm thấy ${result.data.length} lịch hẹn.`); // Thông báo thành công
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);  // Thông báo lỗi
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    // if (!confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) return;

    setIsCancelling(appointmentId);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const sanitized = phoneNumber.replace(/\D/g, "");
      const res = await fetch(`${apiUrl}appointments/${appointmentId}?phone=${encodeURIComponent(sanitized)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "Không thể hủy lịch hẹn.");
      }

      // Cập nhật lại trạng thái của lịch hẹn trong danh sách
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt)),
      );
      toast.success("Hủy lịch hẹn thành công!"); // Hiển thị thông báo
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsCancelling(null);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  const canCancelAppointment = (appointment: Appointment) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    // Chênh lệch tính bằng giờ
    const hoursDiff = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Chỉ cho hủy khi lịch chưa diễn ra và còn hơn 2 tiếng nữa mới tới giờ hẹn
    return ['confirmed', 'pending'].includes(appointment.status) && hoursDiff > 2;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Search /><span>Tra cứu lịch hẹn</span></CardTitle>
          <CardDescription>Nhập số điện thoại để kiểm tra lịch hẹn của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <div className="flex space-x-2">
              <Input id="phone" type="tel" placeholder="Nhập số điện thoại" value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">{isLoading ? "Đang tìm..." : "Tra cứu"}</span>
              </Button>
            </div>
          </div>
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">Không tìm thấy lịch hẹn</h3><p className="text-muted-foreground">Không có lịch hẹn nào được tìm thấy với số điện thoại này.</p></CardContent></Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Tìm thấy {appointments.length} lịch hẹn</h2>
              </div>

              {appointments.map((appointment) => {
                const config = statusConfig[appointment.status];
                const StatusIcon = config.icon;
                return (
                  <Card key={appointment.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">Lịch hẹn #{appointment.id}</CardTitle>
                          <Badge variant={config.variant}><StatusIcon className="h-3 w-3 mr-1.5" />{config.label}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{formatDate(appointment.date)}</span></div>
                        <div className="flex items-center space-x-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>{appointment.time.substring(0, 5)}</span></div>
                      </div>
                      {canCancelAppointment(appointment) && (<><Separator /><div className="flex justify-end">
                        <ConfirmDialog
                          title="Xác nhận hủy lịch hẹn?"
                          description="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn hủy lịch hẹn này không?"
                          onConfirm={() => handleCancelAppointment(appointment.id)}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isCancelling === appointment.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {isCancelling === appointment.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            {isCancelling === appointment.id ? "Đang hủy..." : "Hủy lịch hẹn"}
                          </Button>
                        </ConfirmDialog>
                      </div></>)}
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Lưu ý quan trọng</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Chỉ có thể hủy lịch hẹn trước 2 giờ so với thời gian đặt</li>
                <li>• Liên hệ trực tiếp với cửa hàng nếu cần thay đổi lịch hẹn</li>
                <li>• Vui lòng đến đúng giờ để đảm bảo chất lượng dịch vụ</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
