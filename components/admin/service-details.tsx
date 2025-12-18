// "use client"

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { X, Edit, Clock, DollarSign, Users } from "lucide-react"

// interface ServiceDetailsProps {
//   service: any
//   onClose: () => void
//   onEdit: () => void
// }

// export function ServiceDetails({ service, onClose, onEdit }: ServiceDetailsProps) {
//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//       <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <CardHeader className="flex flex-row items-center justify-between">
//           <CardTitle>Chi tiết dịch vụ</CardTitle>
//           <Button variant="ghost" size="icon" onClick={onClose}>
//             <X className="h-4 w-4" />
//           </Button>
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {/* Service Image */}
//           <div className="aspect-video bg-muted rounded-lg overflow-hidden">
//             <img
//               src={service.image || "/placeholder.svg"}
//               alt={service.name}
//               className="w-full h-full object-cover"
//               onError={(e) => {
//                 e.currentTarget.src = `/placeholder.svg?height=300&width=500&query=${encodeURIComponent(service.name)}`
//               }}
//             />
//           </div>

//           {/* Service Info */}
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h2 className="text-2xl font-bold text-foreground">{service.name}</h2>
//               <Badge
//                 className={
//                   service.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
//                 }
//               >
//                 {service.status === "active" ? "Hoạt động" : "Tạm dừng"}
//               </Badge>
//             </div>

//             <div className="flex items-center gap-4">
//               <Badge variant="outline">{service.category}</Badge>
//             </div>

//             <p className="text-muted-foreground">{service.description}</p>

//             {/* Service Stats */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
//                 <DollarSign className="h-5 w-5 text-primary" />
//                 <div>
//                   <div className="text-sm text-muted-foreground">Giá dịch vụ</div>
//                   <div className="font-semibold text-foreground">{service.price.toLocaleString("vi-VN")}₫</div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
//                 <Clock className="h-5 w-5 text-accent" />
//                 <div>
//                   <div className="text-sm text-muted-foreground">Thời gian</div>
//                   <div className="font-semibold text-foreground">{service.duration} phút</div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
//                 <Users className="h-5 w-5 text-secondary" />
//                 <div>
//                   <div className="text-sm text-muted-foreground">Nhân viên</div>
//                   <div className="font-semibold text-foreground">{service.staff.length} người</div>
//                 </div>
//               </div>
//             </div>

//             {/* Staff List */}
//             <div>
//               <h3 className="font-semibold text-foreground mb-2">Nhân viên thực hiện</h3>
//               <div className="flex flex-wrap gap-2">
//                 {service.staff.map((staff: string) => (
//                   <Badge key={staff} variant="outline">
//                     {staff}
//                   </Badge>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex gap-2 pt-4 border-t border-border">
//             <Button onClick={onEdit} className="flex-1">
//               <Edit className="h-4 w-4 mr-2" />
//               Chỉnh sửa
//             </Button>
//             <Button variant="outline" onClick={onClose}>
//               Đóng
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Edit, Clock, DollarSign, Users } from "lucide-react"

// --- Định nghĩa kiểu dữ liệu ---
// Lấy lại các kiểu đã định nghĩa ở các component khác cho nhất quán
interface ApiStaff { id: number; name: string; }
interface ApiService {
  id: number;
  name: string;
  price: string;
  duration: number;
  description: string | null;
  status: 'active' | 'archived';
  imageUrl: string | null;
  category: { name: string | null } | null;
  // API chi tiết cần trả về danh sách nhân viên có thể làm dịch vụ này
  staffServices?: { staff: ApiStaff }[];
}

interface ServiceDetailsProps {
  service: ApiService | null;
  onClose: () => void;
  onEdit: () => void;
}

export function ServiceDetails({ service, onClose, onEdit }: ServiceDetailsProps) {
  // Nếu không có service, không render gì cả (hoặc một fallback)
  if (!service) {
    return null;
  }

  // Trích xuất danh sách tên nhân viên từ prop
  const staffList = service.staffServices?.map(ss => ss.staff.name) || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{service.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={
                  service.status === "active" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"
                }
              >
                {service.status === "active" ? "Hoạt động" : "Tạm dừng"}
              </Badge>
              {service.category?.name && (
                <Badge variant="outline">{service.category.name}</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Service Image */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={service.imageUrl || "/placeholder.svg"}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Service Info */}
          <div className="space-y-4">
            {service.description && (
              <p className="text-muted-foreground">{service.description}</p>
            )}

            {/* Service Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Giá dịch vụ</div>
                  <div className="font-semibold text-foreground">{Number(service.price).toLocaleString("vi-VN")}₫</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Thời gian</div>
                  <div className="font-semibold text-foreground">{service.duration} phút</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-6 w-6 text-purple-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Nhân viên</div>
                  <div className="font-semibold text-foreground">{staffList.length} người</div>
                </div>
              </div>
            </div>

            {/* Staff List */}
            {staffList.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Nhân viên có thể thực hiện</h3>
                <div className="flex flex-wrap gap-2">
                  {staffList.map((staffName: string) => (
                    <Badge key={staffName} variant="secondary">
                      {staffName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}