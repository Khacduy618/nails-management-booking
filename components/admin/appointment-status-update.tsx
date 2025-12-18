"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Loader2 } from "lucide-react"
import { ApiAppointment, AppointmentStatus } from "@/types";



interface AppointmentStatusUpdateProps {
  appointment: ApiAppointment | null;
  onSave: (appointmentId: number, status: string, notes?: string) => Promise<void>;
  onCancel: () => void;
}

const statusOptions: { value: AppointmentStatus; label: string; color: string }[] = [
  { value: "pending", label: "Chờ xác nhận", color: "text-yellow-600" },
  { value: "confirmed", label: "Đã xác nhận", color: "text-blue-600" },
  { value: "in-progress", label: "Đang thực hiện", color: "text-green-600" },
  { value: "completed", label: "Hoàn thành", color: "text-gray-600" },
  { value: "cancelled", label: "Đã hủy", color: "text-red-600" },
];

export function AppointmentStatusUpdate({ appointment, onSave, onCancel }: AppointmentStatusUpdateProps) {
  if (!appointment) return null;

  const [status, setStatus] = useState(appointment.status);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(appointment.id, status, notes);
    setIsSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cập nhật trạng thái</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">{appointment.customerName}</div>
              <div className="text-sm text-muted-foreground">{appointment.appointmentServices.map(as => as.service.name).join(' + ')}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái mới *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thêm ghi chú..." rows={3} />
            </div>
            <div className="flex gap-2 pt-4 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Cập nhật
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}