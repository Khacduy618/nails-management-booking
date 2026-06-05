'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { PayrollDialog } from './payroll-dialog'
import { toast } from 'sonner'
import { DollarSign, Calendar, Users, Briefcase, Clock, Moon, AlertCircle } from 'lucide-react'

interface Staff {
    id: number
    name: string
    position: string | null
    status: string
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-3xl border border-neutral-200/50 bg-white/70 p-6 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(15,15,15,0.12),0_1px_2px_rgba(0,0,0,0.02)] ${className}`}
        >
            {children}
        </div>
    )
}

function SectionTitle({ icon: Icon, title, subtitle }: {
    icon: React.ElementType; title: string; subtitle?: string
}) {
    return (
        <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h2 className="font-sans font-bold text-neutral-800 text-lg tracking-tight leading-tight">{title}</h2>
                {subtitle && <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{subtitle}</p>}
            </div>
        </div>
    )
}

export function PayrollManagement() {
    const [staff, setStaff] = useState<Staff[]>([])
    const [selectedStaffId, setSelectedStaffId] = useState<string>('')
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const [showPayrollDialog, setShowPayrollDialog] = useState(false)
    const [loading, setLoading] = useState(true)

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

    useEffect(() => {
        fetchStaff()
    }, [apiBase])

    const fetchStaff = async () => {
        try {
            const res = await fetch(`${apiBase}/admin/staff?limit=100&status=active`)
            const result = await res.json()

            if (result.success && result.data) {
                setStaff(result.data)
                if (result.data.length > 0) {
                    setSelectedStaffId(result.data[0].id.toString())
                }
            } else {
                toast.error('Lỗi tải danh sách nhân viên')
            }
        } catch (error) {
            console.error('[PayrollManagement] Error:', error)
            toast.error('Lỗi tải danh sách nhân viên')
        } finally {
            setLoading(false)
        }
    }

    // Tạo danh sách tháng (6 tháng gần nhất + 3 tháng tương lai)
    const generateMonths = () => {
        const months = []
        const today = new Date()

        for (let i = -6; i <= 3; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
            months.push(date)
        }

        return months
    }

    const months = generateMonths()
    const selectedStaff = staff.find((s) => s.id === parseInt(selectedStaffId))

    const handleViewPayroll = () => {
        if (!selectedStaffId) {
            toast.error('Vui lòng chọn nhân viên')
            return
        }
        setShowPayrollDialog(true)
    }

    return (
        <div className="space-y-6">
            {/* Header Description */}
            <div className="flex items-center gap-2.5 text-neutral-500 font-medium bg-neutral-100/40 border border-neutral-200/30 rounded-2xl p-4 backdrop-blur-xs">
                <DollarSign className="w-5 h-5 text-primary" />
                <p className="text-sm">Xem chi tiết lương, hoa hồng và các khoản khác của nhân viên</p>
            </div>

            {/* Filters Bento Block */}
            <GlassCard>
                <SectionTitle icon={Calendar} title="Lọc thông tin bảng lương" subtitle="Chọn nhân viên và kỳ lương cần đối soát" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {/* Staff Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Nhân Viên</label>
                        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                            <SelectTrigger className="w-full h-11 rounded-xl border-neutral-200/80 bg-white/50 focus:ring-primary/20">
                                <SelectValue placeholder="Chọn nhân viên..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-neutral-200/80">
                                {staff.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()} className="rounded-lg">
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Month Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Tháng tính lương</label>
                        <Select
                            value={selectedMonth.toISOString()}
                            onValueChange={(val) => setSelectedMonth(new Date(val))}
                        >
                            <SelectTrigger className="w-full h-11 rounded-xl border-neutral-200/80 bg-white/50 focus:ring-primary/20">
                                <SelectValue placeholder="Chọn tháng..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-neutral-200/80">
                                {months.map((month) => (
                                    <SelectItem key={month.toISOString()} value={month.toISOString()} className="rounded-lg">
                                        Tháng {month.getMonth() + 1}/{month.getFullYear()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Button */}
                    <Button onClick={handleViewPayroll} className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold hover:brightness-105 transition-all shadow-md shadow-orange-500/10">
                        <Calendar className="w-4 h-4 mr-2" />
                        Xem Chi Tiết Lương
                    </Button>
                </div>
            </GlassCard>

            {/* Quick Info Box */}
            {selectedStaff && (
                <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-cyan-50/70 p-5 shadow-sm backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] text-blue-600/80 font-bold uppercase tracking-wider">Nhân viên đang xem</p>
                            <p className="font-extrabold text-neutral-800 text-base">{selectedStaff.name}</p>
                        </div>
                    </div>
                    
                    <div className="h-px md:h-8 w-full md:w-px bg-blue-200/40" />

                    <div>
                        <p className="text-[10px] text-blue-600/80 font-bold uppercase tracking-wider">Vị Trí công tác</p>
                        <p className="font-extrabold text-neutral-800 text-sm">{selectedStaff.position || 'N/A'}</p>
                    </div>

                    <div className="h-px md:h-8 w-full md:w-px bg-blue-200/40" />

                    <div>
                        <p className="text-[10px] text-blue-600/80 font-bold uppercase tracking-wider">Kỳ tính lương</p>
                        <p className="font-extrabold text-neutral-800 text-sm">
                            Tháng {selectedMonth.getMonth() + 1}/{selectedMonth.getFullYear()}
                        </p>
                    </div>
                </div>
            )}

            {/* Hướng dẫn tính lương */}
            <GlassCard>
                <SectionTitle icon={Users} title="Hướng Dẫn & Chính Sách Lương" subtitle="Quy chế thưởng hoa hồng theo hiệu suất và ca làm" />
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border border-emerald-100 rounded-2xl p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-3">
                                <Briefcase className="w-5 h-5 text-emerald-600" />
                                <h4 className="font-bold text-emerald-900 text-sm">Ca Hành Chính - 100%</h4>
                            </div>
                            <p className="text-xs text-emerald-800 leading-relaxed">
                                Làm từ 9:00 - 18:00 và hoàn thành toàn bộ khối lượng công việc được giao.
                            </p>
                            <p className="text-xl font-extrabold text-emerald-600 mt-4">+10% Hoa Hồng</p>
                        </div>

                        <div className="border border-blue-100 rounded-2xl p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <h4 className="font-bold text-blue-900 text-sm">Ca Hành Chính - 50%</h4>
                            </div>
                            <p className="text-xs text-blue-800 leading-relaxed">
                                Làm từ 9:00 - 18:00 nhưng phối hợp/chia sẻ công việc với kỹ thuật viên khác.
                            </p>
                            <p className="text-xl font-extrabold text-blue-600 mt-4">+5% Hoa Hồng</p>
                        </div>

                        <div className="border border-rose-100 rounded-2xl p-5 bg-gradient-to-br from-rose-50/50 to-pink-50/50 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-3">
                                <Moon className="w-5 h-5 text-rose-600" />
                                <h4 className="font-bold text-rose-900 text-sm">Ca Ngoài Giờ - 100%</h4>
                            </div>
                            <p className="text-xs text-rose-800 leading-relaxed">
                                Làm việc tăng ca ngoài 9:00 - 18:00 (lịch trễ) và trực tiếp phục vụ khách hàng.
                            </p>
                            <p className="text-xl font-extrabold text-rose-600 mt-4">+30% Hoa Hồng</p>
                        </div>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-5 text-sm text-amber-900 flex gap-3.5 items-start backdrop-blur-xs">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-extrabold text-amber-900 mb-2">📌 Một Số Ghi Chú Quan Trọng:</p>
                            <ul className="space-y-1.5 text-xs text-amber-800 font-medium">
                                <li>• <span className="font-bold">Công thức tính:</span> Thực Lĩnh = Lương Cơ Bản + Tổng Hoa Hồng + Thưởng - Phạt/Bớt.</li>
                                <li>• <span className="font-bold">Đơn giá áp dụng:</span> Hoa hồng được tính dựa trên giá dịch vụ tại thời điểm khách hàng đặt lịch.</li>
                                <li>• <span className="font-bold">Trạng thái hợp lệ:</span> Hệ thống chỉ tính hoa hồng cho các lịch hẹn có trạng thái <span className="font-bold">"Hoàn thành" (completed)</span>.</li>
                                <li>• <span className="font-bold">Phân chia công việc (Work Share):</span> Được tính theo % đóng góp trực tiếp vào dịch vụ đó (100% = làm trọn vẹn, 50% = hai thợ làm chung).</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Payroll Dialog */}
            {selectedStaff && (
                <PayrollDialog
                    staffId={selectedStaff.id}
                    staffName={selectedStaff.name}
                    month={selectedMonth}
                    isOpen={showPayrollDialog}
                    onOpenChange={setShowPayrollDialog}
                />
            )}
        </div>
    )
}
