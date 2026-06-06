"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Edit, Trash2, Calendar, Phone, Clock, User, Loader2, AlertCircle } from "lucide-react"
import { AppointmentDetails } from "./appointment-details"
import { AppointmentStatusUpdate } from "./appointment-status-update"
import { useDebounce } from "@/hooks/use-debounce"
import { format } from "date-fns"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiStaff, ApiAppointment, AppointmentStatus, PaginationInfo } from "@/types";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Plus } from "lucide-react"
import { BookingForm } from "@/components/booking-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PhantomWrapper from "@/components/ui/phantom-wrapper"

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800 border-blue-200" },
  'in-progress': { label: "Đang làm", color: "bg-green-100 text-green-800 border-green-200" },
  completed: { label: "Hoàn thành", color: "bg-gray-100 text-gray-800 border-gray-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200" },
};

const MOCK_APPOINTMENTS: ApiAppointment[] = Array.from({ length: 5 }, (_, i) => ({
  id: -i - 1,
  appointmentDate: "2026-05-31",
  appointmentTime: "12:00:00",
  durationAtBooking: 60,
  priceAtBooking: "250000",
  customerName: "Khách hàng mẫu " + (i + 1),
  customerPhone: "090000000" + i,
  status: "pending" as AppointmentStatus,
  notes: "",
  appointmentServices: [
    {
      service: { name: "Dịch Vụ Làm Móng Mẫu" },
      staff: { name: "Nhân viên mẫu" }
    }
  ],
  createdAt: "2026-05-31T00:00:00.000Z",
  updatedAt: "2026-05-31T00:00:00.000Z"
}));

