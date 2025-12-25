'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
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

            console.log('[Component] Response status:', res.status)

            const result = await res.json()

            console.log('[Component] Response data:', result)

            // Check if request was aborted BEFORE calling setState
            if (abortControllerRef.current.signal.aborted) {
                console.log('[Component] Request was aborted')
                return
            }

            if (result.success) {
                console.log('[Component] Setting customers:', result.data.length)
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
            console.log('[Component] Component mounted, fetching customers...')
            fetchCustomers(1)
        }
    }, [isMounted, fetchCustomers])

    // Re-fetch when search or sort changes
    useEffect(() => {
        if (isMounted && debouncedSearch) {
            console.log('[Component] Search changed, refetching...', { debouncedSearch, sortBy })
            fetchCustomers(1)
        }
    }, [debouncedSearch, isMounted, fetchCustomers])

    // Re-fetch when sort changes
    useEffect(() => {
        if (isMounted && sortBy !== 'createdAt') {
            console.log('[Component] Sort changed, refetching...', { sortBy })
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
                <Card>
                    <CardContent className="p-[10px] sm:p-6">
                        <div className="flex justify-center items-center py-8">
                            <p className="text-muted-foreground">Đang tải...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full space-y-4">
            {/* Search and Filter Section */}
            <Card>
                <CardContent className="px-6 sm:px-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Tìm kiếm theo tên, số điện thoại hoặc email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Sort Select */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sắp xếp theo..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="createdAt">Mới Nhất</SelectItem>
                                <SelectItem value="serviceCount">Số Dịch Vụ (Cao Nhất)</SelectItem>
                                <SelectItem value="totalAmount">Tổng Tiêu Xài (Cao Nhất)</SelectItem>
                                <SelectItem value="name">Tên A-Z</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Customers Table/Grid */}
            <Card>
                <CardHeader className="p-[10px] sm:p-6">
                    <CardTitle>Danh Sách Khách Hàng</CardTitle>
                    <CardDescription>
                        Tổng số khách hàng: {pagination.total}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-[10px] sm:p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <p className="text-muted-foreground">Đang tải...</p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex justify-center items-center py-8">
                            <p className="text-muted-foreground">Chưa có khách hàng nào</p>
                        </div>
                    ) : (
                        <div className="max-h-[600px] space-y-3 overflow-y-auto">
                            {customers.map((customer) => {
                                const rank = getRankBadge(customer.serviceCount)
                                return (
                                    <div
                                        key={customer.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="font-medium">{customer.name}</p>
                                                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                                    {customer.email && (
                                                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <p className="text-sm font-medium">{customer.serviceCount} dịch vụ</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatCurrency(customer.totalAmount)} ₫
                                                </p>
                                            </div>

                                            {rank && (
                                                <Badge variant={rank.variant} className="whitespace-nowrap">
                                                    {rank.label}
                                                </Badge>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedCustomerId(customer.id)
                                                    setDetailsDialogOpen(true)
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && customers.length > 0 && (
                        <div className="flex items-center justify-between mt-6 px-2 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Trang {pagination.page} / {pagination.totalPages} | Tổng: {pagination.total} khách hàng
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handlePreviousPage}
                                    disabled={pagination.page === 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={handleNextPage}
                                    disabled={pagination.page === pagination.totalPages}
                                    variant="outline"
                                    size="sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

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
