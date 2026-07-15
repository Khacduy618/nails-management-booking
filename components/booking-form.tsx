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

const stepLabels = ["Dịch vụ", "Ngày & Giờ", "Nhân viên", "Thông tin"];

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
    availableTimeSlots,
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

  // Fetch available time slots when date or services change
  useEffect(() => {
    if (!selectedDate || selectedServices.length === 0) {
      dispatch({ type: "SET_AVAILABLE_TIME_SLOTS", payload: [] });
      return;
    }

    const fetchTimeSlots = async () => {
      dispatch({ type: "SET_IS_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: "" });
      try {
        const serviceIds = selectedServices.map((s) => s.id).join(",");
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(`${apiUrl}time-slots?date=${dateStr}&serviceIds=${serviceIds}`);
        if (!res.ok) throw new Error("Không thể lấy danh sách khung giờ.");
        const data = await res.json();
        if (data.success) {
          dispatch({ type: "SET_AVAILABLE_TIME_SLOTS", payload: data.slots || [] });
        } else {
          throw new Error(data.error?.message || "Không thể lấy danh sách khung giờ.");
        }
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
        dispatch({ type: "SET_AVAILABLE_TIME_SLOTS", payload: [] });
      } finally {
        dispatch({ type: "SET_IS_LOADING", payload: false });
      }
    };

    fetchTimeSlots();
  }, [selectedDate, selectedServices, apiUrl]);

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
        notes: notes || undefined,
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
      <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-8 text-center shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18)] max-w-lg mx-auto">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-primary animate-bounce" />
        </div>
        <h2 className="text-2xl font-extrabold text-neutral-900 mb-4">Đặt lịch thành công!</h2>
        <p className="text-sm text-neutral-500 font-medium mb-6">Lịch hẹn của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ để xác nhận sớm nhất.</p>
        
        {/* Receipt recipe layout */}
        <div className="space-y-3.5 text-sm bg-primary/[0.03] border border-primary/10 p-5 rounded-2xl mb-8 text-left shadow-inner">
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="font-semibold text-neutral-500">Dịch vụ:</span>
            <span className="font-bold text-neutral-900 text-right">{selectedServices.map(s => s.name).join(', ')}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="font-semibold text-neutral-500">Ngày hẹn:</span>
            <span className="font-bold text-neutral-900">{selectedDate && format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="font-semibold text-neutral-500">Khung giờ:</span>
            <span className="font-bold text-neutral-900">{selectedTime}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="font-semibold text-neutral-500">Thợ phục vụ:</span>
            <span className="font-bold text-neutral-900">{staffName}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="font-semibold text-neutral-500">Khách hàng:</span>
            <span className="font-bold text-neutral-900">{customerName}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="font-semibold text-neutral-500">SĐT:</span>
            <span className="font-bold text-neutral-900">{customerPhone}</span>
          </div>
          {customerEmail && (
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="font-semibold text-neutral-500">Email:</span>
              <span className="font-bold text-neutral-900">{customerEmail}</span>
            </div>
          )}
          <div className="flex justify-between pt-2">
            <span className="font-bold text-neutral-700 text-base">Tổng tiền:</span>
            <span className="font-extrabold text-primary text-lg">
              {totalPrice.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        <Button 
          onClick={resetForm} 
          className="w-full rounded-full bg-primary hover:bg-primary/95 hover:shadow-md transition-all duration-300 font-bold py-6 text-white"
        >
          {onBookingComplete ? "Đóng" : "Đặt lịch mới"}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Stepper Card */}
      <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-5 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          {stepLabels.map((_, index) => {
            const stepNum = index + 1;
            return (
              <div key={stepNum} className="flex items-center w-full">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${step >= stepNum ? "bg-primary text-white shadow-sm ring-2 ring-primary/20" : "bg-neutral-200/60 text-neutral-400"}`}>{stepNum}</div>
                {stepNum < stepLabels.length && <div className={`h-0.5 w-full mx-2 transition-all duration-500 ${step > stepNum ? "bg-primary" : "bg-neutral-200/60"}`} />}
              </div>
            );
          })}
        </div>
        <div className="hidden md:flex justify-between mt-3 text-[10px] font-extrabold tracking-wider uppercase text-neutral-400 px-1">
          {stepLabels.map((label) => (<span key={label} style={{ width: `${100 / stepLabels.length}%` }} className="text-center">{label}</span>))}
        </div>
      </div>

      {error && <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5"><AlertCircle className="h-4 w-4" /><AlertDescription className="font-semibold text-xs">{error}</AlertDescription></Alert>}

      {/* Step 1: Chọn Dịch vụ */}
      {step === 1 && (
        <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18)]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">Bước 1: Chọn Dịch vụ</h2>
            <p className="text-sm text-neutral-500 font-medium">Bạn có thể chọn một hoặc nhiều dịch vụ để phục vụ.</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input 
                placeholder="Tìm dịch vụ..." 
                value={searchTerm} 
                onChange={(e) => dispatch({ type: "SET_SEARCH_TERM", payload: e.target.value })} 
                className="pl-10 rounded-xl bg-white/50 border-neutral-200/85 focus-visible:ring-primary/20 focus-visible:border-primary" 
              />
            </div>

            {selectedServices.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="text-xs text-primary font-bold px-3 py-1.5 rounded-xl border-neutral-200 bg-white/50 hover:bg-white"
                  onClick={() => dispatch({ type: "CLEAR_SELECTED_SERVICES" })}
                >
                  Hủy chọn tất cả
                </Button>
              </div>
            )}

            <div className="max-h-[380px] overflow-y-auto space-y-3 p-2 scrollbar-thin">
              {isLoading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              {!isLoading && filteredServices.map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <div key={service.id}>
                    <Label
                      htmlFor={`service-${service.id}`}
                      className={`flex items-center p-4 sm:p-5 border rounded-2xl cursor-pointer transition-all duration-300 ${isSelected ? 'bg-white border-primary shadow-[0_4px_16px_-4px_rgba(239,68,68,0.15)] ring-1 ring-primary' : 'bg-white/50 border-neutral-200/60 hover:bg-white hover:border-neutral-300'}`}
                    >
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                        className="mr-4 rounded-md border-neutral-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-neutral-800 text-sm sm:text-base capitalize">{service.name}</p>
                        <p className="text-xs text-neutral-400 font-semibold">{service.duration} phút</p>
                      </div>
                      <p className="font-extrabold text-primary text-base sm:text-lg ml-4">
                        {Number(service.price).toLocaleString("vi-VN")}đ
                      </p>
                    </Label>
                  </div>
                );
              })}
            </div>

            <Separator className="bg-neutral-200/50" />

            <div className="flex justify-between items-baseline pt-2">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Đã chọn: <span className="text-neutral-700 font-extrabold">{selectedServices.length} dịch vụ</span>
              </p>
              <div className="text-right">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Thành tiền:</span>
                <p className="text-2xl font-extrabold text-primary">
                  {totalPrice.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>

            <Button 
              onClick={handleNextToDateTime} 
              disabled={isLoading || selectedServices.length === 0} 
              className="w-full rounded-full bg-primary hover:bg-primary/95 hover:shadow-md transition-all duration-300 font-bold py-6 text-white mt-2"
            >
              Chọn Ngày & Giờ
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Chọn Ngày & Giờ */}
      {step === 2 && (
        <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Bước 2: Chọn Ngày & Giờ</h2>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100" onClick={() => goBack(1)}><ArrowLeft className="h-5 w-5 text-neutral-500" /></Button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-auto rounded-2xl border border-neutral-200/60 bg-white/50 p-2 shadow-sm">
              <CalendarComponent 
                mode="single" 
                selected={selectedDate} 
                onSelect={(date) => dispatch({ type: "SET_SELECTED_DATE", payload: date })} 
                disabled={(date) => isBefore(date, startOfToday())} 
                className="rounded-xl border-none bg-transparent"
              />
            </div>
            
            <div className="flex-1 w-full max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
              <p className="text-sm font-bold text-neutral-700 mb-4 text-center">
                {selectedDate ? `Khung giờ khả dụng cho ${format(selectedDate, "dd/MM/yyyy")}` : "Vui lòng chọn ngày trên lịch"}
              </p>
              
              {selectedDate && isLoading && !selectedTime && (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              )}

              {selectedDate && (!isLoading || selectedTime) && availableTimeSlots.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm font-bold text-red-500 mb-1">Cửa hàng đóng cửa hoặc hết lịch</p>
                  <p className="text-xs text-neutral-400">Vui lòng chọn một ngày hẹn khác.</p>
                </div>
              )}

              {selectedDate && (!isLoading || selectedTime) && availableTimeSlots.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {availableTimeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <Button
                        key={time}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleTimeSelect(time)}
                        disabled={isTimeSlotDisabled(time)}
                        className={`rounded-xl font-bold shadow-sm transition-all duration-200 ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-white/60 hover:bg-red-50 hover:text-primary hover:border-primary/30 hover:-translate-y-0.5'}`}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              )}

              {availabilityInfo && (
                <p className="text-xs text-neutral-400 font-bold mt-4 text-center">{availabilityInfo}</p>
              )}
            </div>
          </div>
          
          <div className="pt-6 border-t border-neutral-100/60 mt-6">
            <Button 
              onClick={handleNextToStaff} 
              disabled={!selectedDate || !selectedTime || isLoading} 
              className="w-full rounded-full bg-primary hover:bg-primary/95 hover:shadow-md transition-all duration-300 font-bold py-6 text-white"
            >
              {isLoading ? "Đang tìm nhân viên..." : "Chọn Nhân viên"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Chọn Nhân viên */}
      {step === 3 && (
        <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Bước 3: Chọn Nhân viên</h2>
              <p className="text-xs text-neutral-500 font-medium">Lịch trống vào lúc {selectedTime} ngày {selectedDate && format(selectedDate, 'dd/MM/yyyy')}</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100" onClick={() => goBack(2)}><ArrowLeft className="h-5 w-5 text-neutral-500" /></Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-white/50 p-4 shadow-sm">
              <div>
                <p className="font-bold text-neutral-800 text-sm sm:text-base">Tự động phân công nhân viên</p>
                <p className="text-xs text-neutral-400 font-semibold">Ưu tiên kỹ thuật viên tay nghề tốt nhất.</p>
              </div>
              <Switch
                checked={autoAssign}
                onCheckedChange={(value) => {
                  dispatch({ type: "SET_AUTO_ASSIGN", payload: value });
                  if (value) dispatch({ type: "SET_SELECTED_STAFF_ID", payload: null });
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {isLoading && <Skeleton className="h-16 w-full rounded-2xl" />}
            {!isLoading && availableStaff.length === 0 && (
              <p className="text-sm font-bold text-red-500 text-center py-6">Không có nhân viên nào rảnh cho khung giờ này.</p>
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
                  className={`p-4 sm:p-5 border rounded-2xl flex items-center justify-between transition-all duration-300 ${
                    autoAssign
                      ? index === 0
                        ? 'bg-white border-primary shadow-[0_4px_16px_-4px_rgba(239,68,68,0.15)] ring-1 ring-primary'
                        : 'opacity-40 cursor-not-allowed border-neutral-200/60 bg-white/30'
                      : 'cursor-pointer hover:bg-white hover:border-neutral-300 bg-white/50 border-neutral-200/60'
                  } ${
                    !autoAssign && selectedStaffId === staffMember.id
                      ? 'bg-white border-primary shadow-[0_4px_16px_-4px_rgba(239,68,68,0.15)] ring-1 ring-primary'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-800 text-sm sm:text-base">{staffMember.name}</span>
                      {autoAssign && index === 0 && (
                        <span className="text-[10px] text-primary font-extrabold uppercase tracking-wider mt-0.5">Tự động chọn (Phù hợp nhất)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {staffMember.rating !== undefined && staffMember.rating > 0 && (
                      <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold shadow-sm">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{staffMember.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <Button 
              onClick={() => dispatch({ type: "SET_STEP", payload: 4 })} 
              disabled={!canProceedToInfo} 
              className="w-full rounded-full bg-primary hover:bg-primary/95 hover:shadow-md transition-all duration-300 font-bold py-6 text-white mt-4"
            >
              Điền thông tin
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Điền thông tin */}
      {step === 4 && (
        <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Bước 4: Thông tin khách hàng</h2>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100" onClick={() => goBack(3)}><ArrowLeft className="h-5 w-5 text-neutral-500" /></Button>
          </div>

          <div className="space-y-6">
            {/* Summary card */}
            <div className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-5 space-y-3.5 shadow-inner">
              <h3 className="font-extrabold text-neutral-800 text-sm uppercase tracking-wider">Tóm tắt lịch đặt</h3>
              <div className="text-sm space-y-2 text-neutral-700">
                <div className="flex justify-between border-b border-neutral-200/30 pb-1.5">
                  <span className="font-semibold text-neutral-500">Dịch vụ:</span>
                  <span className="font-bold text-neutral-900 text-right">{selectedServices.map(s => s.name).join(', ')}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200/30 pb-1.5">
                  <span className="font-semibold text-neutral-500">Nhân viên:</span>
                  <span className="font-bold text-neutral-900">{assignedStaff?.name || (autoAssign ? 'Sẽ tự động phân công' : 'Chưa chọn')}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200/30 pb-1.5">
                  <span className="font-semibold text-neutral-500">Thời gian:</span>
                  <span className="font-bold text-neutral-900">{selectedDate && `${format(selectedDate, "dd/MM/yyyy")} lúc ${selectedTime}`}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200/30 pb-1.5">
                  <span className="font-semibold text-neutral-500">Tổng thời gian:</span>
                  <span className="font-bold text-neutral-900">{totalDuration} phút</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-bold text-neutral-700">Thành tiền:</span>
                  <span className="font-extrabold text-primary text-base">{totalPrice.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
            </div>

            <Separator className="bg-neutral-200/50" />

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-bold text-neutral-700">Họ và tên *</Label>
                <Input 
                  className="mt-2 rounded-xl bg-white/50 border-neutral-200/85 focus-visible:ring-primary/20 focus-visible:border-primary" 
                  id="name" 
                  value={customerName} 
                  onChange={(e) => dispatch({ type: "SET_CUSTOMER_NAME", payload: e.target.value })} 
                  placeholder="Ví dụ: Nguyễn Văn A" 
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-bold text-neutral-700">Số điện thoại *</Label>
                <Input 
                  className="mt-2 rounded-xl bg-white/50 border-neutral-200/85 focus-visible:ring-primary/20 focus-visible:border-primary" 
                  id="phone" 
                  type="tel" 
                  value={customerPhone} 
                  onChange={(e) => dispatch({ type: "SET_CUSTOMER_PHONE", payload: e.target.value })} 
                  placeholder="Ví dụ: 0932105214" 
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-bold text-neutral-700">Email (để nhận liên kết đánh giá và cập nhật lịch)</Label>
                <Input 
                  className="mt-2 rounded-xl bg-white/50 border-neutral-200/85 focus-visible:ring-primary/20 focus-visible:border-primary" 
                  id="email" 
                  type="email" 
                  value={customerEmail} 
                  onChange={(e) => dispatch({ type: "SET_CUSTOMER_EMAIL", payload: e.target.value })} 
                  placeholder="Ví dụ: nguyen@example.com" 
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-sm font-bold text-neutral-700">Ghi chú</Label>
                <Textarea 
                  className="mt-2 rounded-xl bg-white/50 border-neutral-200/85 focus-visible:ring-primary/20 focus-visible:border-primary resize-none h-24" 
                  id="notes" 
                  value={notes} 
                  onChange={(e) => dispatch({ type: "SET_NOTES", payload: e.target.value })} 
                  placeholder="Ví dụ: đắp vẽ hình hoa mai, cần kỹ thuật viên vẽ móng kỹ..." 
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isLoading} 
              className="w-full rounded-full bg-primary hover:bg-primary/95 hover:shadow-md transition-all duration-300 font-bold py-6 text-white mt-4"
            >
              {isLoading ? 'Đang gửi thông tin...' : 'Xác nhận đặt lịch'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
