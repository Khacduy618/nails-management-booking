"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"

interface StaffFormProps {
  staff?: any
  onSave: (staff: any) => void
  onCancel: () => void
}

const positions = ["Chuyên viên tóc", "Chuyên viên spa", "Chuyên viên nail", "Thợ cắt tóc nam", "Điều hành", "Lễ tân"]
const specialtyOptions = [
  "Cắt tóc",
  "Nhuộm tóc",
  "Uốn tóc",
  "Massage",
  "Chăm sóc da",
  "Trị liệu",
  "Nail gel",
  "Nail art",
  "Chăm sóc móng",
  "Cạo râu",
  "Tạo kiểu",
]

const daysOfWeek = [
  { key: "monday", label: "Thứ 2" },
  { key: "tuesday", label: "Thứ 3" },
  { key: "wednesday", label: "Thứ 4" },
  { key: "thursday", label: "Thứ 5" },
  { key: "friday", label: "Thứ 6" },
  { key: "saturday", label: "Thứ 7" },
  { key: "sunday", label: "Chủ nhật" },
]

export function StaffForm({ staff, onSave, onCancel }: StaffFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    specialties: [] as string[],
    experience: "",
    status: "active",
    avatar: "",
    joinDate: "",
    schedule: {
      monday: { start: "", end: "" },
      tuesday: { start: "", end: "" },
      wednesday: { start: "", end: "" },
      thursday: { start: "", end: "" },
      friday: { start: "", end: "" },
      saturday: { start: "", end: "" },
      sunday: { start: "", end: "" },
    },
  })

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || "",
        email: staff.email || "",
        phone: staff.phone || "",
        position: staff.position || "",
        specialties: staff.specialties || [],
        experience: staff.experience || "",
        status: staff.status || "active",
        avatar: staff.avatar || "",
        joinDate: staff.joinDate || "",
        schedule: staff.schedule || {
          monday: { start: "", end: "" },
          tuesday: { start: "", end: "" },
          wednesday: { start: "", end: "" },
          thursday: { start: "", end: "" },
          friday: { start: "", end: "" },
          saturday: { start: "", end: "" },
          sunday: { start: "", end: "" },
        },
      })
    }
  }, [staff])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, specialties: [...formData.specialties, specialty] })
    } else {
      setFormData({ ...formData, specialties: formData.specialties.filter((s) => s !== specialty) })
    }
  }

  const handleScheduleChange = (day: string, field: "start" | "end", value: string) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [day]: {
          ...formData.schedule[day as keyof typeof formData.schedule],
          [field]: value,
        },
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between p-[10px] sm:p-6">
          <CardTitle>{staff ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-[10px] sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Vị trí *</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Kinh nghiệm</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="VD: 3 năm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate">Ngày vào làm</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">URL ảnh đại diện</Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Đang làm việc</SelectItem>
                      <SelectItem value="inactive">Tạm nghỉ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Chuyên môn</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {specialtyOptions.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialty}
                      checked={formData.specialties.includes(specialty)}
                      onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked as boolean)}
                    />
                    <Label htmlFor={specialty} className="text-sm">
                      {specialty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Lịch làm việc</h3>
              <div className="space-y-3">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <Label className="font-medium">{day.label}</Label>
                    <div className="space-y-1">
                      <Label htmlFor={`${day.key}-start`} className="text-xs text-muted-foreground">
                        Giờ bắt đầu
                      </Label>
                      <Input
                        id={`${day.key}-start`}
                        type="time"
                        value={formData.schedule[day.key as keyof typeof formData.schedule].start}
                        onChange={(e) => handleScheduleChange(day.key, "start", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`${day.key}-end`} className="text-xs text-muted-foreground">
                        Giờ kết thúc
                      </Label>
                      <Input
                        id={`${day.key}-end`}
                        type="time"
                        value={formData.schedule[day.key as keyof typeof formData.schedule].end}
                        onChange={(e) => handleScheduleChange(day.key, "end", e.target.value)}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formData.schedule[day.key as keyof typeof formData.schedule].start &&
                        formData.schedule[day.key as keyof typeof formData.schedule].end
                        ? "Có làm việc"
                        : "Nghỉ"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {staff ? "Cập nhật" : "Thêm nhân viên"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
