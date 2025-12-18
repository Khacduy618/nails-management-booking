"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    type: 'revenue' | 'appointments' | 'customers' | 'services' | null
    title: string
    data: any[]
    loading?: boolean
    staffTotalRevenue?: number
}

const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M₫`
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K₫`
    } else {
        return `${value}₫`
    }
}

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    } catch {
        return dateString
    }
}

export function DetailModal({ open, onOpenChange, type, title, data, loading, staffTotalRevenue }: DetailModalProps) {
    const renderRevenueByService = () => (
        <div className="w-full overflow-x-auto -mx-6 px-6">
            <Table className="text-sm">
                <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-foreground font-semibold whitespace-nowrap">Tên dịch vụ</TableHead>
                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">Số lần</TableHead>
                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">Doanh thu</TableHead>
                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">% Doanh thu</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-border">
                            <TableCell className="text-foreground font-medium whitespace-nowrap">{item.serviceName || 'N/A'}</TableCell>
                            <TableCell className="text-right text-muted-foreground whitespace-nowrap">{item.count || 0}</TableCell>
                            <TableCell className="text-right text-foreground font-semibold whitespace-nowrap">{formatCurrency(item.totalRevenue || 0)}</TableCell>
                            <TableCell className="text-right text-muted-foreground whitespace-nowrap">{item.percentage || 0}%</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )

    const renderAppointmentsList = () => (
        <div className="w-full overflow-x-auto -mx-6 px-6">
            <Table className="text-sm">
                <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-foreground font-semibold whitespace-nowrap">Ngày hẹn</TableHead>
                        <TableHead className="text-foreground font-semibold whitespace-nowrap">Khách hàng</TableHead>
                        <TableHead className="text-foreground font-semibold whitespace-nowrap">Điện thoại</TableHead>
                        <TableHead className="text-foreground font-semibold whitespace-nowrap">Dịch vụ</TableHead>
                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">Giá tiền</TableHead>
                        <TableHead className="text-foreground font-semibold whitespace-nowrap">Trạng thái</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-border cursor-pointer hover:bg-accent/50">
                            <TableCell className="text-foreground font-medium whitespace-nowrap">
                                {formatDate(item.appointmentDate || item.date || '')}
                            </TableCell>
                            <TableCell className="text-foreground whitespace-nowrap">{item.customerName || item.name || 'N/A'}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{item.customerPhone || item.phone || 'N/A'}</TableCell>
                            <TableCell className="text-foreground whitespace-nowrap">
                                {item.serviceName || item.services?.map((s: any) => s.name).join(', ') || 'N/A'}
                            </TableCell>
                            <TableCell className="text-right text-foreground font-semibold whitespace-nowrap">
                                {formatCurrency(item.priceAtBooking || item.price || 0)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                                    {item.status === 'completed' ? 'Hoàn thành' : item.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )

    const renderCustomersList = () => (
        <div className="w-full overflow-x-auto -mx-6 px-6">
            <Table className="text-sm">
                <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-foreground font-semibold whitespace-nowrap">Tên khách hàng</TableHead>
                        <TableHead className="text-foreground font-semibold whitespace-nowrap">Số điện thoại</TableHead>
                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">Số lịch hẹn</TableHead>
                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">Tổng chi tiêu</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-border">
                            <TableCell className="text-foreground font-medium whitespace-nowrap">{item.customerName || item.name || 'N/A'}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{item.customerPhone || item.phone || 'N/A'}</TableCell>
                            <TableCell className="text-right text-foreground whitespace-nowrap">{item.appointmentCount || item.appointments || 0}</TableCell>
                            <TableCell className="text-right text-foreground font-semibold whitespace-nowrap">
                                {formatCurrency(parseFloat(String(item.totalSpent || item.totalRevenue || 0)))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            )
        }

        if (!data || data.length === 0) {
            return (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Không có dữ liệu để hiển thị</AlertDescription>
                </Alert>
            )
        }

        switch (type) {
            case 'revenue':
                return renderRevenueByService()
            case 'appointments':
                return renderAppointmentsList()
            case 'customers':
                return renderCustomersList()
            default:
                return <div>Unknown type</div>
        }
    }

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => onOpenChange(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                                {staffTotalRevenue !== undefined && (
                                    <p className="text-lg font-semibold text-primary mt-2">
                                        Tổng doanh thu: {Math.round(staffTotalRevenue).toLocaleString('vi-VN')}₫
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
                            >
                                <X className="h-6 w-6 text-slate-600 hover:text-slate-900" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
