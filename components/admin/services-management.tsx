
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { ServiceForm } from "./service-form"
import { ServiceDetails } from "./service-details"
import { toast } from "sonner"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useDebounce } from "@/hooks/use-debounce"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "../ui/confirm-dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"


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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // --- API Calls ---
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [catRes, staffRes] = await Promise.all([
          fetch(`${apiUrl}service-categories`),
          fetch(`${apiUrl}admin/staff`),
        ]);
        const catData = await catRes.json();
        const staffData = await staffRes.json();
        setCategories(catData.categories || []);
        setAllStaff(staffData.staff || []);
      } catch (e) {
        console.error("Failed to fetch initial data for form");
        toast.error("Không thể tải dữ liệu cho form.");
      }
    }
    fetchInitialData();
  }, [apiUrl]);

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

        const res = await fetch(`${apiUrl}admin/services?${params.toString()}`);
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
  }, [debouncedSearchTerm, selectedCategory, sortBy, currentPage, apiUrl]);

  const refreshServices = () => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    fetch(`${apiUrl}admin/services?${params.toString()}`)
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
      const res = await fetch(`${apiUrl}admin/services/${service.id}`);
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
      const res = await fetch(`${apiUrl}admin/services/${service.id}`);
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
      const res = await fetch(`${apiUrl}admin/services/${serviceId}`, { method: 'DELETE' });
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
    const url = isEditing ? `${apiUrl}admin/services/${editingService!.id}` : `${apiUrl}admin/services`;
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Quản lý dịch vụ</h1>
        <Button onClick={handleAddService}><Plus className="h-4 w-4 mr-2" />Thêm dịch vụ</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Input tìm kiếm */}
            <div className="relative flex-1 w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Lọc theo category - Select Box */}
            <div className="flex gap-2 flex-wrap items-center">
              <Label htmlFor="category-filter" className="text-sm shrink-0">Danh mục:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter" className="w-[200px]">
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
            <div className="md:ml-auto flex items-center gap-2">
              <Label htmlFor="sort-by" className="text-sm shrink-0">Sắp xếp:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by" className="w-[180px]">
                  <SelectValue placeholder="Sắp xếp theo..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <div className="text-center p-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
        : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-video bg-muted relative"><img src={service.imageUrl || "/placeholder.svg"} alt={service.name} className="w-full h-full object-cover" /><Badge className={`absolute top-2 right-2 ${service.status === "active" ? "bg-green-600" : "bg-gray-500"}`}>{service.status === "active" ? "Hoạt động" : "Tạm dừng"}</Badge></div>
                  <CardContent className="p-4 space-y-3 flex flex-col flex-grow relative">
                    <div className="pr-24">
                      <h3 className="font-semibold text-foreground line-clamp-2">{service.name}</h3>
                    </div>
                    {service.category?.name && <Badge variant="outline" className="absolute top-4 right-4 whitespace-nowrap">{service.category.name}</Badge>}
                    <div className="flex items-center justify-between text-sm"><span className="font-medium text-primary">{Number(service.price).toLocaleString("vi-VN")}₫</span><span className="text-muted-foreground">{service.duration} phút</span></div>
                    <div className="flex gap-2 pt-2 border-t mt-auto">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewService(service)}><Eye className="h-3 w-3 mr-1" />Xem</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditService(service)}>
                        <Edit className="h-3 w-3 mr-1" />Sửa
                      </Button>
                      <ConfirmDialog
                        title="Xác nhận tạm dừng dịch vụ?"
                        description="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tạm dừng dịch vụ này không?"
                        onConfirm={() => handleDeleteService(service.id)}
                      >
                        {service.status === 'active' && <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3 mr-1" /></Button>}

                      </ConfirmDialog>

                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {!isLoading && services.length === 0 && <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">Không tìm thấy dịch vụ nào.</p></CardContent></Card>}
          </>
        )
      }

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