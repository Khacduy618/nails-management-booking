// "use client"

// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Calendar } from "@/components/ui/calendar"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { CalendarIcon, Clock, User, Phone, CheckCircle, AlertCircle, XCircle, ChevronLeft, ChevronRight, Filter, Loader2 } from "lucide-react"
// import { useState, useEffect, useMemo } from "react"
// import { format, addMinutes, setHours, setMinutes } from "date-fns"
// import { vi } from "date-fns/locale"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Label } from "./ui/label"
// import { Alert, AlertDescription } from "./ui/alert"

// // --- Định nghĩa kiểu dữ liệu ---
// type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "in-progress";

// interface ApiStaff { id: number; name: string; }
// interface ApiAppointment {
//   id: number;
//   appointmentTime: string; // HH:mm:ss
//   durationAtBooking: number;
//   priceAtBooking: string;
//   customerName: string;
//   customerPhone: string;
//   status: AppointmentStatus;
//   notes: string | null;
//   staff?: { name: string } | null; // Nhân viên thực hiện dịch vụ chính
//   appointmentServices: {
//     service: { name: string };
//     staff: { name: string } | null;
//   }[];
// }

// const statusConfig: Record<AppointmentStatus, { label: string; variant: "secondary" | "default" | "outline" | "destructive"; color: string }> = {
//   pending: { label: "Chờ xác nhận", variant: "secondary", color: "bg-yellow-100 border-yellow-200 text-yellow-800" },
//   confirmed: { label: "Đã xác nhận", variant: "default", color: "bg-green-100 border-green-200 text-green-800" },
//   'in-progress': { label: "Đang làm", variant: "outline", color: "bg-blue-100 border-blue-200 text-blue-800" },
//   completed: { label: "Hoàn thành", variant: "outline", color: "bg-gray-100 border-gray-200 text-gray-800" },
//   cancelled: { label: "Đã hủy", variant: "destructive", color: "bg-red-100 border-red-200 text-red-800" },
// };

// const generateTimeSlots = () => {
//   const slots = [];
//   for (let hour = 8; hour <= 20; hour++) {
//     for (let minute = 0; minute < 60; minute += 30) {
//       slots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
//     }
//   }
//   return slots;
// };

// export function StoreSchedule() {
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [selectedStaff, setSelectedStaff] = useState("all");
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);

//   const [staffList, setStaffList] = useState<ApiStaff[]>([]);
//   const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const timeSlots = generateTimeSlots();

//   // --- API Calls ---
//   useEffect(() => {
//     async function fetchInitialData() {
//       try {
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
//         const res = await fetch(`${apiUrl}admin/staff`);
//         const data = await res.json();
//         setStaffList(data.staff || []);
//       } catch (e) {
//         console.error("Failed to fetch staff list");
//       }
//     }
//     fetchInitialData();
//   }, []);

//   useEffect(() => {
//     async function fetchAppointments() {
//       setIsLoading(true);
//       setError(null);
//       try {
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
//         const params = new URLSearchParams();
//         params.append('date', format(selectedDate, 'yyyy-MM-dd'));
//         if (selectedStaff !== 'all') {
//           params.append('staffId', selectedStaff);
//         }

//         const res = await fetch(`${apiUrl}admin/appointments?${params.toString()}`);
//         if (!res.ok) throw new Error("Không thể tải lịch hẹn.");

//         const data = await res.json();
//         setAppointments(data.appointments || []);
//       } catch (err: any) {
//         setError(err.message);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     fetchAppointments();
//   }, [selectedDate, selectedStaff]); // Chạy lại khi ngày hoặc nhân viên thay đổi

//   // --- Logic hiển thị ---
//   const getAppointmentAtTime = (time: string) => {
//     return appointments.find((apt) => {
//       // Chuyển đổi chuỗi thời gian thành đối tượng Date
//       const [slotHours, slotMinutes] = time.split(':').map(Number);
//       const slotTime = setMinutes(setHours(new Date(0), slotHours), slotMinutes);

//       const [aptStartHours, aptStartMinutes] = apt.appointmentTime.split(':').map(Number);
//       const aptStartTime = setMinutes(setHours(new Date(0), aptStartHours), aptStartMinutes);

