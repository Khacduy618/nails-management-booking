'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight, Eye, Users } from 'lucide-react'
import { toast } from 'sonner'
import { ApiCustomer, PaginationInfo } from '@/types'
import { CustomerDetailsDialog } from './customer-details-dialog'

interface Customer extends ApiCustomer { }

const ITEMS_PER_PAGE = 12

// Format currency safely (server & client compatible)
const formatCurrency = (amount: string | number): string => {
    try {
        return parseFloat(String(amount)).toLocaleString('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
    } catch {
        return '0'
    }
}

export function CustomersManagement() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [isMounted, setIsMounted] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: ITEMS_PER_PAGE,
        total: 0,
        totalPages: 1,
    })

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')
    const abortControllerRef = useRef<AbortController | null>(null)

    // Only mount on client
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch customers - with abort controller to prevent setState on unmount
    const fetchCustomers = useCallback(async (page = 1) => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        setLoading(true)

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                search: debouncedSearch,
                sort: sortBy,
            })

            console.log('[Component] Fetching customers:', { page, search: debouncedSearch, sort: sortBy })

            const res = await fetch(`${apiBase}/admin/customers?${params}`, {
                signal: abortControllerRef.current.signal,
            })

            const result = await res.json()

            // Check if request was aborted BEFORE calling setState
            if (abortControllerRef.current.signal.aborted) {
                console.log('[Component] Request was aborted')
                return
            }

            if (result.success) {
                setCustomers(result.data)
                setPagination(result.meta)
                setLoading(false)
            } else {
                console.error('[Component] API error:', result.error)
                if (!abortControllerRef.current.signal.aborted) {
                    toast.error(`Lỗi: ${result.error?.message || 'Không thể tải khách hàng'}`)
                }
                setLoading(false)
            }
        } catch (error) {
            // Ignore abort errors
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('[Component] Fetch aborted')
                return
            }

            console.error('[Component] Fetch error:', error)

            // Only show toast if not aborted
            if (!abortControllerRef.current.signal.aborted) {
                toast.error('Lỗi tải khách hàng')
                setLoading(false)
            }
        }
    }, [debouncedSearch, sortBy, apiBase])

    // Initial fetch when component mounts
    useEffect(() => {
        if (isMounted) {
            fetchCustomers(1)
        }
    }, [isMounted, fetchCustomers])

    // Re-fetch when search or sort changes
    useEffect(() => {
        if (isMounted && debouncedSearch) {
            fetchCustomers(1)
        }
    }, [debouncedSearch, isMounted, fetchCustomers])

    // Re-fetch when sort changes
    useEffect(() => {
        if (isMounted && sortBy !== 'createdAt') {
            fetchCustomers(1)
        }
    }, [sortBy, isMounted, fetchCustomers])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    // Get rank badge based on service count
    const getRankBadge = (serviceCount: number) => {
        if (serviceCount >= 20) return { label: 'VIP', variant: 'default' as const }
        if (serviceCount >= 10) return { label: 'Gold', variant: 'secondary' as const }
        if (serviceCount >= 5) return { label: 'Silver', variant: 'outline' as const }
        return null
    }

    const handlePreviousPage = useCallback(() => {
        if (pagination.page > 1) {
            fetchCustomers(pagination.page - 1)
        }
    }, [pagination.page, fetchCustomers])

    const handleNextPage = useCallback(() => {
        if (pagination.page < pagination.totalPages) {
            fetchCustomers(pagination.page + 1)
        }
    }, [pagination.page, pagination.totalPages, fetchCustomers])

    // Don't render until mounted (prevent hydration mismatch)
    if (!isMounted) {
        return (
            <div className="w-full space-y-4">
                <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                    <div className="flex justify-center items-center py-8">
                        <p className="text-sm font-semibold text-neutral-500">Đang tải...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-4">
            {/* Search and Filter Section */}
            <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-5 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Tìm kiếm theo tên, số điện thoại hoặc email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 rounded-xl border-neutral-200/80 bg-white/50 focus:ring-primary/20"
                        />
                    </div>

                    {/* Sort Select */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full h-10 rounded-xl border-neutral-200/80 bg-white/50 focus:ring-primary/20">
                            <SelectValue placeholder="Sắp xếp theo..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-neutral-200/80">
                            <SelectItem value="createdAt" className="rounded-lg">Mới Nhất</SelectItem>
                            <SelectItem value="serviceCount" className="rounded-lg">Số Dịch Vụ (Cao Nhất)</SelectItem>
                            <SelectItem value="totalAmount" className="rounded-lg">Tổng Tiêu Xài (Cao Nhất)</SelectItem>
                            <SelectItem value="name" className="rounded-lg">Tên A-Z</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Customers Table/Grid */}
            <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-6 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-800 tracking-tight">Danh Sách Khách Hàng</h2>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                            Tổng số khách hàng: {pagination.total}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 mt-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <p className="text-sm font-semibold text-neutral-500">Đang tải...</p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex justify-center items-center py-8 border border-dashed border-neutral-200 rounded-2xl bg-white/40">
                            <p className="text-sm font-semibold text-neutral-500">Chưa có khách hàng nào</p>
                        </div>
                    ) : (
                        <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
                            {customers.map((customer) => {
                                const rank = getRankBadge(customer.serviceCount)
                                return (
                                    <div
                                        key={customer.id}
                                        className="flex items-center justify-between p-4 border border-neutral-200/40 rounded-2xl hover:bg-neutral-50/50 hover:border-neutral-300/60 bg-white/50 transition-all duration-300 shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-neutral-800 truncate text-sm sm:text-base capitalize">{customer.name}</p>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-neutral-500 font-semibold mt-1">
                                                        <span>📱 {customer.phone}</span>
                                                        {customer.email && (
                                                            <span className="hidden sm:inline">|</span>
                                                        )}
                                                        {customer.email && (
                                                            <span className="truncate">📧 {customer.email}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-right shrink-0">
                                            <div>
                                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{customer.serviceCount} dịch vụ</p>
                                                <p className="text-sm font-black text-orange-600 mt-0.5">
                                                    {formatCurrency(customer.totalAmount)} ₫
                                                </p>
                                            </div>

                                            {rank && (
                                                <Badge className={
                                                    rank.label === 'VIP' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold px-3.5 py-1 rounded-full' :
                                                    rank.label === 'Gold' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold px-3 py-1 rounded-full' :
                                                    'bg-neutral-100 border-neutral-300 text-neutral-600 font-bold px-3 py-1 rounded-full'
                                                }>
                                                    {rank.label}
                                                </Badge>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-9 w-9 rounded-xl p-0 hover:bg-neutral-50 border-neutral-200"
                                                onClick={() => {
                                                    setSelectedCustomerId(customer.id)
                                                    setDetailsDialogOpen(true)
                                                }}
                                            >
                                                <Eye className="w-4 h-4 text-neutral-500" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && customers.length > 0 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200/60">
                            <div className="text-xs font-bold text-neutral-500">
                                Trang {pagination.page} / {pagination.totalPages} | Tổng số {pagination.total} khách hàng
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handlePreviousPage}
                                    disabled={pagination.page === 1}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={handleNextPage}
                                    disabled={pagination.page === pagination.totalPages}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedCustomerId && (
                <CustomerDetailsDialog
                    customerId={selectedCustomerId}
                    customerName={customers.find(c => c.id === selectedCustomerId)?.name || 'Khách hàng'}
                    isOpen={detailsDialogOpen}
                    onOpenChange={setDetailsDialogOpen}
                />
            )}
        </div>
    )
}
