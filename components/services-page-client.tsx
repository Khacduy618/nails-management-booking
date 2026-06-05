"use client"

import { useState, useEffect } from "react";
import { ServicesFilter } from "./services-filter";
import { ServicesList } from "./services-list";
import { useDebounce } from "@/hooks/use-debounce";

// --- Định nghĩa các kiểu dữ liệu ---
export interface ApiService {
  id: number;
  name: string;
  description: string | null;
  price: string;
  duration: number;
  popular: boolean | null;
  imageUrl: string | null;
  category?: { name: string } | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FilterOptions {
  categories: { id: number; name: string; count: number }[];
  durations: { id: string; label: string; count: number }[];
  priceRange: { min: number; max: number };
}

export function ServicesPageClient() {
  // State quản lý dữ liệu chính
  const [services, setServices] = useState<ApiService[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho các giá trị bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);

  // State cho các tùy chọn bộ lọc (để ràng buộc lẫn nhau)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState(true);

  // Debounce các giá trị thay đổi nhanh để tránh gọi API liên tục
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedPriceRange = useDebounce(priceRange, 500);

  // useEffect để gọi API khi các bộ lọc hoặc trang thay đổi
  useEffect(() => {
    // SỬA CÚ PHÁP: Khai báo hàm async ở đây
    const fetchData = async () => {
      setIsLoading(true);
      setIsMetaLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/';
      const params = new URLSearchParams();

      // Xây dựng query params từ state
      params.append('page', currentPage.toString());
      params.append('limit', '6'); // ITEMS_PER_PAGE
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
      if (selectedDurations.length > 0) params.append('duration', selectedDurations.join(','));
      if (debouncedPriceRange[0] > 0) params.append('minPrice', debouncedPriceRange[0].toString());
      if (debouncedPriceRange[1] < 1000000) params.append('maxPrice', debouncedPriceRange[1].toString());

      const servicesUrl = `${apiUrl}services?${params.toString()}`;
      const metaUrl = `${apiUrl}services-meta?${params.toString()}`;

      console.log('Fetching services from:', servicesUrl);
      console.log('Fetching meta from:', metaUrl);

      try {
        // Gọi cả 2 API song song để tăng tốc độ
        const [servicesRes, metaRes] = await Promise.all([
          fetch(servicesUrl),
          fetch(metaUrl)
        ]);

        if (!servicesRes.ok) throw new Error("Không thể tải danh sách dịch vụ.");
        if (!metaRes.ok) throw new Error("Không thể tải dữ liệu bộ lọc.");

        const servicesData = await servicesRes.json();
        const metaData = await metaRes.json();

        setServices(servicesData.data);
        setPagination(servicesData.pagination);
        setFilterOptions(metaData.meta);

        // Cập nhật lại thanh trượt giá lần đầu tiên
        if (priceRange[0] === 0 && priceRange[1] === 1000000) {
          setPriceRange([metaData.meta.priceRange.min, metaData.meta.priceRange.max]);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsMetaLoading(false);
      }
    };

    fetchData();
  }, [currentPage, debouncedSearchTerm, selectedCategories, selectedDurations, debouncedPriceRange]);

  // Hàm xử lý chung khi bộ lọc thay đổi, sẽ reset về trang 1
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (value: any) => {
    setter(value);
    setCurrentPage(1); // Quan trọng: Reset về trang đầu tiên khi thay đổi bộ lọc
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Cột Filter */}
        <div className="lg:col-span-1">
          <ServicesFilter
            searchTerm={searchTerm}
            onSearchTermChange={handleFilterChange(setSearchTerm)}
            selectedCategories={selectedCategories}
            onCategoryChange={handleFilterChange(setSelectedCategories)}
            selectedDurations={selectedDurations}
            onDurationChange={handleFilterChange(setSelectedDurations)}
            priceRange={priceRange}
            onPriceRangeChange={handleFilterChange(setPriceRange)}

            // Props động được truyền xuống
            availableCategories={filterOptions?.categories}
            availableDurations={filterOptions?.durations}
            priceBounds={filterOptions?.priceRange}
            isLoading={isMetaLoading}
          />
        </div>

        {/* Cột danh sách dịch vụ */}
        <div className="lg:col-span-3">
          <ServicesList
            services={services}
            pagination={pagination}
            isLoading={isLoading}
            error={error}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}