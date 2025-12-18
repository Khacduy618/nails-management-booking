// "use client"

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Slider } from "@/components/ui/slider"
// import { Search, Filter, X } from "lucide-react"
// import { useState, useEffect } from "react"
// import { Skeleton } from "@/components/ui/skeleton"

// // --- Định nghĩa các kiểu dữ liệu ---

// interface ServicesFilterProps {
//   searchTerm: string;
//   onSearchTermChange: (value: string) => void;
//   selectedCategories: string[];
//   onCategoryChange: (value: string[]) => void;
//   selectedDurations: string[];
//   onDurationChange: (value: string[]) => void;
//   priceRange: number[];
//   onPriceRangeChange: (value: number[]) => void;
//   availableCategories: { id: number; name: string; count: number }[];
//   maxPrice: number;
// }

// interface ApiCategory {
//     id: number;
//     name: string;
// }

// const durationOptions = [
//   { id: "30", label: "Dưới 30 phút" },
//   { id: "60", label: "30 - 60 phút" },
//   { id: "90", label: "60 - 90 phút" },
//   { id: "120", label: "Trên 90 phút" },
// ];

// export function ServicesFilter({
//   searchTerm,
//   onSearchTermChange,
//   selectedCategories,
//   onCategoryChange,
//   selectedDurations,
//   onDurationChange,
//   priceRange,
//   onPriceRangeChange,
//   availableCategories,
//   maxPrice,
// }: ServicesFilterProps) {
//   const [isFilterOpen, setIsFilterOpen] = useState(false);
//   const [serviceCategories, setServiceCategories] = useState<ApiCategory[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     async function fetchFilterData() {
//         setIsLoading(true);
//         try {
//             const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
//             const res = await fetch(`${apiUrl}service-categories`); 
//             if (res.ok) {
//                 const data = await res.json();
//                 setServiceCategories(data.categories);
//             } else {
//                 throw new Error("Failed to fetch categories");
//             }
//         } catch (error) {
//             console.error("Error fetching filter data:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     }
//     fetchFilterData();
//   }, []);

//   const handleCategoryChange = (categoryId: string, checked: boolean) => {
//     const newCategories = checked
//       ? [...selectedCategories, categoryId]
//       : selectedCategories.filter((id) => id !== categoryId);
//     onCategoryChange(newCategories);
//   };
  
//   const handleDurationChange = (durationId: string, checked: boolean) => {
//     const newDurations = checked
//       ? [...selectedDurations, durationId]
//       : selectedDurations.filter((id) => id !== durationId);
//     onDurationChange(newDurations);
//   };

//   const clearAllFilters = () => {
//     onSearchTermChange("");
//     onCategoryChange([]);
//     onDurationChange([]);
//     onPriceRangeChange([0, 1000000]);
//   };

//   const hasActiveFilters =
//     searchTerm ||
//     selectedCategories.length > 0 ||
//     selectedDurations.length > 0 ||
//     priceRange[0] > 0 ||
//     priceRange[1] < 1000000;

//   return (
//     <>
//       <div className="lg:hidden mb-4">
//         <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)} className="w-full justify-between">
//           <div className="flex items-center space-x-2"><Filter className="h-4 w-4" /><span>Bộ lọc</span></div>
//           {hasActiveFilters && <div className="h-2 w-2 bg-primary rounded-full" />}
//         </Button>
//       </div>

//       <div className={`space-y-6 ${isFilterOpen ? "block" : "hidden lg:block"}`}>
//         <Card>
//           <CardHeader className="pb-3"><CardTitle>Tìm kiếm</CardTitle></CardHeader>
//           <CardContent>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input placeholder="Tìm dịch vụ..." value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} className="pl-10" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader><CardTitle>Loại dịch vụ</CardTitle></CardHeader>
//           <CardContent className="space-y-3">
//             {/* Render dựa trên availableCategories từ props */}
//             {availableCategories.length === 0 ? (
//               <p className="text-sm text-muted-foreground">Đang tải...</p>
//             ) : (
//               availableCategories.map((category) => (
//                 <div key={category.id} className="flex items-center justify-between">
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id={`cat-${category.name}`}
//                       checked={selectedCategories.includes(category.name)}
//                       onCheckedChange={(checked) => handleCategoryChange(category.name, checked as boolean)}
//                     />
//                     <Label htmlFor={`cat-${category.name}`}>{category.name}</Label>
//                   </div>
//                   <span className="text-xs text-muted-foreground">({category.count})</span>
//                 </div>
//               ))
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="pb-3"><CardTitle>Thời gian</CardTitle></CardHeader>
//           <CardContent className="space-y-3">
//             {durationOptions.map((duration) => (
//               <div key={duration.id} className="flex items-center space-x-2">
//                 <Checkbox
//                   id={`dur-${duration.id}`}
//                   checked={selectedDurations.includes(duration.id)}
//                   onCheckedChange={(checked) => handleDurationChange(duration.id, checked as boolean)}
//                 />
//                 <Label htmlFor={`dur-${duration.id}`}>{duration.label}</Label>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader><CardTitle>Khoảng giá</CardTitle></CardHeader>
//           <CardContent className="space-y-4">
//             {/* Sử dụng maxPrice từ props */}
//             <Slider value={priceRange} onValueChange={onPriceRangeChange} max={maxPrice} step={50000} />
//             <div className="flex justify-between text-sm text-muted-foreground">
//               <span>{priceRange[0].toLocaleString("vi-VN")}đ</span>
//               <span>{priceRange[1].toLocaleString("vi-VN")}đ</span>
//             </div>
//           </CardContent>
//     </Card>

