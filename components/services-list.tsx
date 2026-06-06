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
import { useRouter } from "next/navigation"

const ITEMS_PER_PAGE = 6;

function ServiceCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div
      className={`rounded-3xl border border-neutral-200/80 bg-white/50 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex animate-pulse ${
        viewMode === "list"
          ? "flex-col md:flex-row w-full md:h-48 min-h-fit"
          : "flex-col justify-between min-h-[380px]"
      }`}
    >
      {/* Image Placeholder */}
      <div
        className={`${
          viewMode === "list"
            ? "w-full md:w-56 h-48 md:h-full flex-shrink-0"
            : "aspect-video w-full"
        } bg-neutral-200`}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 h-full justify-between min-w-0">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
            <div className="h-5 w-2/3 bg-neutral-300 rounded-md" />
            <div className="h-5 w-16 bg-neutral-300 rounded-md" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-neutral-200 rounded-md" />
            <div className="h-3 w-5/6 bg-neutral-200 rounded-md" />
          </div>
        </div>

        <div
          className={`mt-4 pt-4 border-t border-neutral-100/60 flex ${
            viewMode === "list"
              ? "flex-row items-center justify-between gap-4 mt-2 pt-3"
              : "flex-col gap-4"
          }`}
        >
          {/* Duration Skeleton */}
          <div className="h-4 w-20 bg-neutral-200 rounded-md" />
          {/* Button Skeleton */}
          <div
            className={`h-10 bg-neutral-300 rounded-full ${
              viewMode === "list" ? "w-32" : "w-full"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

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
      <div className={`transition-all duration-300 ease-out ${isLoading && services.length > 0 ? "opacity-60 pointer-events-none scale-[0.995]" : "opacity-100 scale-100"}`}>
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-4"}>
          {isLoading && services.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <ServiceCardSkeleton key={i} viewMode={viewMode} />
            ))
          ) : (
            services.map((service) => (
              <div 
                key={service.id} 
                className={`group rounded-3xl border border-neutral-200/80 bg-white/70 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 ease-out hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18),0_1px_2px_rgba(0,0,0,0.02)] hover:-translate-y-1.5 overflow-hidden flex ${
                  viewMode === "list" 
                    ? "flex-col md:flex-row w-full md:h-48 min-h-fit" 
                    : "flex-col justify-between min-h-[380px]"
                }`}
              >
                {/* Image */}
                <div className={`${
                  viewMode === "list" 
                    ? "w-full md:w-56 h-48 md:h-full flex-shrink-0" 
                    : "aspect-video w-full"
                } overflow-hidden bg-neutral-100 relative`}>
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400 bg-neutral-200/40">
                      Ảnh dịch vụ
                    </div>
                  )}
                  {service.popular && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 backdrop-blur-md">
                      <Star className="h-2.5 w-2.5 fill-amber-500" />
                      Phổ biến
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-6 h-full justify-between min-w-0">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-snug">
                        {service.name}
                      </h3>
                      <p className="text-base font-extrabold text-primary flex-shrink-0">
                        {Number(service.price).toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    
                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2 md:line-clamp-3">
                      {service.description || "Dịch vụ chăm sóc và làm đẹp móng cao cấp được thực hiện bởi các kỹ thuật viên giàu kinh nghiệm."}
                    </p>
                  </div>

                  <div className={`mt-4 pt-4 border-t border-neutral-100/60 flex ${
                    viewMode === "list" 
                      ? "flex-row items-center justify-between gap-4 mt-2 pt-3" 
                      : "flex-col gap-4"
                  }`}>
                    {/* Service Info */}
                    <div className="flex items-center text-xs font-bold text-neutral-400">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>{service.duration} phút</span>
                    </div>

                    {/* Action Button */}
                    <Button 
                      onClick={() => handleBooking(service.id)} 
                      className={`rounded-full bg-primary hover:bg-primary/95 hover:shadow-md transition-all duration-300 font-bold shadow-sm text-white ${
                        viewMode === "list" ? "w-auto px-6 py-4 h-9" : "w-full py-5"
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Đặt lịch ngay
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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