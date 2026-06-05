"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, User, CheckCircle, AlertCircle, ArrowLeft, Search, Star } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useEffect, useMemo, useReducer } from "react"
import { format, isBefore, startOfToday, setHours, setMinutes } from "date-fns"
import { vi } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { validateBookingForm, validatePhone, validateEmail } from "@/lib/form-validation"
import { bookingReducer, initialState } from "@/lib/booking-reducer"

// --- Định nghĩa các kiểu dữ liệu ---
interface ApiService { id: number; name: string; description: string | null; price: string; duration: number; }
interface ApiStaff { id: number; name: string; rating?: number; appointmentCount?: number; appointment_count_today?: number; }

const stepLabels = ["Dịch vụ", "Ngày & Giờ", "Nhân viên", "Thông tin"];
const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

interface BookingFormProps {
  onBookingComplete?: () => void; // Thêm prop callback, '?' để nó là optional
}

export function BookingForm({ onBookingComplete }: BookingFormProps) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const {
    step,
    isLoading,
    error,
    success,
    allServices,
    availableStaff,
    selectedServices,
    selectedDate,
    selectedTime,
    selectedStaffId,
    autoAssign,
    availabilityInfo,
    customerName,
    customerPhone,
    customerEmail,
    notes,
    searchTerm,
  } = state;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/';

  useEffect(() => {
    async function fetchInitialData() {
      dispatch({ type: "SET_IS_LOADING", payload: true });
      try {
        const res = await fetch(`${apiUrl}services?limit=100`);
        if (!res.ok) throw new Error("Could not fetch services.");
        const data = await res.json();
        dispatch({ type: "SET_ALL_SERVICES", payload: data.data || [] });
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
      } finally {
        dispatch({ type: "SET_IS_LOADING", payload: false });
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (allServices.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const serviceIdParam = params.get("serviceId");
      if (serviceIdParam) {
        const targetId = parseInt(serviceIdParam, 10);
        const selected = allServices.find(s => s.id === targetId);
        if (selected) {
          dispatch({ type: "SET_SELECTED_SERVICES", payload: [selected] });
          // Tự động chuyển sang bước chọn Ngày & Giờ để tối ưu trải nghiệm
          dispatch({ type: "SET_STEP", payload: 2 });
        }
      }
    }
  }, [allServices]);


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
    dispatch({ type: "SET_ERROR", payload: "" });
    dispatch({ type: "TOGGLE_SERVICE", payload: { service, checked } });
  };

  const handleNextToDateTime = () => {
    if (selectedServices.length === 0) {
      dispatch({ type: "SET_ERROR", payload: "Vui lòng chọn ít nhất một dịch vụ." });
      return;
    }
    dispatch({ type: "SET_ERROR", payload: "" });
    dispatch({ type: "SET_STEP", payload: 2 });
  };

  const handleTimeSelect = async (time: string) => {
    dispatch({ type: "SET_SELECTED_TIME", payload: time });
    if (!selectedDate) return;

    dispatch({ type: "SET_IS_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: "" });
    dispatch({ type: "SET_AVAILABILITY_INFO", payload: null });
    try {
      const serviceIds = selectedServices.map(s => s.id).join(',');
      const date = format(selectedDate, "yyyy-MM-dd");

      // Gọi API tìm nhân viên rảnh
      const res = await fetch(`${apiUrl}staff/available?serviceIds=${serviceIds}&date=${date}&time=${time}`);
      if (!res.ok) throw new Error("Lỗi khi tìm nhân viên.");

      const data = await res.json();
      if (!data.success) {
        dispatch({ type: "SET_ERROR", payload: data.error?.message || "Không thể lấy lịch trống" });
        dispatch({ type: "SET_AVAILABLE_STAFF", payload: [] });
      } else if (data.staff.length === 0) {
        dispatch({
          type: "SET_ERROR",
          payload: `Rất tiếc, không có nhân viên nào rảnh vào lúc ${time} ngày ${date} để thực hiện các dịch vụ đã chọn.`
        });
        dispatch({ type: "SET_AVAILABILITY_INFO", payload: `Không có nhân viên rảnh lúc ${time}.` });
        dispatch({ type: "SET_AVAILABLE_STAFF", payload: [] });
      } else {
        dispatch({ type: "SET_AVAILABLE_STAFF", payload: data.staff });
        dispatch({ type: "SET_AVAILABILITY_INFO", payload: `${data.staff.length} nhân viên rảnh vào ${time} ngày ${date}` });
      }
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e.message });
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  const handleNextToStaff = () => {
    if (!selectedDate || !selectedTime) {
      dispatch({ type: "SET_ERROR", payload: "Vui lòng chọn ngày và giờ." });
      return;
    }
    if (availableStaff.length === 0 && !isLoading) {
      dispatch({ type: "SET_ERROR", payload: "Vui lòng chọn một khung giờ khác có nhân viên phục vụ." });
      return;
    }
    dispatch({ type: "SET_ERROR", payload: "" });
    dispatch({ type: "SET_SELECTED_STAFF_ID", payload: null });
    dispatch({ type: "SET_AUTO_ASSIGN", payload: true });
    dispatch({ type: "SET_STEP", payload: 3 });
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
      dispatch({ type: "SET_ERROR", payload: validation.error || 'Dữ liệu không hợp lệ' });
      return
    }

    // Additional checks
    if (selectedServices.length === 0 || !selectedDate || !selectedTime) {
      dispatch({ type: "SET_ERROR", payload: "Vui lòng điền đầy đủ thông tin." });
      return
    }

    const finalStaffId = autoAssign ? availableStaff[0]?.id ?? null : selectedStaffId
    if (!finalStaffId) {
      dispatch({ type: "SET_ERROR", payload: "Không tìm thấy nhân viên phù hợp cho khung giờ này." });
      return
    }
    dispatch({ type: "SET_IS_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: "" });
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
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(appointmentData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Lỗi khi đặt lịch.");
      dispatch({ type: "SET_SUCCESS", payload: true });
      dispatch({ type: "SET_STEP", payload: 5 });
    } catch (err: any) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      toast.error(err.message);
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  const resetForm = () => {
    if (onBookingComplete) {
      onBookingComplete();
    } else {
      dispatch({ type: "RESET" });
    }
  };

  const goBack = (toStep: number) => {
    dispatch({ type: "SET_ERROR", payload: "" });
    dispatch({ type: "SET_STEP", payload: toStep });
  };

  if (success) {
    const staffName = assignedStaff?.name || (autoAssign ? "Đã tự động phân công" : "Chưa chọn");
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
            <div><strong>Nhân viên:</strong> {staffName}</div>
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
              <Input placeholder="Tìm dịch vụ..." value={searchTerm} onChange={(e) => dispatch({ type: "SET_SEARCH_TERM", payload: e.target.value })} className="pl-10" />
            </div>

            {selectedServices.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="text-sm text-primary px-2 py-4 mr-2"
                  onClick={() => dispatch({ type: "CLEAR_SELECTED_SERVICES" })} // <-- Logic chính là ở đây
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
            <CalendarComponent mode="single" selected={selectedDate} onSelect={(date) => dispatch({ type: "SET_SELECTED_DATE", payload: date })} disabled={(date) => isBefore(date, startOfToday())} className="rounded-md border" />
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
                  dispatch({ type: "SET_AUTO_ASSIGN", payload: value });
                  if (value) dispatch({ type: "SET_SELECTED_STAFF_ID", payload: null });
                }}
              />
            </div>
            {isLoading && <Skeleton className="h-12 w-full" />}
            {!isLoading && availableStaff.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có nhân viên nào rảnh cho khung giờ này.</p>
            )}
            {!isLoading && availableStaff.map((staffMember, index) => {
              const isAssigned = autoAssign ? index === 0 : selectedStaffId === staffMember.id;
              return (
                <div
                  key={staffMember.id}
                  onClick={() => {
                    if (autoAssign) return;
                    dispatch({ type: "SET_SELECTED_STAFF_ID", payload: staffMember.id });
                  }}
                  className={`p-4 border rounded-lg flex items-center justify-between transition-all ${
                    autoAssign
                      ? index === 0
                        ? 'bg-muted ring-2 ring-primary border-primary/50'
                        : 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-muted/50'
                  } ${
                    !autoAssign && selectedStaffId === staffMember.id
                      ? 'bg-muted ring-2 ring-primary'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{staffMember.name}</span>
                      {autoAssign && index === 0 && (
                        <span className="text-xs text-primary font-medium mt-0.5">Tự động chọn (Phù hợp nhất)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {staffMember.rating !== undefined && staffMember.rating > 0 && (
                      <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50 text-xs font-semibold">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>{staffMember.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <Button onClick={() => dispatch({ type: "SET_STEP", payload: 4 })} disabled={!canProceedToInfo} className="w-full mt-4">
              Điền thông tin
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 4 && <Card>
        <CardHeader><div className="flex justify-between"><div><CardTitle>Bước 4: Thông tin khách hàng</CardTitle></div><Button variant="ghost" size="icon" onClick={() => goBack(3)}><ArrowLeft /></Button></div></CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg space-y-2">
            <h3 className="font-bold">Tóm tắt đặt lịch</h3>
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
              <Input className="mt-2" id="name" value={customerName} onChange={(e) => dispatch({ type: "SET_CUSTOMER_NAME", payload: e.target.value })} placeholder="Ví dụ: nguyen khac duy" />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input className="mt-2" id="phone" type="tel" value={customerPhone} onChange={(e) => dispatch({ type: "SET_CUSTOMER_PHONE", payload: e.target.value })} placeholder="Ví dụ: 0932105214" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input className="mt-2" id="email" type="email" value={customerEmail} onChange={(e) => dispatch({ type: "SET_CUSTOMER_EMAIL", payload: e.target.value })} placeholder="Ví dụ: email@example.com" />
            </div>
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea className="mt-2" id="notes" value={notes} onChange={(e) => dispatch({ type: "SET_NOTES", payload: e.target.value })} placeholder="Ví dụ: abc" />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">{isLoading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}</Button>
        </CardContent>
      </Card>}
    </div>
  )
}
