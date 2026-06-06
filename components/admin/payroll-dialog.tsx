'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { TrendingUp } from 'lucide-react'
import { formatCurrency, formatMonthYear } from '@/lib/payroll-utils'

interface PayrollDialogProps {
    staffId: number
    staffName: string
    month: Date
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

interface CommissionDetail {
    appointmentServiceId: number
    appointmentId: number
    serviceId: number
    date: string
    time: string
    price: number
    workShare: number
    isOvertime: boolean
    otReason?: string
    percentage: number
    amount: number
}

interface PayrollResponse {
    staffId: number
    staffName: string
    payPeriodStart: string
    payPeriodEnd: string
    baseSalary: number
    totalCommission: number
    totalBonus: number
    totalDeduction: number
    finalSalary: number
    commissionDetails: CommissionDetail[]
}

export function PayrollDialog({
    staffId,
    staffName,
    month,
    isOpen,
    onOpenChange,
}: PayrollDialogProps) {
    const [loading, setLoading] = useState(false)
    const [payroll, setPayroll] = useState<PayrollResponse | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 12

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1)
            fetchPayroll()
        }
    }, [isOpen, staffId, month, apiBase])

    const fetchPayroll = async () => {
        setLoading(true)
        try {
            const year = month.getFullYear()
            const monthNum = month.getMonth()
            const startDate = new Date(year, monthNum, 1).toISOString().split('T')[0]
            const endDate = new Date(year, monthNum + 1, 0).toISOString().split('T')[0]

            const res = await fetch(
                `${apiBase}/admin/payroll?staffId=${staffId}&startDate=${startDate}&endDate=${endDate}`
            )
            const result = await res.json()

            if (result.success) {
                setPayroll(result.data)
            } else {
                toast.error(result.error?.message || 'Lỗi tải bảng lương')
            }
        } catch (error) {
            console.error('[PayrollDialog] Fetch error:', error)
            toast.error('Lỗi tải bảng lương')
        } finally {
            setLoading(false)
        }
    }

    const getCommissionBadge = (percentage: number) => {
        if (percentage === 30) return <Badge className="bg-red-500">OT 30%</Badge>
        if (percentage === 10) return <Badge className="bg-green-500">10%</Badge>
        if (percentage === 5) return <Badge className="bg-blue-500">50% 5%</Badge>
        return <Badge variant="secondary">0%</Badge>
    }

    // Pagination logic
    const getPaginatedData = () => {
        if (!payroll?.commissionDetails) return []
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
        const endIdx = startIdx + ITEMS_PER_PAGE
        return payroll.commissionDetails.slice(startIdx, endIdx)
    }

    const getTotalPages = () => {
        if (!payroll?.commissionDetails) return 1
        return Math.ceil(payroll.commissionDetails.length / ITEMS_PER_PAGE)
    }

    const paginatedData = getPaginatedData()
    const totalPages = getTotalPages()

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] max-h-[85vh] overflow-y-auto rounded-3xl border border-neutral-200 bg-white/95 backdrop-blur-lg p-6 shadow-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-extrabold text-neutral-800 flex items-center gap-2">
                        <span>💰 Bảng Lương - {staffName}</span>
                        <span className="text-sm font-bold text-muted-foreground bg-neutral-100 px-3 py-1 rounded-full border">
                            {formatMonthYear(month.toISOString())}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </div>
                ) : payroll ? (
                    <div className="space-y-6">
                        {/* Tóm tắt lương bento grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="border border-neutral-200/60 rounded-2xl p-4 bg-white/50 hover:shadow-sm transition-shadow">
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Lương Cơ Bản</p>
                                <p className="text-2xl font-extrabold text-neutral-800 mt-1">{formatCurrency(payroll.baseSalary)}</p>
                            </div>

                            <div className="border border-green-100 rounded-2xl p-4 bg-gradient-to-br from-green-50/40 to-emerald-50/40 hover:shadow-sm transition-shadow">
                                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Tổng Hoa Hồng</p>
                                <p className="text-2xl font-extrabold text-green-600 mt-1">
                                    {formatCurrency(payroll.totalCommission)}
                                </p>
                            </div>

                            <div className="border border-primary/20 rounded-2xl p-4 bg-gradient-to-br from-orange-50/40 to-pink-50/40 shadow-sm">
                                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Thực Lĩnh (Final)</p>
                                <p className="text-2xl font-black text-primary mt-1">
                                    {formatCurrency(payroll.finalSalary)}
                                </p>
                            </div>
                        </div>

                        {/* Chi tiết hoa hồng */}
                        {payroll.commissionDetails && payroll.commissionDetails.length > 0 ? (
                            <div className="border border-neutral-200/60 rounded-2xl p-5 bg-white/30 backdrop-blur-xs">
                                <h3 className="font-extrabold text-neutral-800 text-sm mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Chi Tiết Hoa Hồng Phục Vụ ({payroll.commissionDetails.length} dịch vụ)
                                </h3>

                                <div className="overflow-hidden rounded-xl border border-neutral-200/50 bg-white/40">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-neutral-200 bg-neutral-100/50 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                                                    <th className="text-left p-3">Ngày</th>
                                                    <th className="text-left p-3">Giờ</th>
                                                    <th className="text-right p-3">Đơn Giá</th>
                                                    <th className="text-center p-3">Công Việc</th>
                                                    <th className="text-center p-3">Loại Ca</th>
                                                    <th className="text-center p-3">Tỷ Lệ</th>
                                                    <th className="text-left p-3 max-w-[150px]">Ghi chú ca trễ</th>
                                                    <th className="text-right p-3 pr-4">Hoa Hồng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData.map((item, idx) => (
                                                    <tr key={idx} className="border-b border-neutral-200/50 hover:bg-neutral-50/50 transition-colors">
                                                        <td className="p-3 text-neutral-600">
                                                            {new Date(item.date).toLocaleDateString('vi-VN')}
                                                        </td>
                                                        <td className="p-3 font-semibold text-neutral-800">{item.time.substring(0, 5)}</td>
                                                        <td className="text-right p-3 font-bold text-neutral-700">
                                                            {formatCurrency(item.price)}
                                                        </td>
                                                        <td className="text-center p-3">
                                                            <Badge variant="outline" className="border-neutral-300 text-neutral-600 bg-white/60 font-semibold">
                                                                {item.workShare}%
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center p-3">
                                                            {getCommissionBadge(item.percentage)}
                                                        </td>
                                                        <td className="text-center p-3 font-bold text-neutral-800">
                                                            {item.percentage}%
                                                        </td>
                                                        <td className="p-3 text-neutral-500 max-w-[150px] truncate">
                                                            {item.otReason || '—'}
                                                        </td>
                                                        <td className="text-right p-3 pr-4 font-extrabold text-green-600">
                                                            {formatCurrency(item.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-neutral-50 font-bold border-t border-neutral-200">
                                                <tr>
                                                    <td colSpan={7} className="text-right p-3 text-neutral-600 text-xs">
                                                        Tổng Hoa Hồng Kỳ Này:
                                                    </td>
                                                    <td className="text-right p-3 pr-4 text-green-600 text-sm font-extrabold">
                                                        {formatCurrency(payroll.totalCommission)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200/60">
                                        <div className="text-[11px] font-medium text-neutral-500">
                                            Trang {currentPage} / {totalPages} (hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, payroll.commissionDetails.length)} trong tổng số {payroll.commissionDetails.length} dòng)
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Trước
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Sau
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="border border-dashed border-neutral-200 rounded-2xl p-8 text-center text-muted-foreground bg-white/40">
                                Không có lịch hẹn hoàn thành phát sinh hoa hồng trong kỳ này.
                            </div>
                        )}

                        {/* Ghi chú về cách tính */}
                        <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
                            <p className="font-extrabold text-blue-950 mb-1">Quy định tính phần trăm hoa hồng:</p>
                            <ul className="space-y-1 text-blue-800 font-medium list-disc list-inside">
                                <li>Phục vụ giờ hành chính (trước 17:00) và làm trọn vẹn: <span className="font-bold">10%</span></li>
                                <li>Phục vụ giờ hành chính (trước 17:00) và hợp tác chia việc (50%): <span className="font-bold">5%</span></li>
                                <li>Tăng ca ngoài giờ hành chính (từ 17:00 trở đi) và làm trọn vẹn: <span className="font-bold">30%</span></li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        Không tìm thấy dữ liệu lương của nhân viên trong kỳ này.
                    </div>
                )}

                <DialogFooter className="mt-4 pt-4 border-t border-neutral-100">
                    <Button type="button" variant="outline" className="rounded-xl h-10 px-5" onClick={() => onOpenChange(false)}>
                        Đóng cửa sổ
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
