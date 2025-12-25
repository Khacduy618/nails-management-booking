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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PayrollDialog } from './payroll-dialog'
import { toast } from 'sonner'
import { DollarSign, Calendar, Users } from 'lucide-react'

interface Staff {
    id: number
    name: string
    position: string | null
    status: string
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

    const handlePreviousMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-5 h-5" />
                <p>Xem chi tiết lương, hoa hồng và các khoản khác</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Staff Selection */}
                        <div className="flex flex-row gap-2 items-center">
                            <label>Nhân Viên</label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn nhân viên..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Month Selection */}
                        <div className="flex flex-row gap-2 items-center">
                            <label>Tháng</label>
                            <Select
                                value={selectedMonth.toISOString()}
                                onValueChange={(val) => setSelectedMonth(new Date(val))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tháng..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month) => (
                                        <SelectItem key={month.toISOString()} value={month.toISOString()}>
                                            Tháng {month.getMonth() + 1}/{month.getFullYear()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Button */}
                        <Button onClick={handleViewPayroll} className="w-full">
                            <Calendar className="w-4 h-4 mr-2" />
                            Xem Bảng Lương
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            {selectedStaff && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-row gap-2 items-center">
                                <p className="text-sm text-muted-foreground">Nhân Viên</p>
                                <p className="font-semibold">{selectedStaff.name}</p>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <p className="text-sm text-muted-foreground">Vị Trí</p>
                                <p className="font-semibold">{selectedStaff.position || 'N/A'}</p>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <p className="text-sm text-muted-foreground">Tháng</p>
                                <p className="font-semibold">
                                    Tháng {selectedMonth.getMonth() + 1}/{selectedMonth.getFullYear()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Hướng dẫn tính lương */}
            <Card>
                <CardHeader className="p-[10px] sm:p-6">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Hướng Dẫn Tính Lương
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-[10px] sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                            <h4 className="font-semibold text-green-900 mb-2">💼 Giờ Hành Chính - 100%</h4>
                            <p className="text-sm text-green-800">
                                Làm từ 9:00-18:00 và hoàn thành 100% công việc
                            </p>
                            <p className="text-lg font-bold text-green-600 mt-2">+10% Hoa Hồng</p>
                        </div>

                        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">⏱️ Giờ Hành Chính - 50%</h4>
                            <p className="text-sm text-blue-800">
                                Làm từ 9:00-18:00 nhưng hoàn thành 50% công việc
                            </p>
                            <p className="text-lg font-bold text-blue-600 mt-2">+5% Hoa Hồng</p>
                        </div>

                        <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                            <h4 className="font-semibold text-red-900 mb-2">🌙 Ngoài Giờ - 100%</h4>
                            <p className="text-sm text-red-800">
                                Làm ngoài 9:00-18:00 và hoàn thành 100% công việc
                            </p>
                            <p className="text-lg font-bold text-red-600 mt-2">+30% Hoa Hồng</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                        <p className="font-semibold mb-2">📌 Ghi Chú:</p>
                        <ul className="space-y-1">
                            <li>• Lương = Lương Cứng + Hoa Hồng + Thưởng - Bớt</li>
                            <li>• Hoa hồng được tính trên giá dịch vụ tại thời điểm đặt lịch</li>
                            <li>• Chỉ tính hoa hồng cho các lịch hẹn đã "hoàn thành" (completed)</li>
                            <li>• Công việc được chia sẻ (work_share) tính theo %: 100% = toàn bộ, 50% = nửa</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

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
