'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import type { CustomerDetail, AppointmentStatus } from '@/types'
import { toast } from 'sonner'

interface CustomerDetailsDialogProps {
    customerId: number
    customerName: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function CustomerDetailsDialog({
    customerId,
    customerName,
    isOpen,
    onOpenChange,
}: CustomerDetailsDialogProps) {
    const [loading, setLoading] = useState(false)
    const [details, setDetails] = useState<CustomerDetail | null>(null)

    useEffect(() => {
        if (isOpen && customerId) {
            fetchCustomerDetails()
        }
    }, [isOpen, customerId])

    const fetchCustomerDetails = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/admin/customers/${customerId}`)
            const result = await response.json()

            if (result.success && result.data) {
                setDetails(result.data as CustomerDetail)
            } else {
                toast.error('Không thể tải thông tin khách hàng')
            }
        } catch (error) {
            console.error('[Dialog] Error fetching customer details:', error)
            toast.error('Lỗi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    if (!details && loading) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogTitle className="sr-only">Đang tải chi tiết khách hàng</DialogTitle>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!details) {
        return null
    }

    const { customer, appointments, servicesSummary, statistics } = details

    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(num)
    }

    const getStatusBadge = (status: AppointmentStatus) => {
        const statusConfig: Record<AppointmentStatus, { label: string; variant: any }> = {
            'pending': { label: 'Chờ xác nhận', variant: 'secondary' },
            'confirmed': { label: 'Đã xác nhận', variant: 'default' },
            'completed': { label: 'Hoàn thành', variant: 'default' },
            'cancelled': { label: 'Đã hủy', variant: 'destructive' },
            'in-progress': { label: 'Đang thực hiện', variant: 'default' },
        }
        const config = statusConfig[status] || { label: status, variant: 'secondary' }
        return <Badge variant={config.variant as any}>{config.label}</Badge>
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Chi tiết khách hàng: {customer.name}</DialogTitle>
                    <DialogDescription>
                        Xem thông tin đầy đủ về khách hàng và lịch sử dịch vụ
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="info">Thông tin</TabsTrigger>
                        <TabsTrigger value="services">Dịch vụ</TabsTrigger>
                        <TabsTrigger value="appointments">Lịch hẹn</TabsTrigger>
                    </TabsList>

                    {/* Tab: Thông tin khách hàng */}
                    <TabsContent value="info" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-sm text-gray-600">Tên khách hàng</h3>
                                <p className="text-lg font-medium">{customer.name}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-gray-600">Số điện thoại</h3>
                                <p className="text-lg font-medium">{customer.phone}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-gray-600">Email</h3>
                                <p className="text-lg font-medium">{customer.email || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-gray-600">Ngày đăng ký</h3>
                                <p className="text-lg font-medium">
                                    {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        {customer.notes && (
                            <div>
                                <h3 className="font-semibold text-sm text-gray-600">Ghi chú</h3>
                                <p className="text-base">{customer.notes}</p>
                            </div>
                        )}

                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-semibold mb-3">Thống kê</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-gray-600 text-sm">Tổng lịch hẹn</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {statistics.totalAppointments}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-gray-600 text-sm">Tổng dịch vụ</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {statistics.totalServices}
                                    </p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-gray-600 text-sm">Tổng chi tiêu</p>
                                    <p className="text-xl font-bold text-purple-600">
                                        {formatCurrency(statistics.totalAmount)}
                                    </p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <p className="text-gray-600 text-sm">Lịch hẹn cuối</p>
                                    <p className="text-sm font-medium text-orange-600">
                                        {statistics.lastAppointmentDate
                                            ? new Date(statistics.lastAppointmentDate).toLocaleDateString('vi-VN')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab: Dịch vụ đã sử dụng */}
                    <TabsContent value="services" className="mt-4">
                        {servicesSummary.length > 0 ? (
                            <ScrollArea className="h-[400px] rounded-md border p-4">
                                <div className="space-y-3">
                                    {servicesSummary.map((service, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm">{service.serviceName}</h4>
                                                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                                    <span>Giá: <span className="font-medium">{formatCurrency(service.price)}</span></span>
                                                    <span>Lần sử dụng: <span className="font-medium">{service.count}</span></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">Tổng tiền</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {formatCurrency(service.totalAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Chưa có dịch vụ nào</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Lịch hẹn */}
                    <TabsContent value="appointments" className="mt-4">
                        {appointments.length > 0 ? (
                            <ScrollArea className="h-[400px] rounded-md border p-4">
                                <div className="space-y-3">
                                    {appointments.map((apt) => (
                                        <div
                                            key={apt.appointmentId}
                                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-semibold">
                                                        {new Date(apt.appointmentDate).toLocaleDateString('vi-VN')} {apt.appointmentTime}
                                                    </h4>
                                                </div>
                                                {getStatusBadge(apt.status)}
                                            </div>

                                            {apt.services.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {apt.services.map((service, sidx) => (
                                                        <div key={sidx} className="flex justify-between text-sm text-gray-600">
                                                            <span>• {service.name}</span>
                                                            <span>{formatCurrency(service.price)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                                <p className="text-xs text-gray-500">
                                                    {new Date(apt.createdAt).toLocaleDateString('vi-VN')}
                                                </p>
                                                <p className="font-semibold">
                                                    Tổng: {formatCurrency(apt.totalPrice)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Chưa có lịch hẹn nào</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
