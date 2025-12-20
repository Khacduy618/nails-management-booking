'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { ApiStaff, PaginationInfo } from '@/types'
import { StaffFormDialog } from './staff-form-dialog'
import { StaffDetailsDialog } from './staff-details-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const ITEMS_PER_PAGE = 12

export function StaffManagement() {
  const [staffList, setStaffList] = useState<ApiStaff[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isMounted, setIsMounted] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  })

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<ApiStaff | null>(null)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchStaff = useCallback(async (page = 1) => {
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

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      } console.log('[StaffManagement] Fetching staff:', { page, search: debouncedSearch, sort: sortBy, status: statusFilter })

      const res = await fetch(`${apiBase}/admin/staff?${params}`, {
        signal: abortControllerRef.current.signal,
      })

      const result = await res.json()

      if (abortControllerRef.current.signal.aborted) {
        return
      }

      if (result.success) {
        console.log('[StaffManagement] Setting staff:', result.data.length)
        setStaffList(result.data)
        setPagination(result.meta)
        setLoading(false)
      } else {
        console.error('[StaffManagement] API error:', result.error)
        toast.error(`Lỗi: ${result.error?.message || 'Không thể tải nhân viên'}`)
        setLoading(false)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[StaffManagement] Fetch aborted')
        return
      }

      console.error('[StaffManagement] Fetch error:', error)

      if (!abortControllerRef.current.signal.aborted) {
        toast.error('Lỗi tải nhân viên')
        setLoading(false)
      }
    }
  }, [debouncedSearch, sortBy, statusFilter, apiBase])

  useEffect(() => {
    if (isMounted) {
      console.log('[StaffManagement] Component mounted, fetching staff...')
      fetchStaff(1)
    }
  }, [isMounted, fetchStaff])

  useEffect(() => {
    if (isMounted && debouncedSearch) {
      console.log('[StaffManagement] Search changed, refetching...')
      fetchStaff(1)
    }
  }, [debouncedSearch, isMounted, fetchStaff])

  useEffect(() => {
    if (isMounted && sortBy !== 'createdAt') {
      console.log('[StaffManagement] Sort changed, refetching...')
      fetchStaff(1)
    }
  }, [sortBy, isMounted, fetchStaff])

  useEffect(() => {
    if (isMounted && statusFilter !== 'all') {
      console.log('[StaffManagement] Status filter changed, refetching...')
      fetchStaff(1)
    }
  }, [statusFilter, isMounted, fetchStaff])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handlePreviousPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchStaff(pagination.page - 1)
    }
  }, [pagination.page, fetchStaff])

  const handleNextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchStaff(pagination.page + 1)
    }
  }, [pagination.page, pagination.totalPages, fetchStaff])

  const handleDeleteStaff = async (staffId: number) => {
    try {
      const res = await fetch(`${apiBase}/admin/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }),
      })

      const result = await res.json()

      if (result.success) {
        toast.success('Nhân viên đã được vô hiệu hóa')
        fetchStaff(pagination.page)
      } else {
        toast.error(result.error?.message || 'Lỗi vô hiệu hóa nhân viên')
      }
    } catch (error) {
      console.error('[StaffManagement] Error deleting staff:', error)
      toast.error('Lỗi vô hiệu hóa nhân viên')
    }
  }

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
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          onClick={() => {
            setEditingStaff(null)
            setFormDialogOpen(true)
          }}
          className="gap-2 w-full sm:w-auto sm:ml-auto"
        >
          <Plus className="w-4 h-4" />
          Thêm Nhân Viên
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="p-[10px] sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên, số điện thoại..."
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
                <SelectItem value="name">Tên A-Z</SelectItem>
                <SelectItem value="joinDate">Ngày Vào (Mới Nhất)</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lọc theo trạng thái..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả</SelectItem>
                <SelectItem value="active">Đang Hoạt Động</SelectItem>
                <SelectItem value="inactive">Không Hoạt Động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <Card className="col-span-full">
            <CardContent className="p-[10px] sm:p-6">
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            </CardContent>
          </Card>
        ) : staffList.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-[10px] sm:p-6">
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Chưa có nhân viên nào</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          staffList.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-[10px] sm:p-6">
                <div className="space-y-4">
                  {/* Avatar and Basic Info */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatarUrl || undefined} alt={member.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 w-full space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">{member.name}</h3>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status === 'active' ? 'Hoạt Động' : 'Không Hoạt Động'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.position || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-sm">
                    {member.email && (
                      <p className="text-muted-foreground truncate">📧 {member.email}</p>
                    )}
                    {member.phone && (
                      <p className="text-muted-foreground">📱 {member.phone}</p>
                    )}
                    {member.joinDate && (
                      <p className="text-muted-foreground">
                        📅 Vào: {new Date(new Date(member.joinDate).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>

                  {/* Specialties */}
                  {member.specialties && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Chuyên môn:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.slice(0, 3).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {member.specialties.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.specialties.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStaffId(member.id)
                        setDetailsDialogOpen(true)
                      }}
                      className="flex-1 min-w-[140px]"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Xem
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingStaff(member)
                        setFormDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>

                    <ConfirmDialog
                      title="Vô hiệu hóa nhân viên?"
                      description={`Bạn có chắc muốn vô hiệu hóa ${member.name}? Nhân viên này sẽ không thể được gán lịch hẹn mới.`}
                      onConfirm={() => handleDeleteStaff(member.id)}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && staffList.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-between gap-3 p-[10px] sm:flex-row sm:p-6">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Trang {pagination.page} / {pagination.totalPages} | Tổng: {pagination.total} nhân viên
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
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <StaffFormDialog
        staffToEdit={editingStaff}
        isOpen={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSuccess={() => {
          fetchStaff(pagination.page)
          setFormDialogOpen(false)
        }}
      />

      {selectedStaffId && (
        <StaffDetailsDialog
          staffId={selectedStaffId}
          isOpen={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      )}
    </div>
  )
}
