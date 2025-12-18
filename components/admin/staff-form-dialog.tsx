'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ApiStaff } from '@/types'
import { validateStaffForm } from '@/lib/form-validation'

interface StaffFormDialogProps {
    staffToEdit: ApiStaff | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function StaffFormDialog({
    staffToEdit,
    isOpen,
    onOpenChange,
    onSuccess,
}: StaffFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        specialties: '',
        baseSalary: '',
        avatarUrl: '',
    })

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/'

    useEffect(() => {
        const loadData = async () => {
            if (staffToEdit) {
                setFormData({
                    name: staffToEdit.name || '',
                    email: staffToEdit.email || '',
                    phone: staffToEdit.phone || '',
                    position: staffToEdit.position || '',
                    experience: staffToEdit.experience || '',
                    specialties: staffToEdit.specialties?.join(', ') || '',
                    baseSalary: '',
                    avatarUrl: staffToEdit.avatarUrl || '',
                })

                // Set avatar preview if exists
                if (staffToEdit.avatarUrl) {
                    setAvatarPreview(staffToEdit.avatarUrl)
                }

                // Fetch base salary for editing
                try {
                    const res = await fetch(`${apiUrl}admin/staff/${staffToEdit.id}/salary`)
                    const result = await res.json()
                    if (result.success && result.data.baseSalary) {
                        setFormData((prev) => ({
                            ...prev,
                            baseSalary: result.data.baseSalary.toString(),
                        }))
                    }
                } catch (error) {
                    console.error('[StaffFormDialog] Error fetching salary:', error)
                }
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    position: '',
                    experience: '',
                    specialties: '',
                    baseSalary: '',
                    avatarUrl: '',
                })
                setAvatarPreview(null)
            }
        }

        if (isOpen) {
            loadData()
        }
    }, [staffToEdit, isOpen, apiUrl])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        switch (name) {
            case 'name':
            case 'position':
            case 'specialties':
                // Only allow letters, numbers, spaces, and Vietnamese characters
                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                }))
                break

            case 'email':
                // Allow email format
                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                }))
                break

            case 'phone':
                // Only allow digits and common phone separators
                const phoneValue = value.replace(/[^\d\s\-\+()]/g, '')
                setFormData((prev) => ({
                    ...prev,
                    [name]: phoneValue,
                }))
                break

            case 'experience':
                // Only allow numbers and specific keywords
                // Accepts: "5", "5 năm", "2 năm kinh nghiệm", etc.
                const expValue = value.replace(/[^0-9\sñáàãảạăằắẳẵặâầấẩẫậéèẻẽẹêềếểễệíìỉĩịóòỏõọôồốổỗộơờớởỡợúùủũụưừứửữựỳỵỷỹýđDdNnKkVvEe]/g, '')
                setFormData((prev) => ({
                    ...prev,
                    [name]: expValue,
                }))
                break

            case 'baseSalary':
                // Only allow numbers, must be a valid number
                if (value === '') {
                    setFormData((prev) => ({
                        ...prev,
                        [name]: '',
                    }))
                } else {
                    // Remove any non-digit characters
                    const numOnly = value.replace(/[^\d]/g, '')
                    const numValue = Number(numOnly)

                    if (isNaN(numValue)) {
                        // Don't update if not a number
                        return
                    } else if (numValue < 0) {
                        // Reset to 0 if negative
                        setFormData((prev) => ({
                            ...prev,
                            [name]: '0',
                        }))
                    } else {
                        setFormData((prev) => ({
                            ...prev,
                            [name]: numOnly,
                        }))
                    }
                }
                break

            default:
                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                }))
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn một file hình ảnh')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước file không được vượt quá 5MB')
            return
        }

        setUploading(true)
        try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)

            const res = await fetch(`${apiUrl}upload`, {
                method: 'POST',
                body: formDataUpload,
            })

            if (!res.ok) {
                const errorText = await res.text()
                console.error('[StaffFormDialog] Upload HTTP error:', res.status, errorText)
                toast.error(`Lỗi tải ảnh lên: ${res.status}`)
                return
            }

            const result = await res.json()
            console.log('[StaffFormDialog] Upload response:', result)

            if (result.success && (result.url || result.data?.url)) {
                const uploadedUrl = result.url || result.data?.url
                setFormData((prev) => ({
                    ...prev,
                    avatarUrl: uploadedUrl,
                }))
                setAvatarPreview(uploadedUrl)
                toast.success('Tải ảnh lên thành công')
            } else {
                const errorMsg = result.error || 'Lỗi tải ảnh lên'
                console.error('[StaffFormDialog] Upload failed:', errorMsg)
                toast.error(errorMsg)
            }
        } catch (error) {
            console.error('[StaffFormDialog] Avatar upload error:', error)
            toast.error('Lỗi tải ảnh lên')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Use centralized validation
        const validation = validateStaffForm({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            position: formData.position,
            experience: formData.experience,
            baseSalary: formData.baseSalary,
            specialties: formData.specialties,
        })

        if (!validation.valid) {
            toast.error(validation.error || 'Dữ liệu không hợp lệ')
            return
        }

        setLoading(true)

        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim(),
                position: formData.position.trim() || null,
                experience: formData.experience.trim() || null,
                baseSalary: formData.baseSalary.trim() ? Number(formData.baseSalary) : null,
                avatarUrl: formData.avatarUrl || null,
                specialties: formData.specialties
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s),
            }

            const method = staffToEdit ? 'PUT' : 'POST'
            const url = staffToEdit ? `${apiUrl}admin/staff/${staffToEdit.id}` : `${apiUrl}admin/staff`

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await res.json()

            if (result.success) {
                toast.success(
                    staffToEdit ? 'Cập nhật nhân viên thành công' : 'Thêm nhân viên thành công'
                )
                setLoading(false)
                onSuccess()
            } else {
                toast.error(result.error?.message || 'Lỗi lưu nhân viên')
                setLoading(false)
            }
        } catch (error) {
            console.error('[StaffFormDialog] Error:', error)
            toast.error('Lỗi lưu nhân viên')
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {staffToEdit ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên'}
                    </DialogTitle>
                    <DialogDescription>
                        {staffToEdit
                            ? 'Cập nhật thông tin nhân viên'
                            : 'Nhập thông tin nhân viên mới'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Avatar Upload Section */}
                    <div className="space-y-2">
                        <Label htmlFor="avatar">Ảnh Đại Diện</Label>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={uploading || loading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Chọn ảnh JPG, PNG (tối đa 5MB)
                                </p>
                            </div>
                            {avatarPreview && (
                                <div className="flex-shrink-0">
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar preview"
                                        className="w-20 h-20 rounded-lg object-cover border"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Tên Nhân Viên *</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Nhập tên nhân viên"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Nhập email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Số Điện Thoại *</Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="Nhập số điện thoại (10-11 chữ số)"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="position">Chức Vụ / Vị Trí</Label>
                        <Input
                            id="position"
                            name="position"
                            placeholder="Ví dụ: Chuyên viên nail, Thợ cắt tóc"
                            value={formData.position}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="experience">Kinh Nghiệm (Năm)</Label>
                        <Input
                            id="experience"
                            name="experience"
                            placeholder="Ví dụ: 5 năm, 2 năm"
                            value={formData.experience}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baseSalary">Lương Cứng (VND)</Label>
                        <Input
                            id="baseSalary"
                            name="baseSalary"
                            type="number"
                            placeholder="Ví dụ: 5000000"
                            value={formData.baseSalary}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Lương cứng hàng tháng của nhân viên
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="specialties">Chuyên Môn</Label>
                        <Textarea
                            id="specialties"
                            name="specialties"
                            placeholder="Nhập chuyên môn, phân cách bằng dấu phẩy. Ví dụ: Nail gel, Nail art, Chăm sóc móng"
                            value={formData.specialties}
                            onChange={handleChange}
                            disabled={loading}
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            Các chuyên môn được phân cách bằng dấu phẩy (,)
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
