
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
    appointments,
    appointmentServices,
    services,
    staff,
    staffSchedules,
    staffServices,
} from "@/db/schema";

export type AvailableSlot = {
    staffId: number;
    staffName: string;
    startTime: string;
    endTime: string;
};

function toMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

function toTimeString(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isValidDate(date: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const parsed = new Date(`${date}T12:00:00+07:00`);
    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
    );
}

function getDayOfWeek(date: string): number {
    // Dùng mốc giờ Việt Nam để tránh lệch ngày do timezone.
    return new Date(`${date}T12:00:00+07:00`).getDay();
}

function overlaps(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
): boolean {
    return startA < endB && endA > startB;
}

export async function getAvailableSlots(params: {
    date: string;
    serviceIds: number[];
    staffId?: number;
    intervalMinutes?: number;
}): Promise<AvailableSlot[]> {
    const {
        date,
        serviceIds,
        staffId,
        intervalMinutes = 30,
    } = params;

    if (!isValidDate(date)) {
        throw new Error("Ngày không hợp lệ. Hãy dùng định dạng YYYY-MM-DD.");
    }

    if (
        !serviceIds.length ||
        serviceIds.some((id) => !Number.isInteger(id) || id <= 0)
    ) {
        throw new Error("Cần chọn ít nhất một dịch vụ hợp lệ.");
    }

    if (
        !Number.isInteger(intervalMinutes) ||
        intervalMinutes < 5 ||
        intervalMinutes > 120
    ) {
        throw new Error("Khoảng cách giữa các slot không hợp lệ.");
    }

    const selectedServices = await db.query.services.findMany({
        where: and(
            inArray(services.id, serviceIds),
            eq(services.status, "active"),
        ),
    });

    if (selectedServices.length !== new Set(serviceIds).size) {
        throw new Error("Có dịch vụ không tồn tại hoặc đã ngừng hoạt động.");
    }

    const totalDuration = selectedServices.reduce(
        (sum, service) => sum + service.duration,
        0,
    );

    const eligibleStaffIds = await db.query.staffServices.findMany({
        where: inArray(staffServices.serviceId, serviceIds),
    });

    // Một nhân viên phải có đủ kỹ năng cho tất cả dịch vụ được chọn.
    const serviceCountByStaff = new Map<number, Set<number>>();

    for (const item of eligibleStaffIds) {
        const ids = serviceCountByStaff.get(item.staffId) ?? new Set<number>();
        ids.add(item.serviceId);
        serviceCountByStaff.set(item.staffId, ids);
    }

    const candidateIds = [...serviceCountByStaff.entries()]
        .filter(([, ids]) => serviceIds.every((id) => ids.has(id)))
        .map(([id]) => id);

    if (!candidateIds.length) return [];

    const activeStaff = await db.query.staff.findMany({
        where: and(
            inArray(staff.id, candidateIds),
            eq(staff.status, "active"),
            ...(staffId ? [eq(staff.id, staffId)] : []),
        ),
        with: {
            user: {
                columns: { name: true },
            },
        },
    });

    if (!activeStaff.length) return [];

    const schedules = await db.query.staffSchedules.findMany({
        where: and(
            inArray(
                staffSchedules.staffId,
                activeStaff.map((member) => member.id),
            ),
            eq(staffSchedules.dayOfWeek, getDayOfWeek(date)),
        ),
    });

    const dayAppointments = await db.query.appointments.findMany({
        where: and(
            eq(appointments.appointmentDate, date),
            inArray(appointments.status, [
                "pending",
                "confirmed",
                "in-progress",
            ]),
        ),
        with: {
            appointmentServices: {
                columns: {
                    staffId: true,
                },
            },
        },
        columns: {
            id: true,
            appointmentTime: true,
            durationAtBooking: true,
        },
    });

    const slots: AvailableSlot[] = [];

    for (const member of activeStaff) {
        const schedule = schedules.find(
            (item) => item.staffId === member.id,
        );

        if (!schedule) continue;

        const shiftStart = toMinutes(schedule.startTime);
        const shiftEnd = toMinutes(schedule.endTime);

        for (
            let start = shiftStart;
            start + totalDuration <= shiftEnd;
            start += intervalMinutes
        ) {
            const end = start + totalDuration;

            const hasConflict = dayAppointments.some((appointment) => {
                const assignedToStaff = appointment.appointmentServices.some(
                    (item) => item.staffId === member.id,
                );

                if (!assignedToStaff) return false;

                const appointmentStart = toMinutes(appointment.appointmentTime);
                const appointmentEnd =
                    appointmentStart + appointment.durationAtBooking;

                return overlaps(start, end, appointmentStart, appointmentEnd);
            });

            if (!hasConflict) {
                slots.push({
                    staffId: member.id,
                    staffName: member.user?.name?.startsWith("v1:")
                        ? "Nhân viên"
                        : member.user?.name || "Nhân viên",
                    startTime: toTimeString(start),
                    endTime: toTimeString(end),
                });
            }
        }
    }

    return slots.sort(
        (a, b) =>
            a.startTime.localeCompare(b.startTime) ||
            a.staffId - b.staffId,
    );
}
