
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, Loader2, Clock } from "lucide-react"
import { ServiceForm } from "./service-form"
import { ServiceDetails } from "./service-details"
import { toast } from "sonner"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useDebounce } from "@/hooks/use-debounce"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "../ui/confirm-dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import PhantomWrapper from "@/components/ui/phantom-wrapper"


// --- Định nghĩa kiểu dữ liệu ---
interface ApiStaff { id: number; name: string; }
interface ApiCategory { id: number; name: string; }
interface ServiceListItem { // Dữ liệu cho danh sách
  id: number; name: string; price: string; duration: number; status: 'active' | 'archived'; imageUrl: string | null;
  category: { name: string | null } | null;
  description: string | null;
}
interface ServiceDetailsData extends ServiceListItem { // Dữ liệu đầy đủ cho form và details
  categoryId: number | null;
  staffServices?: { staff: ApiStaff }[];
}

interface PaginationInfo { page: number; limit: number; total: number; totalPages: number; }

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'popular', label: 'Phổ biến' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
];

const MOCK_SERVICES_ADMIN: ServiceListItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: -i - 1,
  name: "Dịch Vụ Làm Móng Mẫu Cho Skeleton " + (i + 1),
  price: "150000",
  duration: 45,
  status: "active",
  imageUrl: null,
  category: { name: "Danh mục mẫu" },
  description: "Đây là mô tả mẫu có độ dài vừa phải để tạo khung shimmer loader tương thích với thiết kế thật.",
}));

