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
            <DialogContent className="sm:max-w-[1000px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        💰 Bảng Lương - {staffName} ({formatMonthYear(month.toISOString())})
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : payroll ? (
                    <div className="space-y-6">
                        {/* Tóm tắt lương */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="border rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">Lương Cứng</p>
                                <p className="text-lg font-bold">{formatCurrency(payroll.baseSalary)}</p>
                            </div>

                            <div className="border rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">Hoa Hồng</p>
                                <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(payroll.totalCommission)}
                                </p>
                            </div>



                            <div className="border rounded-lg p-3 bg-primary/5">
                                <p className="text-xs text-muted-foreground font-semibold">Lương Cuối</p>
                                <p className="text-lg font-bold text-primary">
                                    {formatCurrency(payroll.finalSalary)}
                                </p>
                            </div>
                        </div>

                        {/* Chi tiết hoa hồng */}
                        {payroll.commissionDetails && payroll.commissionDetails.length > 0 ? (
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Chi Tiết Hoa Hồng ({payroll.commissionDetails.length} dịch vụ)
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b bg-muted/50">
                                            <tr>
                                                <th className="text-left p-2">Ngày</th>
                                                <th className="text-left p-2">Giờ</th>
                                                <th className="text-right p-2">Giá</th>
                                                <th className="text-center p-2">Công Việc</th>
                                                <th className="text-center p-2">Loại</th>
                                                <th className="text-center p-2">%</th>
                                                <th className="text-left p-2 text-xs">Lý Do</th>
                                                <th className="text-right p-2">Hoa Hồng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedData.map((item, idx) => (
                                                <tr key={idx} className="border-b hover:bg-muted/30">
                                                    <td className="p-2">
                                                        {new Date(item.date).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="p-2 font-medium">{item.time.substring(0, 5)}</td>
                                                    <td className="text-right p-2 font-medium">
                                                        {formatCurrency(item.price)}
                                                    </td>
                                                    <td className="text-center p-2">
                                                        <Badge variant="outline">{item.workShare}%</Badge>
                                                    </td>
                                                    <td className="text-center p-2">
                                                        {getCommissionBadge(item.percentage)}
                                                    </td>
                                                    <td className="text-center p-2 font-semibold">
                                                        {item.percentage}%
                                                    </td>
                                                    <td className="p-2 text-xs text-muted-foreground max-w-[150px]">
                                                        {item.otReason || 'N/A'}
                                                    </td>
                                                    <td className="text-right p-2 font-semibold text-green-600">
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t bg-muted/50 font-semibold">
                                            <tr>
                                                <td colSpan={7} className="text-right p-2">
                                                    Tổng Hoa Hồng:
                                                </td>
                                                <td className="text-right p-2 text-green-600">
                                                    {formatCurrency(payroll.totalCommission)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                        <div className="text-sm text-muted-foreground">
                                            Trang {currentPage} / {totalPages} ({(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, payroll.commissionDetails.length)} / {payroll.commissionDetails.length})
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                ← Trước
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Sau →
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Ghi chú về dữ liệu */}
                                {/* <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700">
                                    <p className="font-semibold mb-2">📊 Dữ liệu Hoa Hồng được tính từ:</p>
                                    <ul className="space-y-1">
                                        <li>✓ <span className="font-semibold">Lịch hẹn hoàn thành:</span> Từ bảng `appointments` (status = "completed")</li>
                                        <li>✓ <span className="font-semibold">Chi tiết dịch vụ:</span> Từ bảng `appointment_services` (giá, hoa hồng %)</li>
                                        <li>✓ <span className="font-semibold">Nhân viên gán:</span> Từ cột `staff_id` trong `appointment_services`</li>
                                        <li>✓ <span className="font-semibold">Công việc (%):</span> Từ cột `work_share` (50% = hợp tác, 100% = toàn bộ)</li>
                                        <li>✓ <span className="font-semibold">Thời gian hoàn thành:</span> Từ `appointment_time` của lịch hẹn</li>
                                    </ul>
                                </div> */}
                            </div>
                        ) : (
                            <div className="border rounded-lg p-4 text-center text-muted-foreground">
                                Không có dịch vụ hoàn thành trong tháng này
                            </div>
                        )}

                        {/* Ghi chú về cách tính */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                            <p className="font-semibold text-blue-900 mb-2">Cách Tính Hoa Hồng:</p>
                            <ul className="space-y-1 text-blue-800">
                                <li>• <span className="font-semibold">10%:</span> Hoàn thành trước 17:00 + 100% công việc</li>
                                <li>• <span className="font-semibold">5%:</span> Hoàn thành trước 17:00 + 50% công việc (hợp tác)</li>
                                <li>• <span className="font-semibold">OT 30%:</span> Hoàn thành từ 17:00 trở đi + 100% công việc (ngoài giờ)</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Không tìm thấy dữ liệu lương
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