//       const aptEndTime = addMinutes(aptStartTime, apt.durationAtBooking);

//       // So sánh
//       return slotTime >= aptStartTime && slotTime < aptEndTime;
//     });
//   };

//   const navigateDate = (direction: "prev" | "next") => {
//     const newDate = new Date(selectedDate);
//     newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
//     setSelectedDate(newDate);
//   };

//   const stats = useMemo(() => {
//     const activeAppointments = appointments.filter(apt => apt.status !== 'cancelled');
//     return {
//       total: activeAppointments.length,
//       confirmed: activeAppointments.filter(apt => apt.status === 'confirmed').length,
//       inProgress: activeAppointments.filter(apt => apt.status === 'in-progress').length,
//       pending: activeAppointments.filter(apt => apt.status === 'pending').length,
//       revenue: activeAppointments.reduce((sum, apt) => sum + Number(apt.priceAtBooking), 0),
//     };
//   }, [appointments]);

//   return (
//     <div className="space-y-6">
//       {/* Controls */}
//       <Card>
//         <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div className="flex items-center space-x-2">
//             <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
//             <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
//               <PopoverTrigger asChild>
//                 <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={(d) => { if (d) setSelectedDate(d); setIsCalendarOpen(false); }} initialFocus /></PopoverContent>
//             </Popover>
//             <Button variant="outline" size="icon" onClick={() => navigateDate("next")}><ChevronRight className="h-4 w-4" /></Button>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Label>Nhân viên:</Label>
//             <Select value={selectedStaff} onValueChange={setSelectedStaff}>
//               <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">Tất cả nhân viên</SelectItem>
//                 {staffList.map((staff) => <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>)}
//               </SelectContent>
//             </Select>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-primary">{stats.total}</div>
//             <div className="text-sm text-muted-foreground">Tổng lịch hẹn</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
//             <div className="text-sm text-muted-foreground">Đã xác nhận</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
//             <div className="text-sm text-muted-foreground">Đang thực hiện</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
//             <div className="text-sm text-muted-foreground">Chờ xác nhận</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-primary">{stats.revenue.toLocaleString("vi-VN")}đ</div>
//             <div className="text-sm text-muted-foreground">Doanh thu</div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Schedule Timeline */}
//       <Card>
//         <CardHeader><CardTitle>Lịch trình chi tiết</CardTitle><CardDescription>{format(selectedDate, "dd/MM/yyyy")}</CardDescription></CardHeader>
//         <CardContent>
//           {isLoading && <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="flex items-center space-x-4"><Skeleton className="w-16 h-6" /><Skeleton className="flex-1 h-16" /></div>)}</div>}
//           {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
//           {!isLoading && !error && (
//             <div className="space-y-2">
//               {timeSlots.map((time) => {
//                 const appointment = getAppointmentAtTime(time);
//                 // logic tìm appointment đầu tiên của block, để chỉ render 1 lần
//                 const isFirstSlot = appointment && appointment.appointmentTime.substring(0, 5) === time;
//                 if (!isFirstSlot && appointment) return null; // Bỏ qua, vì đã được render ở slot đầu tiên

