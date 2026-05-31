"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, Users, Calendar } from "lucide-react"
import { useState } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiService, PaginationInfo } from './services-page-client'; // Import kiểu từ component cha
import PhantomWrapper from "@/components/ui/phantom-wrapper"
import { useRouter } from "next/navigation"

const ITEMS_PER_PAGE = 6;

const MOCK_SERVICES: ApiService[] = Array.from({ length: ITEMS_PER_PAGE }, (_, i) => ({
  id: -i - 1,
  name: "Tên Dịch Vụ Mẫu Cho Skeleton",
  description: "Đây là mô tả mẫu có độ dài vừa phải để tạo khung shimmer loader tương thích với thiết kế thật của thẻ dịch vụ.",
  price: "150000",
  duration: 45,
  popular: i === 0,
  imageUrl: null,
}));

// --- Định nghĩa props cho component chính ---
interface ServicesListProps {
  services: ApiService[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

// --- Component chính ---
export function ServicesList({
  services,
  pagination,
  isLoading,
  error,
  currentPage,
  onPageChange,
}: ServicesListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();

  const handleBooking = (serviceId: number) => {
    router.push(`/book?serviceId=${serviceId}`);
  };

  // --- Render Logic ---

  if (error) {
    return <div className="text-center py-12 text-destructive">{error}</div>;
  }

  const startIndex = pagination ? (pagination.page - 1) * pagination.limit : 0;

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          {pagination && pagination.total > 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              Hiển thị {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, pagination.total)} trong{" "}
              {pagination.total} dịch vụ
            </p>
          )}
          {isLoading && <Skeleton className="h-5 w-48" />}
        </div>
        <div className="hidden md:flex items-center space-x-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            Lưới
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            Danh sách
          </Button>
        </div>
      </div>

      {/* Services Grid/List */}
      <PhantomWrapper loading={isLoading} animation="wave">
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-4"}>
          {(isLoading && services.length === 0 ? MOCK_SERVICES : services).map((service) => (
            <Card key={service.id} className="group hover:shadow-lg transition-all p-0 duration-300 hover:-translate-y-1 overflow-hidden">
              <div className={viewMode === "list" ? "flex" : ""}>
                {/* Image */}
                <div className={`${viewMode === "list" ? "w-48 flex-shrink-0" : "aspect-video"} overflow-hidden bg-muted`}>
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-slate-200 dark:bg-slate-800">
                      Ảnh dịch vụ
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center text-lg h-14 group-hover:text-primary transition-colors">
                          <span className="line-clamp-2 leading-tight">
                            {service.name}
                          </span>
                        </CardTitle>
                        {service.popular && <Badge variant="secondary">Phổ biến</Badge>}
                      </div>
                      <p className="text-lg font-bold text-primary flex-shrink-0 ml-2">{Number(service.price).toLocaleString("vi-VN")}đ</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4 flex-grow flex flex-col justify-between">
                    <CardDescription className="text-pretty leading-relaxed line-clamp-2">
                      {service.description}
                    </CardDescription>

                    {/* Service Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration} phút</span>
                      </div>
                      {/* Rating & Staff info có thể được thêm vào đây nếu API trả về */}
                    </div>

                    {/* Action Button */}
                    <Button onClick={() => handleBooking(service.id)} className="w-full mt-auto">
                      <Calendar className="h-4 w-4 mr-2" />
                      Đặt lịch ngay
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PhantomWrapper>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1); }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* Logic phân trang đơn giản, hiển thị tất cả các trang */}
              {[...Array(pagination.totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); onPageChange(i + 1); }}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage < pagination.totalPages) onPageChange(currentPage + 1); }}
                  className={currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* No Results */}
      {!isLoading && services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">Không tìm thấy dịch vụ nào phù hợp.</p>
          {/* Nút xóa bộ lọc có thể được điều khiển bởi component cha */}
        </div>
      )}
    </div>
  )
}