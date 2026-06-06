"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Trash2, Loader2, Star, Sparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { OTPVerificationDialog } from "@/components/otp-verification-dialog"

// --- Định nghĩa kiểu dữ liệu ---
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "in-progress";

// Kiểu dữ liệu cho một lịch hẹn nhận từ API (chỉ hiển thị ngày, giờ, trạng thái)
interface Appointment {
  id: number;
  date: string; // "yyyy-MM-dd"
  time: string; // "HH:mm:ss"
  status: AppointmentStatus;
  durationAtBooking: number;
  reviewToken: string | null;
  staffId: number | null;
  staffName: string;
  review: { rating: number; comment?: string } | null;
}

const statusConfig: Record<AppointmentStatus, { label: string; variant: "secondary" | "default" | "outline" | "destructive"; icon: React.ElementType }> = {
  pending: { label: "Chờ xác nhận", variant: "secondary", icon: AlertCircle },
  confirmed: { label: "Đã xác nhận", variant: "default", icon: CheckCircle },
  completed: { label: "Hoàn thành", variant: "outline", icon: CheckCircle },
  cancelled: { label: "Đã hủy", variant: "destructive", icon: XCircle },
  'in-progress': { label: "Đang thực hiện", variant: "default", icon: Clock }, // Thêm trạng thái mới
};

const getRecaptchaToken = async (): Promise<string | null> => {
  if (typeof window === "undefined" || !(window as any).grecaptcha) {
    console.warn("reCAPTCHA not loaded yet")
    return null
  }
  return new Promise((resolve) => {
    (window as any).grecaptcha.ready(async () => {
      try {
        const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
        if (!siteKey) {
          console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not configured")
          resolve(null)
          return
        }
        const token = await (window as any).grecaptcha.execute(siteKey, {
          action: "cancel_appointment",
        })
        resolve(token)
      } catch (err) {
        console.error("Error executing reCAPTCHA:", err)
        resolve(null)
      }
    })
  })
}

export function AppointmentLookup() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState("")
  const [otpDialogOpen, setOtpDialogOpen] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [isLoadingOTP, setIsLoadingOTP] = useState(false)
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null)

  const handleSendReviewEmail = async (appointmentId: number) => {
    setSendingEmailId(appointmentId)
    try {
      const res = await fetch("/api/reviews/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "Không thể gửi email đánh giá.")
      }

      toast.success("Liên kết đánh giá đã được gửi tới Email của bạn.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSendingEmailId(null)
    }
  }

  const handleSearch = async () => {
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, "")
    if (!phoneNumber.trim() || !/^\+?[0-9]{9,15}$/.test(cleanedPhone)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(false);

    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')
      const res = await fetch(`${apiBase}/appointments?phone=${encodeURIComponent(cleanedPhone)}`)

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
    setSelectedAppointmentId(appointmentId)
    setIsLoadingOTP(true)
    setError("")

    try {
      const recaptchaToken = await getRecaptchaToken()

      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          phone: phoneNumber,
          recaptchaToken,
        }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "Không thể gửi mã OTP")
      }

      toast.success("Mã OTP đã được gửi đến số điện thoại của bạn")
      setOtpDialogOpen(true)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoadingOTP(false)
    }
  }

  const handleOTPVerified = () => {
    if (selectedAppointmentId) {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === selectedAppointmentId ? { ...apt, status: "cancelled" } : apt
        )
      )
      setSelectedAppointmentId(null)
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

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardContent className="py-2">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Lưu ý quan trọng</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Chỉ có thể hủy lịch hẹn trước 2 giờ so với thời gian đặt</li>
                <li>• Hủy lịch hẹn cần xác thực bằng mã OTP được gửi tới số điện thoại</li>
                <li>• Liên hệ trực tiếp với cửa hàng nếu cần thay đổi lịch hẹn</li>
                <li>• Vui lòng đến đúng giờ để đảm bảo chất lượng dịch vụ</li>
              </ul>
            </div>
          </div>
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
                  <Card key={appointment.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Header: ID and Status */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-base">Lịch hẹn • {phoneNumber.slice(-4)}</h3>
                          </div>
                          <Badge variant={config.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Ngày</p>
                              <p className="text-sm font-semibold">{formatDate(appointment.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Giờ</p>
                              <p className="text-sm font-semibold">{appointment.time.substring(0, 5)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Cancel Button */}
                        {canCancelAppointment(appointment) && (
                          <ConfirmDialog
                            title="Xác nhận hủy lịch hẹn?"
                            description="Bạn sẽ nhận được mã OTP để xác thực hủy lịch hẹn này. Hành động không thể hoàn tác."
                            onConfirm={() => handleCancelAppointment(appointment.id)}
                          >
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isLoadingOTP}
                              className="w-full"
                            >
                              {isLoadingOTP ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Đang gửi OTP...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hủy lịch hẹn
                                </>
                              )}
                            </Button>
                          </ConfirmDialog>
                        )}

                        {/* Review Section */}
                        {appointment.status === "completed" && (
                          <div className="mt-4 pt-4 border-t border-dashed space-y-3">
                            {appointment.review ? (
                              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-primary flex items-center gap-1">
                                    <Sparkles className="h-4 w-4" />
                                    Đánh giá của bạn:
                                  </span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= appointment.review!.rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-muted-foreground/30"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {appointment.review.comment && (
                                  <p className="text-xs text-muted-foreground italic bg-background p-2.5 rounded border border-dashed truncate">
                                    "{appointment.review.comment}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-xs text-muted-foreground">
                                    Nhân viên: <strong className="text-foreground">{appointment.staffName}</strong>
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Lịch hẹn đã hoàn thành. Hãy đánh giá nhân viên phục vụ của bạn để chúng tôi cải thiện chất lượng dịch vụ.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-primary border-primary/30 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                                  onClick={() => handleSendReviewEmail(appointment.id)}
                                  disabled={sendingEmailId === appointment.id}
                                >
                                  {sendingEmailId === appointment.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Đang gửi email...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      Gửi liên kết đánh giá qua Email
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>
      )}

      

      {/* OTP Verification Dialog */}
      {selectedAppointmentId && (
        <OTPVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          appointmentId={selectedAppointmentId}
          phone={phoneNumber}
          onVerified={handleOTPVerified}
          isLoadingOTP={isLoadingOTP}
        />
      )}
    </div>
  )
}
