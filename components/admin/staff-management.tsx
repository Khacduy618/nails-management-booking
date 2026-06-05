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
      {/* Search and Filter Section */}
      <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-5 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
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
              <SelectItem value="name" className="rounded-lg">Tên A-Z</SelectItem>
              <SelectItem value="joinDate" className="rounded-lg">Ngày Vào (Mới Nhất)</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full h-10 rounded-xl border-neutral-200/80 bg-white/50 focus:ring-primary/20">
              <SelectValue placeholder="Lọc trạng thái..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200/80">
              <SelectItem value="all" className="rounded-lg">Tất Cả</SelectItem>
              <SelectItem value="active" className="rounded-lg">Đang Hoạt Động</SelectItem>
              <SelectItem value="inactive" className="rounded-lg">Không Hoạt Động</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              setEditingStaff(null)
              setFormDialogOpen(true)
            }}
            className="gap-2 w-full h-10 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold hover:brightness-105 transition-all shadow-md shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            Thêm Nhân Viên
          </Button>
        </div>
      </div>

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
          <div className="col-span-full rounded-3xl border border-dashed border-neutral-200 bg-white/40 p-8 text-center text-neutral-500 font-medium">
            Chưa có nhân viên nào
          </div>
        ) : (
          staffList.map((member) => (
            <div key={member.id} className="overflow-hidden border border-neutral-200/50 bg-white/70 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-500 hover:-translate-y-1.5 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-4">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-16 w-16 border-2 border-primary/10 ring-4 ring-neutral-100">
                    <AvatarImage src={member.avatarUrl || undefined} alt={member.name} />
                    <AvatarFallback className="bg-gradient-to-tr from-orange-400 to-pink-500 text-white font-extrabold">
                      {(member.name || 'Staff')
                        .split(' ')
                        .map((n) => n[0] || '')
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 w-full space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-extrabold text-neutral-800 tracking-tight">{member.name}</h3>
                      <Badge className={member.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-600'}>
                        {member.status === 'active' ? 'Hoạt Động' : 'Vô Hiệu'}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{member.position || 'Nhân viên'}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1 text-xs font-medium text-neutral-500 border-t border-neutral-100 pt-3">
                  {member.email && (
                    <p className="truncate">📧 {member.email}</p>
                  )}
                  {member.phone && (
                    <p>📱 {member.phone}</p>
                  )}
                  {member.joinDate && (
                    <p>
                      📅 Vào làm: {new Date(new Date(member.joinDate).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>

                {/* Specialties */}
                {member.specialties && member.specialties.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Chuyên môn:</p>
                    <div className="flex flex-wrap gap-1">
                      {member.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-[10px] border-neutral-200 bg-neutral-50/50 text-neutral-600 font-semibold px-2 py-0.5 rounded-md">
                          {specialty}
                        </Badge>
                      ))}
                      {member.specialties.length > 3 && (
                        <Badge variant="outline" className="text-[10px] border-neutral-200 bg-neutral-50/50 text-neutral-600 font-semibold px-2 py-0.5 rounded-md">
                          +{member.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Grid */}
              <div className="grid gap-2 border-t border-neutral-100 pt-4 mt-4 sm:grid-cols-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-center gap-1.5 border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-xl text-xs h-9 font-bold"
                  onClick={() => {
                    setSelectedStaffId(member.id)
                    setDetailsDialogOpen(true)
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Hồ sơ
                </Button>

                <Button
                  size="sm"
                  className="w-full justify-center gap-1.5 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 rounded-xl text-xs h-9 font-bold"
                  onClick={() => {
                    setEditingStaff(member)
                    setFormDialogOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Sửa
                </Button>

                <ConfirmDialog
                  title="Vô hiệu hóa nhân viên?"
                  description={`Bạn có chắc muốn vô hiệu hóa ${member.name}? Nhân viên này sẽ không thể được gán lịch hẹn mới.`}
                  onConfirm={() => handleDeleteStaff(member.id)}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-center gap-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs h-9 font-bold"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Khóa
                  </Button>
                </ConfirmDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && staffList.length > 0 && (
        <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-5 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-xs font-bold text-neutral-500">
            Trang {pagination.page} / {pagination.totalPages} | Tổng cộng {pagination.total} nhân sự
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
