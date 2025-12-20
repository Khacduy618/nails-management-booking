'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { StaffScheduleDialog } from './staff-schedule-dialog'
import { toast } from 'sonner'
import { Calendar, Mail, Phone } from 'lucide-react'

interface StaffDetailsResponse {
    staff: {
        id: number
        name: string
        email: string | null
        phone: string
        position: string | null
        specialties: string[] | null
        experience: string | null
        status: string
        avatarUrl: string | null
        joinDate: string | null
        createdAt: string
        updatedAt: string
    }
    appointments: Array<{
        id: number
        appointmentDate: string
        appointmentTime: string
        status: string
        customerName: string
        customerPhone: string
        services: Array<{
            name: string
            priceAtBooking: number | null
        }>
    }>
    statistics: {
        totalAppointments: number
        totalRevenue: number
    }
}

interface StaffDetailsDialogProps {
    staffId: number
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function StaffDetailsDialog({
    staffId,
    isOpen,
    onOpenChange,
}: StaffDetailsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StaffDetailsResponse | null>(null)
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [baseSalary, setBaseSalary] = useState<number | null>(null)
    const [baseSalaryNotes, setBaseSalaryNotes] = useState<string | null>(null)
    const [editingBaseSalary, setEditingBaseSalary] = useState(false)
    const [baseSalaryInput, setBaseSalaryInput] = useState('')
    const [baseSalaryNotesInput, setBaseSalaryNotesInput] = useState('')
    const [savingBaseSalary, setSavingBaseSalary] = useState(false)

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

    useEffect(() => {
        if (isOpen && staffId) {
            fetchDetails()
        }
    }, [isOpen, staffId, apiBase])

    const fetchDetails = async () => {
        setLoading(true)

        try {
            const res = await fetch(`${apiBase}/admin/staff/${staffId}`)
            const result = await res.json()

            if (result.success) {
                setData(result.data)

                // Fetch base salary
                const salaryRes = await fetch(`${apiBase}/admin/staff/${staffId}/salary`)
                const salaryResult = await salaryRes.json()
                if (salaryResult.success && salaryResult.data.baseSalary) {
                    setBaseSalary(salaryResult.data.baseSalary)
                    setBaseSalaryInput(salaryResult.data.baseSalary.toString())
                    setBaseSalaryNotes(salaryResult.data.notes || '')
                    setBaseSalaryNotesInput(salaryResult.data.notes || '')
                }

                setLoading(false)
            } else {
                toast.error(result.error?.message || 'Lỗi tải thông tin nhân viên')
                setLoading(false)
            }
        } catch (error) {
            console.error('[StaffDetailsDialog] Error:', error)
            toast.error('Lỗi tải thông tin nhân viên')
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A'
        try {
            const date = new Date(dateStr)
            // Convert to Vietnam timezone (UTC+7)
            const vietnamDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
            return vietnamDate.toLocaleDateString('vi-VN')
        } catch {
            return 'N/A'
        }
    }

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '0 ₫'
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount)
    }

