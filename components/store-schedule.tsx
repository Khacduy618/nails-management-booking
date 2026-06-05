"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, User, Phone, CheckCircle, AlertCircle, XCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { format, addMinutes, setHours, setMinutes } from "date-fns"
import { vi } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

// --- Định nghĩa kiểu dữ liệu ---
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "in-progress";

interface ApiStaff { id: number; name: string; }
interface ApiAppointment {
  id: number;
  appointmentTime: string; // HH:mm:ss
  durationAtBooking: number;
  priceAtBooking: string;
  customerName: string;
  customerPhone: string;
  status: AppointmentStatus;
  notes: string | null;
  appointmentServices: {
    service: { name: string };
    staff: { name: string } | null;
  }[];
}

const statusConfig: Record<AppointmentStatus, { label: string; variant: "secondary" | "default" | "outline" | "destructive"; color: string }> = {
  pending: { label: "Chờ xác nhận", variant: "secondary", color: "bg-amber-50/90 border-amber-200/60 text-amber-800 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.2)]" },
  confirmed: { label: "Đã xác nhận", variant: "default", color: "bg-emerald-50/90 border-emerald-200/60 text-emerald-800 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]" },
  'in-progress': { label: "Đang làm", variant: "outline", color: "bg-sky-50/90 border-sky-200/60 text-sky-800 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.2)]" },
  completed: { label: "Hoàn thành", variant: "outline", color: "bg-neutral-50/90 border-neutral-200/60 text-neutral-800" },
  cancelled: { label: "Đã hủy", variant: "destructive", color: "bg-rose-50/90 border-rose-200/60 text-rose-800" },
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 21; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
};

const timeToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-neutral-200/50 bg-white/70 p-6 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(15,15,15,0.12),0_1px_2px_rgba(0,0,0,0.02)] ${className}`}
    >
      {children}
    </div>
  )
}

export function StoreSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [staffList, setStaffList] = useState<ApiStaff[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeSlots = generateTimeSlots();
  const MIN_HOUR = 8;

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/admin/staff`);
        const data = await res.json();
        setStaffList(data.staff || []);
      } catch (e) {
        console.error("Failed to fetch staff list");
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    async function fetchAppointments() {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const params = new URLSearchParams();
        params.append('date', format(selectedDate, 'yyyy-MM-dd'));
        if (selectedStaff !== 'all') {
          params.append('staffId', selectedStaff);
        }

        const res = await fetch(`${apiUrl}/api/admin/appointments?${params.toString()}`);
        if (!res.ok) throw new Error("Không thể tải lịch hẹn.");

        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAppointments();
  }, [selectedDate, selectedStaff]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  const stats = useMemo(() => {
    const activeAppointments = appointments.filter(apt => apt.status !== 'cancelled');
    return {
      total: activeAppointments.length,
      confirmed: activeAppointments.filter(apt => apt.status === 'confirmed').length,
      inProgress: activeAppointments.filter(apt => apt.status === 'in-progress').length,
      pending: activeAppointments.filter(apt => apt.status === 'pending').length,
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <GlassCard className="!p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal rounded-xl">
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-neutral-200/50 shadow-lg"><Calendar mode="single" selected={selectedDate} onSelect={(d) => { if (d) setSelectedDate(d); setIsCalendarOpen(false); }} initialFocus /></PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center space-x-3">
          <Label className="text-sm font-semibold text-neutral-600">Nhân viên:</Label>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-[180px] rounded-xl border-neutral-200/60 bg-white/50"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-neutral-200/50">
              <SelectItem value="all" className="rounded-xl">Tất cả nhân viên</SelectItem>
              {staffList.map((staff) => <SelectItem key={staff.id} value={staff.id.toString()} className="rounded-xl">{staff.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Stats (ĐÃ XÓA DOANH THU) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center transition-all duration-300 hover:-translate-y-1">
          <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{stats.total}</div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">Tổng lịch hẹn</div>
        </GlassCard>
        <GlassCard className="p-4 text-center transition-all duration-300 hover:-translate-y-1">
          <div className="text-2xl font-bold text-emerald-600">{stats.confirmed}</div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">Đã xác nhận</div>
        </GlassCard>
        <GlassCard className="p-4 text-center transition-all duration-300 hover:-translate-y-1">
          <div className="text-2xl font-bold text-sky-600">{stats.inProgress}</div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">Đang thực hiện</div>
        </GlassCard>
        <GlassCard className="p-4 text-center transition-all duration-300 hover:-translate-y-1">
          <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">Chờ xác nhận</div>
        </GlassCard>
      </div>

      {/* Schedule Timeline */}
      <GlassCard className="overflow-hidden">
        <div className="mb-6">
          <h2 className="font-sans font-bold text-neutral-800 text-lg tracking-tight leading-tight">Lịch trình chi tiết</h2>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}</p>
        </div>
        <div>
          {isLoading && <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="flex items-center space-x-4"><Skeleton className="w-16 h-6" /><Skeleton className="flex-1 h-20 rounded-2xl" /></div>)}</div>}
          {error && <Alert variant="destructive" className="rounded-2xl border-red-200"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {!isLoading && !error && (
            <div className="relative border-t border-neutral-100 mt-2">
              {timeSlots.map((time) => (
                <div key={time} className="flex h-12 border-b border-neutral-100/60"><div className="w-16 flex-shrink-0 -mt-2.5"><span className="text-xs font-mono text-muted-foreground bg-white/90 rounded-md px-1.5 py-0.5 border border-neutral-200/40 shadow-sm">{time}</span></div><div className="flex-1 border-l border-neutral-100/80"></div></div>
              ))}

              {appointments.map((appointment) => {
                if (appointment.status === 'cancelled') return null;
                const top = ((timeToMinutes(appointment.appointmentTime) - (MIN_HOUR * 60)) / 30) * 3;
                const height = (appointment.durationAtBooking / 30) * 3;
                const config = statusConfig[appointment.status];

                return (
                  <div key={appointment.id} className={`absolute left-16 right-0 rounded-2xl border p-3 overflow-hidden shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:scale-[1.005] ${config.color}`}
                    style={{ top: `${top}rem`, height: `${height}rem`, marginLeft: '1rem' }}
                  >
                    <div className="flex flex-col h-full text-xs">
                      <p className="font-bold text-neutral-850 truncate text-sm mb-1">{appointment.appointmentServices.map(s => s.service.name).join(' + ')}</p>
                      <p className="text-neutral-600 flex items-center font-medium"><User className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />{appointment.customerName}</p>
                      <div className="mt-auto flex justify-between items-center">
                        <Badge variant={config.variant} className="text-[10px] px-2 py-0.5 rounded-full border-none font-bold shadow-sm">{config.label}</Badge>
                        <span className="font-mono text-neutral-550 font-semibold flex items-center"><Clock className="h-3 w-3 mr-1" />{appointment.appointmentTime.substring(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!isLoading && appointments.filter(a => a.status !== 'cancelled').length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-medium">Không có lịch hẹn nào trong ngày.</div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}