//                 return (
//                   <div key={time} className="flex items-start space-x-4 py-2 border-b last:border-b-0">
//                     <div className="w-16 text-sm font-mono text-muted-foreground pt-3">{time}</div>
//                     <div className="flex-1">
//                       {appointment ? (
//                         <div style={{ minHeight: `${(appointment.durationAtBooking / 30) * 4.5}rem` }} className={`p-3 rounded-lg border ${statusConfig[appointment.status].color}`}>
//                           <div className="flex items-start justify-between">
//                             <div className="space-y-1">
//                               <h4 className="font-semibold">{appointment.appointmentServices.map(s => s.service.name).join(' + ')}</h4>
//                               <Badge variant={statusConfig[appointment.status].variant}>{statusConfig[appointment.status].label}</Badge>
//                               <div className="flex items-center space-x-4 text-sm text-muted-foreground">
//                                 <div className="flex items-center space-x-1"><User className="h-3 w-3" /><span>{appointment.customerName}</span></div>
//                                 <div className="flex items-center space-x-1"><Phone className="h-3 w-3" /><span>{appointment.customerPhone}</span></div>
//                                 <div className="flex items-center space-x-1"><Clock className="h-3 w-3" /><span>{appointment.durationAtBooking} phút</span></div>
//                               </div>
//                               <div className="text-sm font-medium">Nhân viên: {[...new Set(appointment.appointmentServices.map(s => s.staff?.name).filter(Boolean))].join(', ')}</div>
//                               {appointment.notes && <div className="text-sm italic">Ghi chú: {appointment.notes}</div>}
//                             </div>
//                             <div className="font-bold text-primary">{Number(appointment.priceAtBooking).toLocaleString("vi-VN")}đ</div>
//                           </div>
//                         </div>
//                       ) : <div className="h-8"></div>}
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

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
  pending: { label: "Chờ xác nhận", variant: "secondary", color: "bg-yellow-100 border-yellow-200 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", variant: "default", color: "bg-green-100 border-green-200 text-green-800" },
  'in-progress': { label: "Đang làm", variant: "outline", color: "bg-blue-100 border-blue-200 text-blue-800" },
  completed: { label: "Hoàn thành", variant: "outline", color: "bg-gray-100 border-gray-200 text-gray-800" },
  cancelled: { label: "Đã hủy", variant: "destructive", color: "bg-red-100 border-red-200 text-red-800" },
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
        const res = await fetch(`${apiUrl}admin/staff`);
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

        const res = await fetch(`${apiUrl}admin/appointments?${params.toString()}`);
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
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={(d) => { if (d) setSelectedDate(d); setIsCalendarOpen(false); }} initialFocus /></PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center space-x-2">
            <Label>Nhân viên:</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {staffList.map((staff) => <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats (ĐÃ XÓA DOANH THU) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{stats.total}</div><div className="text-sm text-muted-foreground">Tổng lịch hẹn</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.confirmed}</div><div className="text-sm text-muted-foreground">Đã xác nhận</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div><div className="text-sm text-muted-foreground">Đang thực hiện</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div><div className="text-sm text-muted-foreground">Chờ xác nhận</div></CardContent></Card>
      </div>

      {/* Schedule Timeline */}
      <Card>
        <CardHeader><CardTitle>Lịch trình chi tiết</CardTitle><CardDescription>{format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}</CardDescription></CardHeader>
        <CardContent>
          {isLoading && <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="flex items-center space-x-4"><Skeleton className="w-16 h-6" /><Skeleton className="flex-1 h-20" /></div>)}</div>}
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {!isLoading && !error && (
            <div className="relative border-t">
              {timeSlots.map((time) => (
                <div key={time} className="flex h-12 border-b"><div className="w-16 flex-shrink-0 -mt-2.5"><span className="text-xs font-mono text-muted-foreground bg-background px-1">{time}</span></div><div className="flex-1 border-l"></div></div>
              ))}

              {appointments.map((appointment) => {
                if (appointment.status === 'cancelled') return null;
                const top = ((timeToMinutes(appointment.appointmentTime) - (MIN_HOUR * 60)) / 30) * 3;
                const height = (appointment.durationAtBooking / 30) * 3;
                const config = statusConfig[appointment.status];

                return (
                  <div key={appointment.id} className={`absolute left-16 right-0 rounded-lg border p-2 overflow-hidden ${config.color}`}
                    style={{ top: `${top}rem`, height: `${height}rem`, marginLeft: '1rem' }}
                  >
                    <div className="flex flex-col h-full text-xs">
                      <p className="font-semibold truncate">{appointment.appointmentServices.map(s => s.service.name).join(' + ')}</p>
                      <p className="text-muted-foreground flex items-center"><User className="h-3 w-3 mr-1" />{appointment.customerName}</p>
                      <div className="mt-auto flex justify-between items-center">
                        <Badge variant={config.variant} className="text-xs px-1.5 py-0.5">{config.label}</Badge>
                        <span className="font-mono">{appointment.appointmentTime.substring(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!isLoading && appointments.filter(a => a.status !== 'cancelled').length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Không có lịch hẹn nào trong ngày.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}