export function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [staffList, setStaffList] = useState<ApiStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [filters, setFilters] = useState({ searchTerm: "", status: "all", date: "", staffId: "all", page: 1 });
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

  const [showDetails, setShowDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ApiAppointment | null>(null);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);
      if (filters.staffId !== 'all') params.append('staffId', filters.staffId);

      const res = await fetch(`${apiBase}/admin/appointments?${params.toString()}`);
      if (!res.ok) throw new Error("Không thể tải danh sách lịch hẹn.");

      const data = await res.json();
      setAppointments(data.appointments || []);
      setPagination(data.pagination || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, filters.status, filters.date, filters.staffId, filters.page, apiBase]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { fetch(`${apiBase}/admin/staff?limit=100`).then(res => res.json()).then(data => setStaffList(data.data || [])); }, [apiBase]);

  const handleFilterChange = (filterName: 'searchTerm' | 'status' | 'date' | 'staffId', value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value, page: 1 }));
  };

  // Hàm chỉ để thay đổi trang
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleViewDetails = (appointment: ApiAppointment) => { setSelectedAppointment(appointment); setShowDetails(true); };
  const handleOpenStatusUpdate = (appointment: ApiAppointment) => { setSelectedAppointment(appointment); setShowStatusUpdate(true); };

  const handleDeleteAppointment = async (appointmentId: number) => {
    const promise = fetch(`${apiBase}/admin/appointments/${appointmentId}`, { method: 'DELETE' });
    toast.promise(promise, {
      loading: 'Đang hủy lịch hẹn...',
      success: () => {
        fetchAppointments(); // Tải lại dữ liệu
        return "Đã hủy lịch hẹn thành công!";
      },
      error: "Hủy lịch hẹn thất bại."
    });
  };

  const handleStatusChange = async (appointmentId: number, newStatus: string, notes?: string) => {
    const promise = fetch(`${apiBase}/admin/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes: notes })
    });

    toast.promise(promise, {
      loading: 'Đang cập nhật...',
      success: () => {
        fetchAppointments(); // Tải lại dữ liệu
        setShowStatusUpdate(false);
        setSelectedAppointment(null);
        return "Cập nhật trạng thái thành công!";
      },
      error: "Cập nhật thất bại."
    });
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false); // Đóng modal
    toast.success("Tạo lịch hẹn mới thành công!");
    fetchAppointments(); // Tải lại danh sách để hiển thị lịch hẹn mới
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-5 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Tìm kiếm..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(p => ({ ...p, searchTerm: e.target.value }))}
              className="pl-10 rounded-xl border-neutral-200 bg-white/80 focus:bg-white"
            />
          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v }))}>
            <SelectTrigger className="rounded-xl border-neutral-200 bg-white/80"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(statusConfig).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.staffId} onValueChange={(v) => setFilters(p => ({ ...p, staffId: v }))}>
            <SelectTrigger className="rounded-xl border-neutral-200 bg-white/80"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200">
              <SelectItem value="all">Tất cả nhân viên</SelectItem>
              {staffList.map((staff) => (
                <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(p => ({ ...p, date: e.target.value }))}
              className="w-full rounded-xl border-neutral-200 bg-white/80 appearance-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-sm hover:shadow active:scale-98 transition-all cursor-pointer" onClick={() => setShowBookingForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm lịch mới
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive" className="rounded-2xl"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      {!isLoading && pagination && (
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider px-2">
          <span>Tổng số lịch hẹn:</span>
          <span className="text-primary text-sm font-extrabold">{pagination.total}</span>
        </div>
      )}

      <div className="rounded-3xl border border-neutral-200/50 bg-white/70 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md overflow-hidden">
        <div className="p-0">
          <PhantomWrapper loading={isLoading} animation="wave">
            {(() => {
              const displayAppointments = isLoading && appointments.length === 0 ? MOCK_APPOINTMENTS : appointments;
              return (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-neutral-200/50 bg-neutral-50/50">
                        <tr>
                          <th className="p-4 font-bold text-neutral-800 text-left">Khách hàng</th>
                          <th className="p-4 font-bold text-neutral-800 text-left">Dịch vụ</th>
                          <th className="p-4 font-bold text-neutral-800 text-left">Nhân viên</th>
                          <th className="p-4 font-bold text-neutral-800 text-left">Thời gian</th>
                          <th className="p-4 font-bold text-neutral-800 text-left">Giá</th>
                          <th className="p-4 font-bold text-neutral-800 text-left">Trạng thái</th>
                          <th className="p-4 font-bold text-neutral-800 text-left">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayAppointments.map((appointment) => {
                          const staffNames = [...new Set(appointment.appointmentServices.map(as => as.staff?.name).filter(Boolean))].join(', ')
                          const serviceNames = appointment.appointmentServices.map(as => as.service.name).join(' + ')
                          const config = statusConfig[appointment.status]
                          return (
                            <tr key={appointment.id} className="border-b border-neutral-100/70 hover:bg-neutral-50/40 transition-colors">
                              <td className="p-4 align-top">
                                <div className="font-medium flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {appointment.customerName}
                                </div>
                                <div className="text-muted-foreground flex items-center gap-2 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {appointment.customerPhone}
                                </div>
                              </td>
                              <td className="p-4 align-top max-w-xs">
                                <div className="font-medium truncate">{serviceNames}</div>
                                <div className="text-muted-foreground">{appointment.durationAtBooking} phút</div>
                              </td>
                              <td className="p-4 align-top">
                                <div className="truncate">{staffNames || 'Chưa phân công'}</div>
                              </td>
                              <td className="p-4 align-top">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(appointment.appointmentDate), "dd/MM/yyyy")}
                                </div>
                                <div className="text-muted-foreground flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {appointment.appointmentTime.substring(0, 5)}
                                </div>
                              </td>
                              <td className="p-4 align-top font-medium text-primary">
                                {Number(appointment.priceAtBooking).toLocaleString("vi-VN")}₫
                              </td>
                              <td className="p-4 align-top">
                                {config ? (
                                  <Badge className={config.color}>{config.label}</Badge>
                                ) : (
                                  <Badge variant="secondary">{appointment.status}</Badge>
                                )}
                              </td>
                              <td className="p-4 align-top">
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" onClick={() => handleViewDetails(appointment)} disabled={isLoading}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleOpenStatusUpdate(appointment)} disabled={isLoading}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {appointment.status !== 'cancelled' && (
                                    <ConfirmDialog
                                      title="Xác nhận hủy lịch?"
                                      description="Hành động này sẽ chuyển trạng thái lịch hẹn thành 'Đã hủy'. Bạn có chắc chắn?"
                                      onConfirm={() => handleDeleteAppointment(appointment.id)}
                                    >
                                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" disabled={isLoading}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </ConfirmDialog>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-4 p-4">
                    {displayAppointments.map((appointment) => {
                      const staffNames = [...new Set(appointment.appointmentServices.map(as => as.staff?.name).filter(Boolean))].join(', ')
                      const serviceNames = appointment.appointmentServices.map(as => as.service.name).join(' + ')
                      const config = statusConfig[appointment.status]

                      return (
                        <Card key={`mobile-${appointment.id}`} className="shadow-sm border">
                          <CardContent className="space-y-3 p-[10px] sm:p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-foreground">{appointment.customerName}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {appointment.customerPhone}
                                </p>
                              </div>
                              {config ? (
                                <Badge className={config.color}>{config.label}</Badge>
                              ) : (
                                <Badge variant="secondary">{appointment.status}</Badge>
                              )}
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium text-foreground">
                                    {format(new Date(appointment.appointmentDate), "dd/MM/yyyy")}
                                  </p>
                                  <p className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {appointment.appointmentTime.substring(0, 5)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="mt-0.5">Dịch vụ</Badge>
                                <div>
                                  <p className="font-medium text-foreground">{serviceNames}</p>
                                  <p className="text-muted-foreground">{appointment.durationAtBooking} phút</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium text-foreground">{staffNames || 'Chưa phân công'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                              <p className="text-base font-semibold text-primary">
                                {Number(appointment.priceAtBooking).toLocaleString("vi-VN")}₫
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleViewDetails(appointment)} disabled={isLoading}>
                                  Xem
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleOpenStatusUpdate(appointment)} disabled={isLoading}>
                                  Cập nhật
                                </Button>
                                {appointment.status !== 'cancelled' && (
                                  <ConfirmDialog
                                    title="Xác nhận hủy lịch?"
                                    description="Hành động này sẽ chuyển trạng thái lịch hẹn thành 'Đã hủy'. Bạn có chắc chắn?"
                                    onConfirm={() => handleDeleteAppointment(appointment.id)}
                                  >
                                    <Button size="sm" variant="destructive" disabled={isLoading}>
                                      Hủy lịch
                                    </Button>
                                  </ConfirmDialog>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}

                    {!isLoading && appointments.length === 0 && (
                      <div className="p-6 text-center text-muted-foreground">
                        Không tìm thấy lịch hẹn nào.
                      </div>
                    )}
                  </div>

                  {!isLoading && appointments.length === 0 && (
                    <div className="hidden md:block p-12 text-center text-muted-foreground">
                      Không tìm thấy lịch hẹn nào.
                    </div>
                  )}
                </>
              );
            })()}
          </PhantomWrapper>
        </div>
      </div>
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Hiển thị {appointments.length} trên tổng số {pagination.total} kết quả
          </div>
          <Pagination className="mx-0 w-auto"> {/* Thêm class để căn chỉnh */}
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(filters.page - 1)}
                  className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* Logic hiển thị các nút số trang */}
              {[...Array(pagination.totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => handlePageChange(i + 1)}
                    isActive={filters.page === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(filters.page + 1)}
                  className={filters.page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      {showDetails && selectedAppointment && <AppointmentDetails appointment={selectedAppointment} onClose={() => setShowDetails(false)} onUpdateStatus={() => { setShowDetails(false); handleOpenStatusUpdate(selectedAppointment); }} />}
      {showStatusUpdate && selectedAppointment && <AppointmentStatusUpdate appointment={selectedAppointment} onSave={handleStatusChange} onCancel={() => setShowStatusUpdate(false)} />}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent
          className="w-full sm:max-w-4xl max-h-[90vh] flex flex-col"
        >
          {/* 
            Tách Header của Dialog ra để có thanh cuộn cho nội dung bên trong,
            giữ cho header và progress bar cố định.
          */}
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Tạo lịch hẹn mới</DialogTitle>
            <p className="text-muted-foreground">
              Điền thông tin theo các bước để tạo lịch hẹn cho khách hàng.
            </p>
          </DialogHeader>

          {/* Nội dung có thể cuộn */}
          <div className="flex-grow overflow-y-auto">
            <BookingForm onBookingComplete={handleBookingSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}