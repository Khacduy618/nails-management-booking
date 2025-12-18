"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, User, CheckCircle, AlertCircle, ArrowLeft, Search } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect, useMemo } from "react"
import { format, isBefore, startOfToday, setHours, setMinutes } from "date-fns"
import { vi } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { validateBookingForm, validatePhone, validateEmail } from "@/lib/form-validation"

// --- Định nghĩa các kiểu dữ liệu ---
interface ApiService { id: number; name: string; description: string | null; price: string; duration: number; }
interface ApiStaff { id: number; name: string; }

const stepLabels = ["Dịch vụ", "Ngày & Giờ", "Nhân viên", "Thông tin"];
const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

interface BookingFormProps {
  onBookingComplete?: () => void; // Thêm prop callback, '?' để nó là optional
}

export function BookingForm({ onBookingComplete }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [allServices, setAllServices] = useState<ApiService[]>([]);
  const [availableStaff, setAvailableStaff] = useState<ApiStaff[]>([]);

  const [selectedServices, setSelectedServices] = useState<ApiService[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const [availabilityInfo, setAvailabilityInfo] = useState<string | null>(null);

  // User info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/';

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}services?limit=100`);
        if (!res.ok) throw new Error("Could not fetch services.");
        const data = await res.json();
        setAllServices(data.data || []);
      } catch (e: any) { setError(e.message); }
      finally { setIsLoading(false); }
    }
    fetchInitialData();
  }, []);


  const filteredServices = useMemo(() => {
    if (!searchTerm) return allServices;
    return allServices.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allServices, searchTerm]);

  const totalDuration = useMemo(() => selectedServices.reduce((sum, s) => sum + s.duration, 0), [selectedServices]);
  const totalPrice = useMemo(() => selectedServices.reduce((sum, s) => sum + Number(s.price), 0), [selectedServices]);
  const assignedStaff = useMemo(() => {
    return autoAssign ? availableStaff[0] : availableStaff.find(staff => staff.id === selectedStaffId);
  }, [autoAssign, availableStaff, selectedStaffId]);
  const canProceedToInfo = autoAssign ? availableStaff.length > 0 : Boolean(selectedStaffId);

  const handleServiceToggle = (service: ApiService, checked: boolean) => {
    setError("");
    if (checked) {
      setSelectedServices(prev => [...prev, service]);
    } else {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    }
  };

  const handleNextToDateTime = () => {
    if (selectedServices.length === 0) {
      setError("Vui lòng chọn ít nhất một dịch vụ.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);
    if (!selectedDate) return;

    setIsLoading(true);
    setError("");
    setAvailabilityInfo(null);
    try {
      const serviceIds = selectedServices.map(s => s.id).join(',');
      const date = format(selectedDate, "yyyy-MM-dd");

      // Gọi API tìm nhân viên rảnh
      const res = await fetch(`${apiUrl}staff/available?serviceIds=${serviceIds}&date=${date}&time=${time}`);
      if (!res.ok) throw new Error("Lỗi khi tìm nhân viên.");

      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || "Không thể lấy lịch trống");
        setAvailableStaff([]);
      } else if (data.staff.length === 0) {
        setError(`Rất tiếc, không có nhân viên nào rảnh vào lúc ${time} ngày ${date} để thực hiện các dịch vụ đã chọn.`);
        setAvailabilityInfo(`Không có nhân viên rảnh lúc ${time}.`);
        setAvailableStaff([]);
      } else {
        setAvailableStaff(data.staff);
        setAvailabilityInfo(`${data.staff.length} nhân viên rảnh vào ${time} ngày ${date}`);
      }
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  };

  const handleNextToStaff = () => {
    if (!selectedDate || !selectedTime) {
      setError("Vui lòng chọn ngày và giờ.");
      return;
    }
    if (availableStaff.length === 0 && !isLoading) {
      setError("Vui lòng chọn một khung giờ khác có nhân viên phục vụ.");
      return;
    }
    setError("");
    setSelectedStaffId(null);
    setAutoAssign(true);
    setStep(3);
  }
  const isTimeSlotDisabled = (time: string): boolean => {
    if (!selectedDate) return true;
    const [hours, minutes] = time.split(':').map(Number);
    const slotDateTime = setMinutes(setHours(selectedDate, hours), minutes);
    return isBefore(slotDateTime, new Date());
  };

  const handleSubmit = async () => {
    // Validate using centralized validation
    const validation = validateBookingForm({
      customerName,
      customerPhone,
      customerEmail,
      notes,
    })

    if (!validation.valid) {
      setError(validation.error || 'Dữ liệu không hợp lệ')
      return
    }

    // Additional checks
    if (selectedServices.length === 0 || !selectedDate || !selectedTime) {
      setError("Vui lòng điền đầy đủ thông tin.")
      return
    }

    const finalStaffId = autoAssign ? availableStaff[0]?.id ?? null : selectedStaffId
    if (!finalStaffId) {
      setError("Không tìm thấy nhân viên phù hợp cho khung giờ này.")
      return
    }
    setIsLoading(true);
    setError("");
    try {
      const appointmentData = {
        serviceIds: selectedServices.map(s => s.id),
        customerName,
        customerPhone: customerPhone.replace(/\s/g, ""),
        customerEmail: customerEmail || undefined,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        staffId: finalStaffId,
        notes,
      };
      const response = await fetch(`${apiUrl}appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Lỗi khi đặt lịch.");
      setSuccess(true);
      setStep(5);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
    finally { setIsLoading(false); }
  };

  const resetForm = () => {

    if (onBookingComplete) {
      onBookingComplete();
    } else {
      // Reset tất cả các state về giá trị ban đầu
      setStep(1);
      setIsLoading(false);
      setError("");
      setSuccess(false);

      // Reset data đã fetch (tùy chọn, nhưng nên có để logic nhất quán)
      setAvailableStaff([]);

      // Reset các lựa chọn của người dùng
      setSelectedServices([]);
      setSelectedStaffId(null);
      setSelectedDate(undefined);
      setSelectedTime("");

      // Reset thông tin người dùng
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
      setAutoAssign(true);
      setAvailabilityInfo(null);

      // Reset UI state
      setSearchTerm("");
    }
  };

  const goBack = (toStep: number) => { setError(""); setStep(toStep); };

  if (success) {
    const staffMember = availableStaff.find(s => s.id === selectedStaffId);
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Đặt lịch thành công!</h2>
          <p className="text-muted-foreground mb-6">Lịch hẹn của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ để xác nhận sớm nhất.</p>
          <div className="space-y-2 text-sm bg-muted p-4 rounded-lg mb-6 text-left">
            <div><strong>Dịch vụ:</strong> {selectedServices.map(s => s.name).join(', ')}</div>
            <div><strong>Ngày:</strong> {selectedDate && format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}</div>
            <div><strong>Giờ:</strong> {selectedTime}</div>
            <div><strong>Nhân viên:</strong> {availableStaff.find(s => s.id === selectedStaffId)?.name}</div>
            <div><strong>Khách hàng:</strong> {customerName}</div>
            <div><strong>SĐT:</strong> {customerPhone}</div>
            {customerEmail && <div><strong>Email:</strong> {customerEmail}</div>}
            <div><strong>Tổng tiền:</strong> {totalPrice.toLocaleString("vi-VN")}đ</div>
          </div>
          <Button onClick={resetForm}>
            {onBookingComplete ? "Đóng" : "Đặt lịch mới"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {stepLabels.map((_, index) => {
              const stepNum = index + 1;
              return (
                <div key={stepNum} className="flex items-center w-full">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${step >= stepNum ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{stepNum}</div>
                  {stepNum < stepLabels.length && <div className={`h-0.5 w-full ${step > stepNum ? "bg-primary" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>
          <div className="hidden md:flex justify-between mt-2 text-xs text-muted-foreground px-1">
            {stepLabels.map((label) => (<span key={label} style={{ width: `${100 / stepLabels.length}%` }} className="text-center">{label}</span>))}
          </div>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Step 1: Chọn Dịch vụ */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Bước 1: Chọn Dịch vụ</CardTitle>
            <CardDescription>Bạn có thể chọn một hoặc nhiều dịch vụ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm dịch vụ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            {selectedServices.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="text-sm text-primary px-2 py-4 mr-2"
                  onClick={() => setSelectedServices([])} // <-- Logic chính là ở đây
                >
                  Hủy chọn tất cả
                </Button>
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
              {isLoading && [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              {!isLoading && filteredServices.map((service) => (
                <div key={service.id}>
                  <Label
                    htmlFor={`service-${service.id}`}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedServices.some(s => s.id === service.id) ? 'bg-muted/80 ring-2 ring-primary' : 'bg-card'}`}
                  >
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={selectedServices.some(s => s.id === service.id)}
                      onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                      className="mr-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.duration} phút</p>
                    </div>
                    <p className="font-semibold text-primary text-lg ml-4">
                      {Number(service.price).toLocaleString("vi-VN")}đ
                    </p>
                  </Label>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-end items-baseline space-x-4">
              <p className="text-sm text-muted-foreground">
                Tổng cộng: <span className="font-bold text-foreground">{selectedServices.length} dịch vụ</span>
              </p>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Thành tiền:</span>
                <p className="text-2xl font-bold text-primary">
                  {totalPrice.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>

            <Button onClick={handleNextToDateTime} disabled={isLoading || selectedServices.length === 0} className="w-full">
              Chọn Ngày & Giờ
            </Button>
          </CardContent>
        </Card>
      )}

      {/* {step === 2 && <Card>
        <CardHeader><div className="flex justify-between"><div><CardTitle>Bước 2: Chọn Nhân viên</CardTitle><CardDescription>Nhân viên có thể thực hiện tất cả dịch vụ đã chọn</CardDescription></div><Button variant="ghost" size="icon" onClick={() => goBack(1)}><ArrowLeft /></Button></div></CardHeader>
        <CardContent className="space-y-2">{isLoading ? <Skeleton className="h-12 w-full" /> : availableStaff.map((staff) => (<div key={staff.id} onClick={() => setSelectedStaffId(staff.id)} className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${selectedStaffId === staff.id ? 'bg-muted ring-2 ring-primary' : ''}`}><div className="flex items-center space-x-3"><User className="h-5 w-5" /><span className="font-medium">{staff.name}</span></div></div>))}<Button onClick={() => setStep(3)} disabled={!selectedStaffId} className="w-full mt-4">Tiếp tục</Button></CardContent>
      </Card>}

      {step === 3 && <Card>
        <CardHeader><div className="flex justify-between"><div><CardTitle>Bước 3: Chọn Ngày & Giờ</CardTitle></div><Button variant="ghost" size="icon" onClick={() => goBack(2)}><ArrowLeft /></Button></div></CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-start"><CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => isBefore(date, startOfToday())} className="rounded-md border" />
          <div className="flex-1 w-full max-h-[300px] overflow-y-auto pr-2">
            {selectedDate ? (<><p className="font-medium mb-2 text-center">{format(selectedDate, "dd/MM/yyyy")}</p><div className="grid grid-cols-3 gap-2">{timeSlots.map((time) => (<Button key={time} variant={selectedTime === time ? "default" : "outline"} onClick={() => setSelectedTime(time)} disabled={isTimeSlotDisabled(time)}>{time}</Button>))}</div></>) : <p className="text-center text-muted-foreground pt-4">Vui lòng chọn ngày</p>}
          </div>
        </CardContent>
        <div className="p-6 pt-0"><Button onClick={() => setStep(4)} disabled={!selectedDate || !selectedTime} className="w-full">Tiếp tục</Button></div>
      </Card>}
       */}

      {/* Step 2: Chọn Ngày & Giờ */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div><CardTitle>Bước 2: Chọn Ngày & Giờ</CardTitle></div>
              <Button variant="ghost" size="icon" onClick={() => goBack(1)}><ArrowLeft /></Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-start">
            <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => isBefore(date, startOfToday())} className="rounded-md border" />
            <div className="flex-1 w-full max-h-[300px] overflow-y-auto pr-2">
              <p className="font-medium mb-2 text-center">{selectedDate ? `Các khung giờ cho ${format(selectedDate, "dd/MM/yyyy")}` : "Vui lòng chọn ngày"}</p>
              {selectedDate && <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    disabled={isTimeSlotDisabled(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>}
              {availabilityInfo && (
                <p className="text-sm text-muted-foreground mt-3 text-center">{availabilityInfo}</p>
              )}
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button onClick={handleNextToStaff} disabled={!selectedDate || !selectedTime || isLoading} className="w-full">
              {isLoading ? "Đang tìm nhân viên..." : "Chọn Nhân viên"}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Chọn Nhân viên */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div><CardTitle>Bước 3: Chọn Nhân viên</CardTitle><CardDescription>Các nhân viên có sẵn vào lúc {selectedTime} {selectedDate && format(selectedDate, 'dd/MM/yyyy')}</CardDescription></div>
              <Button variant="ghost" size="icon" onClick={() => goBack(2)}><ArrowLeft /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Tự động phân công nhân viên</p>
                <p className="text-sm text-muted-foreground">Hệ thống sẽ chọn nhân viên rảnh phù hợp nhất.</p>
              </div>
              <Switch
                checked={autoAssign}
                onCheckedChange={(value) => {
                  setAutoAssign(value);
                  if (value) setSelectedStaffId(null);
                }}
              />
            </div>
            {isLoading && <Skeleton className="h-12 w-full" />}
            {!isLoading && availableStaff.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có nhân viên nào rảnh cho khung giờ này.</p>
            )}
            {!isLoading && availableStaff.map((staffMember) => (
              <div
                key={staffMember.id}
                onClick={() => {
                  if (autoAssign) return;
                  setSelectedStaffId(staffMember.id);
                }}
                className={`p-4 border rounded-lg ${autoAssign ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-muted/50'} ${selectedStaffId === staffMember.id ? 'bg-muted ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center space-x-3"><User /><span className="font-medium">{staffMember.name}</span></div>
              </div>
            ))}
            <Button onClick={() => setStep(4)} disabled={!canProceedToInfo} className="w-full mt-4">
              Điền thông tin
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 4 && <Card>
        <CardHeader><div className="flex justify-between"><div><CardTitle>Bước 4: Thông tin khách hàng</CardTitle></div><Button variant="ghost" size="icon" onClick={() => goBack(3)}><ArrowLeft /></Button></div></CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h3 className="font-medium">Tóm tắt đặt lịch</h3>
            <div className="text-sm space-y-1">
              <div><strong>Dịch vụ:</strong> {selectedServices.map(s => s.name).join(', ')}</div>
              <div><strong>Nhân viên:</strong> {assignedStaff?.name || (autoAssign ? 'Sẽ tự động phân công' : 'Chưa chọn')}</div>
              <div><strong>Ngày & Giờ:</strong> {selectedDate && `${format(selectedDate, "dd/MM/yyyy")} lúc ${selectedTime}`}</div>
              <div><strong>Tổng thời gian:</strong> {totalDuration} phút</div>
              <div><strong>Tổng tiền:</strong> {totalPrice.toLocaleString("vi-VN")}đ</div>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Họ và tên *</Label>
              <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input id="phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">{isLoading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}</Button>
        </CardContent>
      </Card>}
    </div>
  )
}
