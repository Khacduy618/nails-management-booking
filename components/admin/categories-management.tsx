"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, RotateCcw, ChevronLeft, ChevronRight, Search, Layers } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import PhantomWrapper from "@/components/ui/phantom-wrapper"

// Category icon and gradient mapping based on name keywords
function getCategoryStyle(name: string): { icon: string; gradient: string; accent: string; bg: string } {
    const lower = name.toLowerCase()
    if (lower.includes("manicure") || lower.includes("mani"))
        return { icon: "💅", gradient: "from-rose-500 to-pink-400", accent: "#f43f5e", bg: "bg-rose-50" }
    if (lower.includes("pedicure") || lower.includes("pedi") || lower.includes("chân"))
        return { icon: "🦶", gradient: "from-violet-500 to-purple-400", accent: "#8b5cf6", bg: "bg-violet-50" }
    if (lower.includes("extension") || lower.includes("nối") || lower.includes("úp"))
        return { icon: "✨", gradient: "from-amber-500 to-yellow-400", accent: "#f59e0b", bg: "bg-amber-50" }
    if (lower.includes("art") || lower.includes("nghệ thuật") || lower.includes("vẽ"))
        return { icon: "🎨", gradient: "from-sky-500 to-cyan-400", accent: "#0ea5e9", bg: "bg-sky-50" }
    if (lower.includes("combo") || lower.includes("spa"))
        return { icon: "🌸", gradient: "from-emerald-500 to-teal-400", accent: "#10b981", bg: "bg-emerald-50" }
    return { icon: "💎", gradient: "from-indigo-500 to-blue-400", accent: "#6366f1", bg: "bg-indigo-50" }
}

interface Category {
    id: number
    name: string
    description: string | null
    status: "active" | "inactive" | "deleted"
    deletedAt: string | null
}

interface PaginationState {
    page: number
    limit: number
    total: number
    totalPages: number
}

const ITEMS_PER_PAGE = 12

const MOCK_CATEGORIES: Category[] = Array.from({ length: 6 }, (_, i) => ({
    id: -i - 1,
    name: "Tên danh mục mẫu " + (i + 1),
    description: "Mô tả danh mục mẫu có độ dài hợp lý để vẽ shim loader đẹp mắt.",
    status: "active",
    deletedAt: null,
}));

