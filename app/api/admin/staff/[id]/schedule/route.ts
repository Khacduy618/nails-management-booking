import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { staffSchedules } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const staffId = parseInt(params.id)

        if (isNaN(staffId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'INVALID_STAFF_ID', message: 'Invalid staff ID' },
                },
                { status: 400 }
            )
        }

        const schedules = await db
            .select()
            .from(staffSchedules)
            .where(eq(staffSchedules.staffId, staffId))
            .orderBy(staffSchedules.dayOfWeek)

        return NextResponse.json({
            success: true,
            data: schedules,
        })
    } catch (error) {
        console.error('[GET /api/admin/staff/[id]/schedule]', error)
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
            },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const staffId = parseInt(params.id)

        if (isNaN(staffId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'INVALID_STAFF_ID', message: 'Invalid staff ID' },
                },
                { status: 400 }
            )
        }

        const { schedules: newSchedules } = await request.json()

        if (!Array.isArray(newSchedules)) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'INVALID_SCHEDULES', message: 'Schedules must be an array' },
                },
                { status: 400 }
            )
        }

        // Delete existing schedules for this staff
        await db.delete(staffSchedules).where(eq(staffSchedules.staffId, staffId))

        // Insert new schedules
        if (newSchedules.length > 0) {
            const scheduleValues = newSchedules.map((s: any) => ({
                staffId,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
            }))

            await db.insert(staffSchedules).values(scheduleValues)
        }

        return NextResponse.json({
            success: true,
            data: { message: 'Schedule updated successfully' },
        })
    } catch (error) {
        console.error('[PUT /api/admin/staff/[id]/schedule]', error)
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
            },
            { status: 500 }
        )
    }
}
