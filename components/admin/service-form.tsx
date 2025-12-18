"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { validateServiceForm } from "@/lib/form-validation"

// --- Định nghĩa kiểu dữ liệu ---
interface ApiCategory { id: number; name: string; }
interface ApiStaff { id: number; name: string; }
interface ServiceDetailsData {
  id: number; name: string; price: string; duration: number; description: string | null;
  status: 'active' | 'archived'; imageUrl: string | null; categoryId: number | null;
  staffServices?: { staff: ApiStaff }[];
}

interface ServiceFormProps {
  service?: ServiceDetailsData | null;
  categories: ApiCategory[];
  allStaff: ApiStaff[];
  onSave: (service: any, isEditing: boolean) => Promise<void>;
  onCancel: () => void;
}

export function ServiceForm({ service, categories, allStaff, onSave, onCancel }: ServiceFormProps) {
  // --- STATE ĐÃ ĐƯỢC TÁCH RIÊNG ---
  const [name, setName] = useState(service?.name || "");
  const [categoryId, setCategoryId] = useState(service?.categoryId?.toString() || "");
  const [price, setPrice] = useState(service?.price?.toString() || "");
  const [duration, setDuration] = useState(service?.duration?.toString() || "");
  const [description, setDescription] = useState(service?.description || "");
  const [status, setStatus] = useState<'active' | 'archived'>(service?.status || "active");
  const [imageUrl, setImageUrl] = useState(service?.imageUrl || "");
  const [selectedStaffIds, setSelectedStaffIds] = useState(service?.staffServices?.map(ss => ss.staff.id) || []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- LOGIC ĐỒNG BỘ DỮ LIỆU ---
  useEffect(() => {
    if (service) {
      setName(service.name || "");
      setCategoryId(service.categoryId?.toString() || "");
      setPrice(service.price?.toString() || "");
      setDuration(service.duration?.toString() || "");
      setDescription(service.description || "");
      setStatus(service.status || "active");
      setImageUrl(service.imageUrl || "");
      setSelectedStaffIds(service.staffServices?.map(ss => ss.staff.id) || []);
    } else {
      setName(""); setCategoryId(""); setPrice(""); setDuration("");
      setDescription(""); setStatus("active"); setImageUrl("");
      setSelectedStaffIds([]);
    }
    setImageFile(null);
  }, [service]);

  // --- HANDLERS ---
  const handleStaffChange = (staffId: number, checked: boolean) => {
    setSelectedStaffIds(prev => checked ? [...prev, staffId] : prev.filter(id => id !== staffId));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate using centralized validation
    const validation = validateServiceForm({
      name,
      description,
      price,
      duration,
    })

    if (!validation.valid) {
      toast.error(validation.error || 'Dữ liệu dịch vụ không hợp lệ')
      return
    }

    if (!categoryId) {
      toast.error("Vui lòng chọn một danh mục.")
      return
    }

    setIsSaving(true)
    let finalImageUrl = imageUrl;

    try {
      if (imageFile) {
        const imageData = new FormData();
        imageData.append('file', imageFile);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}upload`, { method: 'POST', body: imageData });
        const result = await res.json();
        if (!result.success) throw new Error("Upload ảnh thất bại.");
        finalImageUrl = result.url;
      }

      const serviceData = {
        name, categoryId: Number(categoryId), price: Number(price),
        duration: Number(duration), description, status, imageUrl: finalImageUrl,
        staffIds: selectedStaffIds,
      };

      await onSave(serviceData, !!service);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>{service ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}</CardTitle><Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button></CardHeader>
        <CardContent className="max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="name">Tên dịch vụ *</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Danh mục *</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="price">Giá (VNĐ) *</Label><Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="duration">Thời gian (phút) *</Label><Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="description">Mô tả</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
            <div className="space-y-2"><Label htmlFor="image-upload">Hình ảnh</Label><Input id="image-upload" type="file" onChange={handleImageChange} accept="image/*" />{(imageUrl || imageFile) && <div className="mt-2"><img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md" /></div>}</div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={(value: 'active' | 'archived') => setStatus(value)}>
                <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="archived">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Nhân viên thực hiện</Label><Card className="p-4"><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{allStaff.map((staff) => (<div key={staff.id} className="flex items-center space-x-2"><Checkbox id={`staff-${staff.id}`} checked={selectedStaffIds.includes(staff.id)} onCheckedChange={(checked) => handleStaffChange(staff.id, checked as boolean)} /><Label htmlFor={`staff-${staff.id}`} className="text-sm font-normal cursor-pointer">{staff.name}</Label></div>))}</div></Card></div>
            <div className="flex gap-2 justify-end pt-4"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{service ? "Cập nhật" : "Thêm dịch vụ"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}