    const handleSaveBaseSalary = async () => {
        const salaryValue = Number(baseSalaryInput)
        if (!baseSalaryInput || isNaN(salaryValue) || salaryValue < 0) {
            toast.error('Vui lòng nhập lương cứng hợp lệ')
            return
        }

        setSavingBaseSalary(true)
        try {
            const res = await fetch(`${apiBase}/admin/staff/${staffId}/salary`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseSalary: salaryValue,
                    notes: baseSalaryNotesInput || null,
                }),
            })

            const result = await res.json()
            if (result.success) {
                setBaseSalary(salaryValue)
                setBaseSalaryNotes(baseSalaryNotesInput || '')
                setEditingBaseSalary(false)
                toast.success('Cập nhật lương cứng thành công')
            } else {
                toast.error(result.error?.message || 'Lỗi cập nhật lương cứng')
            }
        } catch (error) {
            console.error('[StaffDetailsDialog] Save salary error:', error)
            toast.error('Lỗi cập nhật lương cứng')
        } finally {
            setSavingBaseSalary(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <VisuallyHidden>
                    <DialogTitle>Chi tiết nhân viên</DialogTitle>
                </VisuallyHidden>

                {loading ? (
                    <div className="space-y-4 py-8">
                        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                        <Skeleton className="h-6 w-32 mx-auto" />
                        <Skeleton className="h-4 w-24 mx-auto" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                ) : data ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage
                                        src={data.staff.avatarUrl || undefined}
                                        alt={data.staff.name}
                                    />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {data.staff.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {data.staff.name}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                            variant={
                                                data.staff.status === 'active'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {data.staff.status === 'active'
                                                ? 'Hoạt Động'
                                                : 'Không Hoạt Động'}
                                        </Badge>
                                        {data.staff.position && (
                                            <span>{data.staff.position}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <Tabs defaultValue="info" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="info">Thông Tin</TabsTrigger>
                                <TabsTrigger value="services">Chuyên Môn</TabsTrigger>
                                <TabsTrigger value="appointments">
                                    Lịch Hẹn ({data.appointments.length})
                                </TabsTrigger>
                            </TabsList>

                            {/* Info Tab */}
                            <TabsContent value="info" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Ngày Vào
                                        </p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(data.staff.joinDate)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Email
                                        </p>
                                        <p className="font-medium flex items-center gap-2 truncate">
                                            <Mail className="w-4 h-4" />
                                            {data.staff.email || 'Chưa cập nhật'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Số Điện Thoại
                                        </p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {data.staff.phone}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Kinh Nghiệm
                                        </p>
                                        <p className="font-medium">
                                            {data.staff.experience || 'Chưa cập nhật'}
                                        </p>
                                    </div>
                                </div>

                                {/* Base Salary Section */}
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium mb-3">💰 Lương Cứng</p>
                                    {editingBaseSalary ? (
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="baseSalaryInput">Lương Cứng (VND)</Label>
                                                <Input
                                                    id="baseSalaryInput"
                                                    type="number"
                                                    placeholder="Nhập lương cứng"
                                                    value={baseSalaryInput}
                                                    onChange={(e) => setBaseSalaryInput(e.target.value)}
                                                    disabled={savingBaseSalary}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="baseSalaryNotesInput">Ghi Chú</Label>
                                                <Textarea
                                                    id="baseSalaryNotesInput"
                                                    placeholder="Ghi chú về lương (tuỳ chọn)"
                                                    value={baseSalaryNotesInput}
                                                    onChange={(e) => setBaseSalaryNotesInput(e.target.value)}
                                                    disabled={savingBaseSalary}
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveBaseSalary}
                                                    disabled={savingBaseSalary}
                                                >
                                                    {savingBaseSalary ? 'Đang lưu...' : 'Lưu'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingBaseSalary(false)
                                                        setBaseSalaryInput(baseSalary?.toString() || '')
                                                        setBaseSalaryNotesInput(baseSalaryNotes || '')
                                                    }}
                                                    disabled={savingBaseSalary}
                                                >
                                                    Hủy
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-bold text-green-600">
                                                    {baseSalary ? formatCurrency(baseSalary) : 'Chưa cập nhật'}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setEditingBaseSalary(true)}
                                                >
                                                    Chỉnh Sửa
                                                </Button>
                                            </div>
                                            {baseSalaryNotes && (
                                                <div className="bg-muted p-2 rounded text-sm text-muted-foreground">
                                                    <p className="font-medium mb-1">Ghi chú:</p>
                                                    <p>{baseSalaryNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Statistics */}
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium mb-3">Thống Kê</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="border rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold">
                                                {data.statistics.totalAppointments}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Lịch Hẹn
                                            </p>
                                        </div>

                                        <div className="border rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-primary">
                                                {formatCurrency(
                                                    data.statistics.totalRevenue
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Doanh Thu
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Services Tab */}
                            <TabsContent value="services" className="space-y-4">
                                {data.staff.specialties &&
                                    data.staff.specialties.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {data.staff.specialties.map((specialty) => (
                                            <Badge key={specialty} variant="outline">
                                                {specialty}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Chưa cập nhật chuyên môn
                                    </p>
                                )}
                            </TabsContent>

                            {/* Appointments Tab */}
                            <TabsContent value="appointments" className="space-y-3">
                                {data.appointments.length > 0 ? (
                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                        {data.appointments.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="border rounded-lg p-3 text-sm"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-medium">
                                                            {apt.customerName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {apt.customerPhone}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant={
                                                            apt.status === 'confirmed'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {apt.status === 'confirmed'
                                                            ? 'Đã Xác Nhận'
                                                            : 'Đang Chờ'}
                                                    </Badge>
                                                </div>

                                                <p className="text-xs text-muted-foreground mb-2">
                                                    📅{' '}
                                                    {formatDate(apt.appointmentDate)} |{' '}
                                                    🕐 {apt.appointmentTime}
                                                </p>

                                                <div className="flex flex-wrap gap-1">
                                                    {apt.services.map((service, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {service.name}{' '}
                                                            {service.priceAtBooking &&
                                                                `(${formatCurrency(
                                                                    service.priceAtBooking
                                                                )})`}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Chưa có lịch hẹn nào
                                    </p>
                                )}
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="flex gap-2 justify-end">
                            <Button
                                type="button"
                                variant="default"
                                onClick={() => setShowScheduleModal(true)}
                            >
                                📅 Lịch Làm
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Đóng
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Lỗi tải thông tin nhân viên</p>
                    </div>
                )}
            </DialogContent>

            {/* Staff Schedule Modal */}
            {data && (
                <StaffScheduleDialog
                    staffId={data.staff.id}
                    staffName={data.staff.name}
                    isOpen={showScheduleModal}
                    onOpenChange={setShowScheduleModal}
                />
            )}
        </Dialog>
    )
}