//         {hasActiveFilters && <Button variant="outline" onClick={clearAllFilters} className="w-full"><X className="h-4 w-4 mr-2" />Xóa bộ lọc</Button>}
//       </div>
//     </>
//   )
// }

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, X } from "lucide-react"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// --- Định nghĩa các kiểu dữ liệu cho props ---
interface ServicesFilterProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedCategories: string[];
  onCategoryChange: (value: string[]) => void;
  selectedDurations: string[];
  onDurationChange: (value: string[]) => void;
  priceRange: number[];
  onPriceRangeChange: (value: number[]) => void;

  // Props động từ API meta
  availableCategories?: { id: number; name: string; count: number }[];
  availableDurations?: { id: string; label: string; count: number }[];
  priceBounds?: { min: number; max: number };
  isLoading: boolean; // Trạng thái loading cho các tùy chọn bộ lọc
}

export function ServicesFilter({
  searchTerm,
  onSearchTermChange,
  selectedCategories,
  onCategoryChange,
  selectedDurations,
  onDurationChange,
  priceRange,
  onPriceRangeChange,
  availableCategories = [], // Gán giá trị mặc định để tránh lỗi
  availableDurations = [],
  priceBounds = { min: 0, max: 1000000 },
  isLoading,
}: ServicesFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Component này không còn gọi API nữa

  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    const newCategories = checked
      ? [...selectedCategories, categoryName]
      : selectedCategories.filter((name) => name !== categoryName);
    onCategoryChange(newCategories);
  };
  
  const handleDurationChange = (durationId: string, checked: boolean) => {
    const newDurations = checked
      ? [...selectedDurations, durationId]
      : selectedDurations.filter((id) => id !== durationId);
    onDurationChange(newDurations);
  };

  const clearAllFilters = () => {
    onSearchTermChange("");
    onCategoryChange([]);
    onDurationChange([]);
    onPriceRangeChange([priceBounds.min, priceBounds.max]); // Reset về khoảng giá đầy đủ
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedCategories.length > 0 ||
    selectedDurations.length > 0 ||
    priceRange[0] > priceBounds.min ||
    priceRange[1] < priceBounds.max;

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)} className="w-full justify-between">
          <div className="flex items-center space-x-2"><Filter className="h-4 w-4" /><span>Bộ lọc</span></div>
          {hasActiveFilters && <div className="h-2 w-2 bg-primary rounded-full" />}
        </Button>
      </div>

      {/* Filter Panel */}
      <div className={`space-y-6 ${isFilterOpen ? "block" : "hidden lg:block"}`}>
        {/* Search */}
        <Card>
          <CardHeader className="pb-3"><CardTitle>Tìm kiếm</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm dịch vụ..." value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="pb-3"><CardTitle>Loại dịch vụ</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : (
              availableCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category.name}`}
                      checked={selectedCategories.includes(category.name)}
                      onCheckedChange={(checked) => handleCategoryChange(category.name, checked as boolean)}
                    />
                    <Label htmlFor={`cat-${category.name}`} className="capitalize cursor-pointer">{category.name}</Label>
                  </div>
                  <span className="text-xs text-muted-foreground">({category.count})</span>
                </div>
              ))
            )}
            {!isLoading && availableCategories.length === 0 && <p className="text-sm text-muted-foreground">Không có lựa chọn.</p>}
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardHeader className="pb-3"><CardTitle>Thời gian</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : (
              availableDurations.map((duration) => (
                <div key={duration.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`dur-${duration.id}`}
                      checked={selectedDurations.includes(duration.id)}
                      onCheckedChange={(checked) => handleDurationChange(duration.id, checked as boolean)}
                    />
                    <Label htmlFor={`dur-${duration.id}`} className="cursor-pointer">{duration.label}</Label>
                  </div>
                   <span className="text-xs text-muted-foreground">({duration.count})</span>
                </div>
              ))
            )}
            {!isLoading && availableDurations.length === 0 && <p className="text-sm text-muted-foreground">Không có lựa chọn.</p>}
          </CardContent>
        </Card>

        {/* Price Range */}
        <Card>
          <CardHeader className="pb-3"><CardTitle>Khoảng giá</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-2">
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <>
                <Slider 
                  value={priceRange} 
                  onValueChange={onPriceRangeChange} 
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={50000} 
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{priceRange[0].toLocaleString("vi-VN")}đ</span>
                  <span>{priceRange[1].toLocaleString("vi-VN")}đ</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Clear Filters */}
        {hasActiveFilters && <Button variant="outline" onClick={clearAllFilters} className="w-full"><X className="h-4 w-4 mr-2" />Xóa bộ lọc</Button>}
      </div>
    </>
  )
}