"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, RotateCcw, Trash, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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

export function CategoriesManagement() {
    const [categories, setCategories] = useState<Category[]>([])
    const [inactiveCategories, setInactiveCategories] = useState<Category[]>([])
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
    const [inactivePagination, setInactivePagination] = useState<PaginationState>({
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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""

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
            const res = await fetch(`${apiUrl}admin/service-categories?${params}`)
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

    // Fetch inactive categories with search and pagination
    const fetchInactiveCategories = async (page = 1) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                includeInactive: "true",
                search: searchQuery,
                sort: sortBy,
            })
            const res = await fetch(`${apiUrl}admin/service-categories?${params}`)
            const data = await res.json()
            setInactiveCategories(data.data || [])
            setInactivePagination({
                page: data.meta?.page || page,
                limit: ITEMS_PER_PAGE,
                total: data.meta?.total || 0,
                totalPages: data.meta?.totalPages || 1,
            })
        } catch (error) {
            console.error(error)
            toast.error("Không thể tải danh mục không hoạt động")
        }
    }

    // Fetch deleted categories with search and pagination
    const fetchDeletedCategories = async (page = 1) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                includeDeleted: "true",
                search: searchQuery,
                sort: sortBy,
            })
            const res = await fetch(`${apiUrl}admin/service-categories?${params}`)
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
        }
    }

    useEffect(() => {
        const loadData = async () => {
            if (activeTab === "active") {
                await fetchCategories(1)
            } else if (activeTab === "inactive") {
                await fetchInactiveCategories(1)
            } else if (activeTab === "trash") {
                await fetchDeletedCategories(1)
            }
        }
        loadData()
    }, [apiUrl, searchQuery, sortBy, activeTab])

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
                const res = await fetch(`${apiUrl}admin/service-categories/${editingCategory.id}`, {
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
                const res = await fetch(`${apiUrl}admin/service-categories`, {
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
            const res = await fetch(`${apiUrl}admin/services?category=${category.id}&limit=1`)
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
            const res = await fetch(`${apiUrl}admin/service-categories/${categoryToDelete.id}`, {
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
            const res = await fetch(`${apiUrl}admin/service-categories/${categoryId}?action=restore`, {
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
            const res = await fetch(`${apiUrl}admin/service-categories/${category.id}`, {
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
                    : "Vô hiệu hóa danh mục thành công"
            )

            // Refresh both active and inactive tabs
            if (activeTab === "active") {
                fetchCategories(activePagination.page)
            } else if (activeTab === "inactive") {
                fetchInactiveCategories(inactivePagination.page)
            }
        } catch (error) {
            console.error(error)
            toast.error("Lỗi hệ thống")
        } finally {
            setIsTogglingStatus(false)
        }
    }

    return (
        <div className="w-full space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="active">Danh mục hoạt động</TabsTrigger>
                    <TabsTrigger value="inactive">Danh mục không hoạt động</TabsTrigger>
                    <TabsTrigger value="trash">Thùng rác</TabsTrigger>
                </TabsList>

                {/* Danh mục hoạt động */}
                <TabsContent value="active" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Quản lý danh mục dịch vụ</h2>
                        <Button onClick={() => handleOpenForm()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm danh mục mới
                        </Button>
                    </div>

                    {/* Search, Sort Controls */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex gap-3 flex-wrap">
                                <div className="flex-1 min-w-64">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm danh mục..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                setActivePagination({ ...activePagination, page: 1 })
                                            }}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={sortBy} onValueChange={(value: any) => {
                                    setSortBy(value)
                                    setActivePagination({ ...activePagination, page: 1 })
                                }}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Sắp xếp" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Theo tên (A-Z)</SelectItem>
                                        <SelectItem value="created">Mới nhất</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {isLoading ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p>Đang tải dữ liệu...</p>
                            </CardContent>
                        </Card>
                    ) : categories.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-gray-500 mb-4">
                                    {searchQuery ? "Không tìm thấy danh mục nào" : "Chưa có danh mục nào"}
                                </p>
                                {!searchQuery && (
                                    <Button onClick={() => handleOpenForm()}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tạo danh mục đầu tiên
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {categories.map((category) => (
                                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{category.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {category.description && (
                                                <p className="text-sm text-gray-600">{category.description}</p>
                                            )}
                                            <div className="flex gap-2 pt-4 flex-wrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenForm(category)}
                                                    disabled={isTogglingStatus}
                                                >
                                                    <Edit2 className="w-4 h-4 mr-1" />
                                                    Sửa
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(category)}
                                                    disabled={isTogglingStatus}
                                                >
                                                    Vô hiệu hóa
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleOpenDeleteDialog(category)}
                                                    disabled={isTogglingStatus}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Xóa
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            {activePagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 px-2">
                                    <div className="text-sm text-muted-foreground">
                                        Trang {activePagination.page} / {activePagination.totalPages} | Tổng: {activePagination.total} danh mục
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchCategories(activePagination.page - 1)}
                                            disabled={activePagination.page === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchCategories(activePagination.page + 1)}
                                            disabled={activePagination.page === activePagination.totalPages}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Danh mục không hoạt động */}
                <TabsContent value="inactive" className="space-y-4">
                    <h2 className="text-2xl font-bold">Danh mục không hoạt động</h2>

                    {/* Search, Sort Controls */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex gap-3 flex-wrap">
                                <div className="flex-1 min-w-64">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm danh mục..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                setInactivePagination({ ...inactivePagination, page: 1 })
                                            }}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={sortBy} onValueChange={(value: any) => {
                                    setSortBy(value)
                                    setInactivePagination({ ...inactivePagination, page: 1 })
                                }}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Sắp xếp" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Theo tên (A-Z)</SelectItem>
                                        <SelectItem value="created">Mới nhất</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {isLoading ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p>Đang tải dữ liệu...</p>
                            </CardContent>
                        </Card>
                    ) : inactiveCategories.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-gray-500">
                                    {searchQuery ? "Không tìm thấy danh mục nào" : "Chưa có danh mục không hoạt động"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {inactiveCategories.map((category) => (
                                    <Card key={category.id} className="opacity-60 hover:opacity-80 transition-opacity bg-gray-50">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg text-gray-600">{category.name}</CardTitle>
                                                <Badge variant="outline" className="bg-yellow-100">Không hoạt động</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {category.description && (
                                                <p className="text-sm text-gray-600">{category.description}</p>
                                            )}
                                            <div className="flex gap-2 pt-4 flex-wrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenForm(category)}
                                                    disabled={isTogglingStatus}
                                                >
                                                    <Edit2 className="w-4 h-4 mr-1" />
                                                    Sửa
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(category)}
                                                    disabled={isTogglingStatus}
                                                >
                                                    Kích hoạt
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleOpenDeleteDialog(category)}
                                                    disabled={isTogglingStatus}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Xóa
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            {inactivePagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 px-2">
                                    <div className="text-sm text-muted-foreground">
                                        Trang {inactivePagination.page} / {inactivePagination.totalPages} | Tổng: {inactivePagination.total} danh mục
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchInactiveCategories(inactivePagination.page - 1)}
                                            disabled={inactivePagination.page === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchInactiveCategories(inactivePagination.page + 1)}
                                            disabled={inactivePagination.page === inactivePagination.totalPages}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Thùng rác */}
                <TabsContent value="trash" className="space-y-4">
                    <h2 className="text-2xl font-bold">Thùng rác danh mục</h2>

                    {/* Search, Sort Controls */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex gap-3 flex-wrap">
                                <div className="flex-1 min-w-64">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm danh mục..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                setDeletedPagination({ ...deletedPagination, page: 1 })
                                            }}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={sortBy} onValueChange={(value: any) => {
                                    setSortBy(value)
                                    setDeletedPagination({ ...deletedPagination, page: 1 })
                                }}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Sắp xếp" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Theo tên (A-Z)</SelectItem>
                                        <SelectItem value="created">Mới nhất</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {isLoading ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p>Đang tải dữ liệu...</p>
                            </CardContent>
                        </Card>
                    ) : deletedCategories.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-gray-500">
                                    {searchQuery ? "Không tìm thấy danh mục nào" : "Chưa có danh mục bị xóa"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {deletedCategories.map((category) => (
                                    <Card key={category.id} className="opacity-75 hover:opacity-100 transition-opacity">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg line-through">{category.name}</CardTitle>
                                                <Badge variant="secondary">Đã xóa</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {category.description && (
                                                <p className="text-sm text-gray-600">{category.description}</p>
                                            )}
                                            {category.deletedAt && (
                                                <p className="text-xs text-gray-500">
                                                    Xóa lúc: {new Date(category.deletedAt).toLocaleString("vi-VN")}
                                                </p>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestore(category.id)}
                                                className="w-full"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Khôi phục
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            {deletedPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 px-2">
                                    <div className="text-sm text-muted-foreground">
                                        Trang {deletedPagination.page} / {deletedPagination.totalPages} | Tổng: {deletedPagination.total} danh mục
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchDeletedCategories(deletedPagination.page - 1)}
                                            disabled={deletedPagination.page === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchDeletedCategories(deletedPagination.page + 1)}
                                            disabled={deletedPagination.page === deletedPagination.totalPages}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
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