export function CategoriesManagement() {
    const [categories, setCategories] = useState<Category[]>([])
    const [deletedCategories, setDeletedCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({ name: "", description: "" })
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const [serviceCount, setServiceCount] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isTogglingStatus, setIsTogglingStatus] = useState(false)

    // Search & pagination state
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<"name" | "created">("name")
    const [activeTab, setActiveTab] = useState("active")

    const [activePagination, setActivePagination] = useState<PaginationState>({
        page: 1,
        limit: ITEMS_PER_PAGE,
        total: 0,
        totalPages: 1,
    })
    const [deletedPagination, setDeletedPagination] = useState<PaginationState>({
        page: 1,
        limit: ITEMS_PER_PAGE,
        total: 0,
        totalPages: 1,
    })

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "")

    // Fetch active categories with search and pagination
    const fetchCategories = async (page = 1) => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                search: searchQuery,
                sort: sortBy,
            })
            const res = await fetch(`${apiBase}/admin/service-categories?${params}`)
            const data = await res.json()
            setCategories(data.data || [])
            setActivePagination({
                page: data.meta?.page || page,
                limit: ITEMS_PER_PAGE,
                total: data.meta?.total || 0,
                totalPages: data.meta?.totalPages || 1,
            })
        } catch (error) {
            console.error(error)
            toast.error("Không thể tải danh mục")
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch deleted categories with search and pagination
    const fetchDeletedCategories = async (page = 1) => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                includeDeleted: "true",
                search: searchQuery,
                sort: sortBy,
            })
            const res = await fetch(`${apiBase}/admin/service-categories?${params}`)
            const data = await res.json()
            setDeletedCategories(data.data || [])
            setDeletedPagination({
                page: data.meta?.page || page,
                limit: ITEMS_PER_PAGE,
                total: data.meta?.total || 0,
                totalPages: data.meta?.totalPages || 1,
            })
        } catch (error) {
            console.error(error)
            toast.error("Không thể tải danh sách thùng rác")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            if (activeTab === "active") {
                await fetchCategories(1)
            } else if (activeTab === "trash") {
                await fetchDeletedCategories(1)
            }
        }
        loadData()
    }, [apiBase, searchQuery, sortBy, activeTab])

    // Handle add/edit form
    const handleOpenForm = (category?: Category) => {
        if (category) {
            setEditingCategory(category)
            setFormData({ name: category.name, description: category.description || "" })
        } else {
            setEditingCategory(null)
            setFormData({ name: "", description: "" })
        }
        setShowForm(true)
    }

    const handleCloseForm = () => {
        setShowForm(false)
        setEditingCategory(null)
        setFormData({ name: "", description: "" })
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error("Tên danh mục không được để trống")
            return
        }

        setIsSubmitting(true)
        try {
            if (editingCategory) {
                // Update
                const res = await fetch(`${apiBase}/admin/service-categories/${editingCategory.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        description: formData.description.trim() || null,
                    }),
                })

                if (!res.ok) {
                    const error = await res.json()
                    toast.error(error.message || "Cập nhật danh mục thất bại")
                    return
                }

                toast.success("Cập nhật danh mục thành công")
            } else {
                // Create
                const res = await fetch(`${apiBase}/admin/service-categories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        description: formData.description.trim() || null,
                    }),
                })

                if (!res.ok) {
                    const error = await res.json()
                    toast.error(error.message || "Tạo danh mục thất bại")
                    return
                }

                toast.success("Tạo danh mục thành công")
            }

            handleCloseForm()
            fetchCategories(activePagination.page)
        } catch (error) {
            console.error(error)
            toast.error("Lỗi hệ thống")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle delete
    const handleOpenDeleteDialog = async (category: Category) => {
        setCategoryToDelete(category)
        // Fetch service count for this category
        try {
            const res = await fetch(`${apiBase}/admin/services?category=${category.id}&limit=1`)
            const data = await res.json()
            setServiceCount(data.pagination?.total || 0)
        } catch (error) {
            setServiceCount(0)
        }
        setShowDeleteDialog(true)
    }

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return

        setIsDeleting(true)
        try {
            const res = await fetch(`${apiBase}/admin/service-categories/${categoryToDelete.id}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.json()
                toast.error(error.message || "Xóa danh mục thất bại")
                return
            }

            toast.success("Xóa danh mục thành công")
            setShowDeleteDialog(false)
            setCategoryToDelete(null)
            fetchCategories(activePagination.page)
            fetchDeletedCategories(deletedPagination.page)
        } catch (error) {
            console.error(error)
            toast.error("Lỗi hệ thống")
        } finally {
            setIsDeleting(false)
        }
    }

    // Handle restore
    const handleRestore = async (categoryId: number) => {
        try {
            const res = await fetch(`${apiBase}/admin/service-categories/${categoryId}?action=restore`, {
                method: "POST",
            })

            if (!res.ok) {
                const error = await res.json()
                toast.error(error.message || "Khôi phục danh mục thất bại")
                return
            }

            toast.success("Khôi phục danh mục thành công")
            fetchCategories(activePagination.page)
            fetchDeletedCategories(deletedPagination.page)
        } catch (error) {
            console.error(error)
            toast.error("Lỗi hệ thống")
        }
    }

    // Handle toggle status (active/inactive)
    const handleToggleStatus = async (category: Category) => {
        setIsTogglingStatus(true)
        try {
            const newStatus = category.status === "active" ? "inactive" : "active"
            const res = await fetch(`${apiBase}/admin/service-categories/${category.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: category.name,
                    description: category.description,
                    status: newStatus,
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                toast.error(error.message || "Thay đổi trạng thái thất bại")
                return
            }

            toast.success(
                newStatus === "active"
                    ? "Kích hoạt danh mục thành công"
                    : "Tạm dừng danh mục thành công"
            )

            // Refresh current tab after toggle
            if (activeTab === "trash") {
                fetchDeletedCategories(deletedPagination.page)
            }
            fetchCategories(activePagination.page)
        } catch (error) {
            console.error(error)
            toast.error("Lỗi hệ thống")
        } finally {
            setIsTogglingStatus(false)
        }
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex w-full sm:w-auto sm:inline-flex flex-row gap-1 bg-white/70 backdrop-blur-md p-1 border border-neutral-200/50 rounded-2xl shadow-sm mb-4">
                    <TabsTrigger
                        value="active"
                        className="rounded-xl px-5 py-2 text-xs font-bold text-neutral-500 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-none data-[state=active]:shadow-sm cursor-pointer"
                    >
                        Danh mục hoạt động
                    </TabsTrigger>
                    <TabsTrigger
                        value="trash"
                        className="rounded-xl px-5 py-2 text-xs font-bold text-neutral-500 transition-all data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground shadow-none data-[state=active]:shadow-sm cursor-pointer"
                    >
                        Thùng rác
                    </TabsTrigger>
                </TabsList>

                {/* Danh mục hoạt động */}
                <TabsContent value="active" className="space-y-4">
                    {/* Search, Sort Controls */}
                    <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-5 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="relative w-full md:flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    placeholder="Tìm kiếm danh mục..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setActivePagination({ ...activePagination, page: 1 })
                                    }}
                                    className="pl-10 rounded-xl border-neutral-200 bg-white/80 focus:bg-white"
                                />
                            </div>
                            <Select
                                value={sortBy}
                                onValueChange={(value: any) => {
                                    setSortBy(value)
                                    setActivePagination({ ...activePagination, page: 1 })
                                }}
                            >
                                <SelectTrigger className="w-full md:w-48 rounded-xl border-neutral-200 bg-white/80">
                                    <SelectValue placeholder="Sắp xếp" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-neutral-200">
                                    <SelectItem value="name">Theo tên (A-Z)</SelectItem>
                                    <SelectItem value="created">Mới nhất</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <Button onClick={() => handleOpenForm()} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-sm hover:shadow active:scale-98 transition-all cursor-pointer gap-2 sm:w-auto sm:ml-auto">
                                    <Plus className="h-4 w-4" />
                                    Thêm danh mục mới
                                </Button>
                            </div>
                        </div>
                    </div>

                    <PhantomWrapper loading={isLoading} animation="wave">
                        {(() => {
                            const displayCategories = isLoading && categories.length === 0 ? MOCK_CATEGORIES : categories;
                            if (categories.length === 0 && !isLoading) {
                                return (
                                    <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-8 text-center shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
                                        <p className="mb-4 text-neutral-500 font-medium">
                                            {searchQuery ? "Không tìm thấy danh mục nào" : "Chưa có danh mục nào"}
                                        </p>
                                        {!searchQuery && (
                                            <Button onClick={() => handleOpenForm()} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-sm hover:shadow transition-all sm:w-auto gap-2">
                                                <Plus className="h-4 w-4" />
                                                Tạo danh mục đầu tiên
                                            </Button>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <>
                                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                        {displayCategories.map((category) => {
                                            const style = getCategoryStyle(category.name)
                                            return (
                                                <div key={category.id} className="group relative rounded-3xl border border-neutral-200/50 bg-white/80 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.07)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-8px_rgba(15,15,15,0.13)] overflow-hidden flex flex-col">
                                                    {/* Top gradient accent bar */}
                                                    <div className={`h-1.5 w-full bg-gradient-to-r ${style.gradient}`} />

                                                    <div className="p-6 flex flex-col flex-1">
                                                        {/* Icon + Status row */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center text-2xl shadow-sm border border-white/60 group-hover:scale-110 transition-transform duration-300`}>
                                                                {style.icon}
                                                            </div>
                                                            <Badge
                                                                className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 border-0 ${category.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                                            >
                                                                {category.status === 'active' ? '● Hoạt động' : '○ Tạm dừng'}
                                                            </Badge>
                                                        </div>

                                                        {/* Name + Description */}
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-neutral-800 mb-1.5 group-hover:text-primary transition-colors leading-tight">{category.name}</h3>
                                                            {category.description && (
                                                                <p className="text-sm text-neutral-500 font-medium line-clamp-2 leading-relaxed">{category.description}</p>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4 mt-4">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenForm(category)}
                                                                disabled={isTogglingStatus || isLoading}
                                                                className="flex-1 min-w-[70px] rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-xs font-semibold"
                                                            >
                                                                <Edit2 className="mr-1 h-3.5 w-3.5" />
                                                                Sửa
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleToggleStatus(category)}
                                                                disabled={isTogglingStatus || isLoading}
                                                                className="flex-1 min-w-[70px] rounded-xl hover:bg-amber-50 hover:text-amber-700 transition-all text-xs font-semibold"
                                                            >
                                                                {category.status === "active" ? "Tạm dừng" : "Kích hoạt"}
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleOpenDeleteDialog(category)}
                                                                disabled={isTogglingStatus || isLoading}
                                                                className="flex-1 min-w-[70px] rounded-xl transition-all text-xs font-semibold"
                                                            >
                                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                                Xóa
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Pagination */}
                                    {activePagination.totalPages > 1 && !isLoading && (
                                        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border/40 bg-muted/20 p-[10px] sm:flex-row sm:items-center sm:justify-between sm:p-4">
                                            <div className="text-center text-sm text-muted-foreground sm:text-left">
                                                Trang {activePagination.page} / {activePagination.totalPages} | Tổng: {activePagination.total} danh mục
                                            </div>
                                            <div className="flex justify-center gap-2 sm:justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fetchCategories(activePagination.page - 1)}
                                                    disabled={activePagination.page === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fetchCategories(activePagination.page + 1)}
                                                    disabled={activePagination.page === activePagination.totalPages}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </PhantomWrapper>
                </TabsContent>
                {/* Thùng rác */}
                <TabsContent value="trash" className="space-y-4">
                    {/* Search, Sort Controls */}
                    <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-5 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="relative w-full md:flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    placeholder="Tìm kiếm danh mục..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setDeletedPagination({ ...deletedPagination, page: 1 })
                                    }}
                                    className="pl-10 rounded-xl border-neutral-200 bg-white/80 focus:bg-white"
                                />
                            </div>
                            <Select
                                value={sortBy}
                                onValueChange={(value: any) => {
                                    setSortBy(value)
                                    setDeletedPagination({ ...deletedPagination, page: 1 })
                                }}
                            >
                                <SelectTrigger className="w-full md:w-48 rounded-xl border-neutral-200 bg-white/80">
                                    <SelectValue placeholder="Sắp xếp" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-neutral-200">
                                    <SelectItem value="name">Theo tên (A-Z)</SelectItem>
                                    <SelectItem value="created">Mới nhất</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <PhantomWrapper loading={isLoading} animation="wave">
                        {(() => {
                            const displayDeleted = isLoading && deletedCategories.length === 0 ? MOCK_CATEGORIES : deletedCategories;
                            if (deletedCategories.length === 0 && !isLoading) {
                                return (
                                    <div className="rounded-3xl border border-neutral-200/50 bg-white/70 p-8 text-center shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06)] backdrop-blur-md">
                                        <p className="text-neutral-500 font-medium">
                                            {searchQuery ? "Không tìm thấy danh mục nào" : "Chưa có danh mục bị xóa"}
                                        </p>
                                    </div>
                                );
                            }
                            return (
                                <>
                                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                        {displayDeleted.map((category) => {
                                            const style = getCategoryStyle(category.name)
                                            return (
                                                <div key={category.id} className="group relative rounded-3xl border border-neutral-200/50 bg-neutral-50/80 shadow-[0_4px_20px_-4px_rgba(15,15,15,0.06)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_-6px_rgba(15,15,15,0.1)] overflow-hidden flex flex-col opacity-75 hover:opacity-95">
                                                    {/* Top grayscale accent bar for deleted state */}
                                                    <div className="h-1.5 w-full bg-gradient-to-r from-neutral-400 to-neutral-300" />

                                                    <div className="p-6 flex flex-col flex-1">
                                                        {/* Icon + Badge row */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-2xl grayscale shadow-sm border border-white/60">
                                                                {style.icon}
                                                            </div>
                                                            <Badge className="text-[10px] font-bold rounded-full px-2.5 py-0.5 border-0 bg-red-100 text-red-600">
                                                                🗑 Đã xóa
                                                            </Badge>
                                                        </div>

                                                        {/* Name + Description */}
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-neutral-500 mb-1.5 line-through leading-tight">{category.name}</h3>
                                                            {category.description && (
                                                                <p className="text-sm text-neutral-400 font-medium line-clamp-2 leading-relaxed">{category.description}</p>
                                                            )}
                                                        </div>

                                                        {/* Footer */}
                                                        <div className="space-y-3 mt-4 pt-4 border-t border-neutral-200">
                                                            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                                                                {category.deletedAt
                                                                    ? `Xóa lúc: ${new Date(category.deletedAt).toLocaleString("vi-VN")}`
                                                                    : "Xóa lúc: Chưa rõ"}
                                                            </p>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRestore(category.id)}
                                                                className="w-full gap-2 rounded-xl border-neutral-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all text-xs font-semibold"
                                                                disabled={isLoading}
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                                Khôi phục
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Pagination */}
                                    {deletedPagination.totalPages > 1 && !isLoading && (
                                        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border/40 bg-muted/20 p-[10px] sm:flex-row sm:items-center sm:justify-between sm:p-4">
                                            <div className="text-center text-sm text-muted-foreground sm:text-left">
                                                Trang {deletedPagination.page} / {deletedPagination.totalPages} | Tổng: {deletedPagination.total} danh mục
                                            </div>
                                            <div className="flex justify-center gap-2 sm:justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fetchDeletedCategories(deletedPagination.page - 1)}
                                                    disabled={deletedPagination.page === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fetchDeletedCategories(deletedPagination.page + 1)}
                                                    disabled={deletedPagination.page === deletedPagination.totalPages}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </PhantomWrapper>
                </TabsContent>
            </Tabs>

            {/* Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Tên danh mục *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nhập tên danh mục"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nhập mô tả (tùy chọn)"
                                disabled={isSubmitting}
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={handleCloseForm} disabled={isSubmitting}>
                                Hủy
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa danh mục</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa danh mục "{categoryToDelete?.name}"?
                            {serviceCount > 0 && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                                    ⚠️ <strong>Cảnh báo:</strong> Danh mục này hiện có <strong>{serviceCount}</strong> dịch vụ.
                                    Vui lòng chuyển hoặc xóa các dịch vụ này trước khi xóa danh mục.
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={serviceCount > 0 || isDeleting}
                            className={serviceCount > 0 ? "opacity-50 cursor-not-allowed" : ""}
                        >
                            {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