export function ServicesManagement() {
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [allStaff, setAllStaff] = useState<ApiStaff[]>([]); // State để lưu tất cả nhân viên
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest"); // State sắp xếp
  const [currentPage, setCurrentPage] = useState(1); // State phân trang
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editingService, setEditingService] = useState<ServiceDetailsData | null>(null)
  const [viewingService, setViewingService] = useState<ServiceDetailsData | null>(null)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

  // --- API Calls ---
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [catRes, staffRes] = await Promise.all([
          fetch(`${apiBase}/service-categories`),
          fetch(`${apiBase}/admin/staff?limit=100`),
        ]);
        const catData = await catRes.json();
        const staffData = await staffRes.json();
        setCategories(catData.categories || []);
        setAllStaff(staffData.data || []);
      } catch (e) {
        console.error("Failed to fetch initial data for form");
        toast.error("Không thể tải dữ liệu cho form.");
      }
    }
    fetchInitialData();
  }, [apiBase]);

  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('limit', '16'); // 16 item mỗi trang (4 cột × 4 dòng)
        params.append('sortBy', sortBy);
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);

        const res = await fetch(`${apiBase}/admin/services?${params.toString()}`);
        const data = await res.json();
        setServices(data.services || []);
        setPagination(data.pagination || null);
      } catch (e) {
        toast.error("Không thể tải danh sách dịch vụ.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, [debouncedSearchTerm, selectedCategory, sortBy, currentPage, apiBase]);

  const refreshServices = () => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    fetch(`${apiBase}/admin/services?${params.toString()}`)
      .then(res => res.json())
      .then(data => setServices(data.services || []));
  }

  // --- Handlers ---
  const handleFilterChange = () => {
    setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc
  }
  const handleAddService = () => { setEditingService(null); setShowForm(true); }

  const handleEditService = async (service: ServiceListItem) => {
    // Trước khi mở form, gọi API để lấy dữ liệu chi tiết nhất
    try {
      const res = await fetch(`${apiBase}/admin/services/${service.id}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Không thể tải chi tiết dịch vụ.");

      setEditingService(result.service); // Lưu dữ liệu chi tiết vào state
      setShowForm(true); // Mở form sau khi đã có dữ liệu
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const handleViewService = async (service: ServiceListItem) => {
    try {
      const res = await fetch(`${apiBase}/admin/services/${service.id}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Không thể tải chi tiết dịch vụ.");

      setViewingService(result.service);
      setShowDetails(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const handleDeleteService = async (serviceId: number) => {
    // if (!confirm("Bạn có chắc chắn muốn tạm dừng dịch vụ này không?")) return;
    try {
      const res = await fetch(`${apiBase}/admin/services/${serviceId}`, { method: 'DELETE' });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Tạm dừng thất bại.");
      }
      refreshServices(); // Tải lại danh sách
      toast.success("Dịch vụ đã được tạm dừng.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const handleSaveService = async (serviceData: any, isEditing: boolean) => {
    const url = isEditing ? `${apiBase}/admin/services/${editingService!.id}` : `${apiBase}/admin/services`;
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serviceData)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Lưu thất bại.");

      toast.success(isEditing ? "Cập nhật thành công!" : "Thêm dịch vụ thành công!");
      setShowForm(false);
      setEditingService(null);
      refreshServices();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    handleFilterChange();
  }, [debouncedSearchTerm, selectedCategory, sortBy]);

  return (
    <div className="space-y-6">


      <Card>
        <CardContent className="px-6 sm:px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Input tìm kiếm */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Lọc theo category - Select Box */}
            <div className="flex gap-2 items-center">
              <Label htmlFor="category-filter" className="text-sm shrink-0">Danh mục:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter" className="w-full">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-by" className="text-sm shrink-0">Sắp xếp:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by" className="w-full">
                  <SelectValue placeholder="Sắp xếp theo..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddService}>
              <Plus className="h-4 w-4 mr-2" />Thêm dịch vụ
            </Button>
          </div>
        </CardContent>
      </Card>

      <PhantomWrapper loading={isLoading} animation="wave">
        {(() => {
          const displayServices = isLoading && services.length === 0 ? MOCK_SERVICES_ADMIN : services;
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayServices.map((service) => (
                  <Card key={service.id} className="gap-0 group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 p-0">
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-slate-200 dark:bg-slate-800">
                          Ảnh dịch vụ
                        </div>
                      )}
                      <Badge
                        className={`absolute right-3 top-3 shadow-sm ${service.status === "active"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-500 hover:bg-gray-600"
                          }`}
                      >
                        {service.status === "active" ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </div>

                    {/* Content Section */}
                    <CardContent className="flex flex-1 flex-col p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <h3 className="font-bold leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                        {service.category?.name && (
                          <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
                            {service.category.name}
                          </Badge>
                        )}
                      </div>

                      {service.description && (
                        <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between border-t pt-3">
                        <span className="text-lg font-bold text-orange-600">
                          {Number(service.price).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {service.duration} phút
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                          onClick={() => handleViewService(service)}
                          disabled={isLoading}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-full hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                          onClick={() => handleEditService(service)}
                          disabled={isLoading}
                        >
                          <Edit className="mr-1.5 h-3.5 w-3.5" />
                          Sửa
                        </Button>
                        <ConfirmDialog
                          title="Xác nhận xóa?"
                          description="Hành động này sẽ xóa dịch vụ vĩnh viễn."
                          onConfirm={() => handleDeleteService(service.id)}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-full text-destructive hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            disabled={isLoading}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Xóa
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {!isLoading && services.length === 0 && (
                <Card>
                  <CardContent className="p-2.5 text-center sm:p-12">
                    <p className="text-muted-foreground">Không tìm thấy dịch vụ nào.</p>
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}
      </PhantomWrapper>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="text-sm text-muted-foreground">
            Trang {currentPage} / {pagination.totalPages} | Tổng: {pagination.total} dịch vụ
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      {showForm && (
        <ServiceForm
          service={editingService}
          categories={categories}
          allStaff={allStaff}
          onSave={handleSaveService}
          onCancel={() => { setShowForm(false); setEditingService(null); }}
        />
      )}

      {showDetails && viewingService && (
        <ServiceDetails
          service={viewingService}
          onClose={() => { setShowDetails(false); setViewingService(null); }}
          onEdit={() => { setShowDetails(false); handleEditService(viewingService as ServiceListItem); }}
        />
      )}
    </div>
  )
}