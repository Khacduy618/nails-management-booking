'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Calendar, Clock } from 'lucide-react'

interface ScheduleEntry {
    id?: number
    dayOfWeek: number // 0=Chủ Nhật, 1=Thứ 2, ..., 6=Thứ 7
    startTime: string // "08:00"
    endTime: string // "17:00"
    isWorkDay: boolean
}

interface StaffScheduleDialogProps {
    staffId: number
    staffName: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const DAYS_OF_WEEK = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 0, label: 'Chủ Nhật' },
]

export function StaffScheduleDialog({
    staffId,
    staffName,
    isOpen,
    onOpenChange,
}: StaffScheduleDialogProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([])

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/'

    // Initialize schedules for all 7 days
    useEffect(() => {
        if (isOpen && schedules.length === 0) {
            initializeSchedules()
            fetchSchedules()
        }
    }, [isOpen])

    const initializeSchedules = () => {
        const defaultSchedules: ScheduleEntry[] = Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            startTime: '08:00',
            endTime: '17:00',
            isWorkDay: i !== 0, // Chủ nhật (0) là ngày không làm
        }))
        setSchedules(defaultSchedules)
    }

    const fetchSchedules = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${apiUrl}admin/staff/${staffId}/schedule`)
            const result = await res.json()

            if (result.success && result.data && result.data.length > 0) {
                // Map fetched data to schedule format
                const fetchedSchedules: ScheduleEntry[] = result.data.map((item: any) => ({
                    id: item.id,
                    dayOfWeek: item.dayOfWeek,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    isWorkDay: true,
                }))

                // Merge with all 7 days (in case some days have no entry)
                const merged: ScheduleEntry[] = Array.from({ length: 7 }, (_, i) => {
                    const existing = fetchedSchedules.find((s) => s.dayOfWeek === i)
                    return existing || { dayOfWeek: i, startTime: '08:00', endTime: '17:00', isWorkDay: false }
                })
                setSchedules(merged)
            } else {
                // Use defaults if no data
                initializeSchedules()
            }
        } catch (error) {
            console.error('[StaffScheduleDialog] Fetch error:', error)
            // Use defaults on error
            initializeSchedules()
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = schedules
                .filter((s) => s.isWorkDay)
                .map((s) => ({
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                }))

            const res = await fetch(`${apiUrl}admin/staff/${staffId}/schedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedules: payload }),
            })

            const result = await res.json()

            if (result.success) {
                toast.success('Cập nhật lịch làm thành công')
                onOpenChange(false)
            } else {
                toast.error(result.error?.message || 'Lỗi cập nhật lịch làm')
            }
        } catch (error) {
            console.error('[StaffScheduleDialog] Save error:', error)
            toast.error('Lỗi cập nhật lịch làm')
        } finally {
            setSaving(false)
        }
    }

    const updateSchedule = (dayOfWeek: number, field: keyof ScheduleEntry, value: any) => {
        setSchedules((prev) =>
            prev.map((s) =>
                s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
            )
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        📅 Quản Lý Lịch Làm - {staffName}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {schedules.map((schedule) => {
                            const dayInfo = DAYS_OF_WEEK.find((d) => d.value === schedule.dayOfWeek)
                            return (
                                <div
                                    key={schedule.dayOfWeek}
                                    className="border rounded-lg p-4 space-y-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id={`work-day-${schedule.dayOfWeek}`}
                                            checked={schedule.isWorkDay}
                                            onCheckedChange={(checked) =>
                                                updateSchedule(schedule.dayOfWeek, 'isWorkDay', checked)
                                            }
                                        />
                                        <Label
                                            htmlFor={`work-day-${schedule.dayOfWeek}`}
                                            className="font-semibold text-base cursor-pointer"
                                        >
                                            {dayInfo?.label}
                                        </Label>
                                        {!schedule.isWorkDay && (
                                            <Badge variant="secondary">Ngày OFF</Badge>
                                        )}
                                    </div>

                                    {schedule.isWorkDay && (
                                        <div className="flex gap-4 ml-6">
                                            <div className="flex-1">
                                                <Label htmlFor={`start-${schedule.dayOfWeek}`} className="text-sm">
                                                    Giờ bắt đầu
                                                </Label>
                                                <Input
                                                    id={`start-${schedule.dayOfWeek}`}
                                                    type="time"
                                                    value={schedule.startTime}
                                                    onChange={(e) =>
                                                        updateSchedule(schedule.dayOfWeek, 'startTime', e.target.value)
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Label htmlFor={`end-${schedule.dayOfWeek}`} className="text-sm">
                                                    Giờ kết thúc
                                                </Label>
                                                <Input
                                                    id={`end-${schedule.dayOfWeek}`}
                                                    type="time"
                                                    value={schedule.endTime}
                                                    onChange={(e) =>
                                                        updateSchedule(schedule.dayOfWeek, 'endTime', e.target.value)
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        onClick={handleSave}
                        disabled={saving || loading}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu Lịch Làm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
