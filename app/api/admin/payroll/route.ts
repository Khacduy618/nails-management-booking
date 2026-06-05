import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { appointments, appointmentServices, staff, payrolls, staffBaseSalaries, users } from '@/db/schema'
import { eq, gte, lte, and } from 'drizzle-orm'
import { calculateCommissionAmount, calculateCommissionPercentage } from '@/lib/payroll-utils'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const staffId = parseInt(searchParams.get('staffId') || '0')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!staffId || !startDate || !endDate) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'MISSING_PARAMS', message: 'staffId, startDate, endDate required' },
                },
                { status: 400 }
            )
        }

        // Lấy thông tin nhân viên
        const staffInfo = await db
            .select({
                id: staff.id,
                name: users.name,
            })
            .from(staff)
            .innerJoin(users, eq(staff.userId, users.id))
            .where(eq(staff.id, staffId))
            .limit(1)

        if (!staffInfo || staffInfo.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'STAFF_NOT_FOUND', message: 'Staff not found' },
                },
                { status: 404 }
            )
        }

        // Lấy lương cứng từ bảng staff_base_salaries
        const baseSalaryRecord = await db
            .select({ baseSalary: staffBaseSalaries.baseSalary })
            .from(staffBaseSalaries)
            .where(eq(staffBaseSalaries.staffId, staffId))
            .limit(1)

        const baseSalaryFromDB = baseSalaryRecord.length > 0 ? Number(baseSalaryRecord[0].baseSalary) || 0 : 0

        // Lấy tất cả appointment services của nhân viên trong khoảng thời gian
        const commissionDetails = await db
            .select({
                id: appointmentServices.id,
                appointmentId: appointmentServices.appointmentId,
                serviceId: appointmentServices.serviceId,
                staffId: appointmentServices.staffId,
                priceAtBooking: appointmentServices.priceAtBooking,
                commissionPercentage: appointmentServices.commissionPercentage,
                workShare: appointmentServices.workShare,
                appointmentDate: appointments.appointmentDate,
                appointmentTime: appointments.appointmentTime,
                isOvertime: appointments.isOvertime,
                status: appointments.status,
            })
            .from(appointmentServices)
            .innerJoin(appointments, eq(appointmentServices.appointmentId, appointments.id))
            .where(
                and(
                    eq(appointmentServices.staffId, staffId),
                    eq(appointments.status, 'completed'),
                    gte(appointments.appointmentDate, startDate),
                    lte(appointments.appointmentDate, endDate)
                )
            )

        // Tính chi tiết hoa hồng - Xác định OT dựa trên thời gian hoàn thành
        let totalCommission = 0
        const commissions = commissionDetails.map((item: any) => {
            const workShare = Number(item.workShare) || 100
            const price = Number(item.priceAtBooking) || 0
            const appointmentTime = item.appointmentTime as unknown as string

            // Xác định OT dựa trên thời gian: 17:00 trở đi là OT (30%)
            // Tuy nhiên nếu có isOvertime từ DB thì dùng đó
            let isOT = item.isOvertime || false
            let otReason = ''

            if (appointmentTime) {
                const timeStr = appointmentTime.substring(0, 5) // Format HH:MM
                const [hours] = timeStr.split(':').map(Number)
                if (hours >= 17) {
                    isOT = true
                    otReason = `Hoàn thành lúc ${timeStr} (ngoài giờ 17:00+)`
                } else {
                    otReason = `Hoàn thành lúc ${timeStr} (giờ bình thường)`
                }
            }

            const percentage = calculateCommissionPercentage(workShare, isOT)
            const amount = calculateCommissionAmount(price, workShare, isOT)

            totalCommission += amount

            return {
                appointmentServiceId: item.id,
                appointmentId: item.appointmentId,
                serviceId: item.serviceId,
                date: item.appointmentDate,
                time: item.appointmentTime,
                price: price,
                workShare: workShare,
                isOvertime: isOT,
                otReason: otReason,
                percentage: percentage,
                amount: amount,
            }
        })

        // Lấy payroll record nếu có
        const payrollRecord = await db
            .select()
            .from(payrolls)
            .where(
                and(
                    eq(payrolls.staffId, staffId),
                    eq(payrolls.payPeriodStart, startDate),
                    eq(payrolls.payPeriodEnd, endDate)
                )
            )
            .limit(1)

        // Sử dụng lương cứng từ bảng staff_base_salaries
        const totalBonus = payrollRecord.length > 0 ? Number(payrollRecord[0].totalBonus) || 0 : 0
        const totalDeduction = payrollRecord.length > 0 ? Number(payrollRecord[0].totalDeduction) || 0 : 0

        const finalSalary = baseSalaryFromDB + totalCommission + totalBonus - totalDeduction

        return NextResponse.json({
            success: true,
            data: {
                staffId: staffInfo[0].id,
                staffName: staffInfo[0].name,
                payPeriodStart: startDate,
                payPeriodEnd: endDate,
                baseSalary: baseSalaryFromDB,
                commissions: commissions,
                totalCommission: Math.round(totalCommission * 100) / 100,
                totalBonus: totalBonus,
                totalDeduction: totalDeduction,
                finalSalary: Math.round(finalSalary * 100) / 100,
                commissionDetails: commissions,
            },
        })
    } catch (error) {
        console.error('[GET /api/admin/payroll]', error)
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
            },
            { status: 500 }
        )
    }
}

// PUT endpoint để cập nhật bonus và deduction
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { staffId, startDate, endDate, totalBonus, totalDeduction } = body

        if (!staffId || !startDate || !endDate) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'MISSING_PARAMS', message: 'staffId, startDate, endDate required' },
                },
                { status: 400 }
            )
        }

        // Lấy lương cứng từ bảng staff_base_salaries
        const baseSalaryRecord = await db
            .select({ baseSalary: staffBaseSalaries.baseSalary })
            .from(staffBaseSalaries)
            .where(eq(staffBaseSalaries.staffId, staffId))
            .limit(1)

        const baseSalaryFromDB = baseSalaryRecord.length > 0 ? Number(baseSalaryRecord[0].baseSalary) || 0 : 0

        // Kiểm tra xem payroll record có tồn tại không
        const existingPayroll = await db
            .select()
            .from(payrolls)
            .where(
                and(
                    eq(payrolls.staffId, staffId),
                    eq(payrolls.payPeriodStart, startDate),
                    eq(payrolls.payPeriodEnd, endDate)
                )
            )
            .limit(1)

        let payrollId: number

        if (existingPayroll.length === 0) {
            // Tạo payroll record mới nếu chưa tồn tại
            const insertResult = await db
                .insert(payrolls)
                .values({
                    staffId: staffId,
                    payPeriodStart: startDate,
                    payPeriodEnd: endDate,
                    baseSalary: baseSalaryFromDB.toString(),
                    totalCommission: '0.00',
                    totalBonus: (totalBonus || 0).toString(),
                    totalDeduction: (totalDeduction || 0).toString(),
                    finalSalary: (baseSalaryFromDB + (totalBonus || 0) - (totalDeduction || 0)).toString(),
                    status: 'calculated',
                })

            // Lấy ID của record vừa insert
            const result = await db
                .select({ id: payrolls.id })
                .from(payrolls)
                .where(
                    and(
                        eq(payrolls.staffId, staffId),
                        eq(payrolls.payPeriodStart, startDate),
                        eq(payrolls.payPeriodEnd, endDate)
                    )
                )
                .limit(1)

            payrollId = result[0]?.id || 0
        } else {
            // Cập nhật payroll record hiện có
            payrollId = existingPayroll[0].id

            // Tính lại totalCommission dựa trên appointments đã hoàn thành
            const commissionDetails = await db
                .select({
                    workShare: appointmentServices.workShare,
                    priceAtBooking: appointmentServices.priceAtBooking,
                    appointmentTime: appointments.appointmentTime,
                    isOvertime: appointments.isOvertime,
                })
                .from(appointmentServices)
                .innerJoin(appointments, eq(appointmentServices.appointmentId, appointments.id))
                .where(
                    and(
                        eq(appointmentServices.staffId, staffId),
                        eq(appointments.status, 'completed'),
                        gte(appointments.appointmentDate, startDate),
                        lte(appointments.appointmentDate, endDate)
                    )
                )

            let totalCommission = 0
            commissionDetails.forEach((item: any) => {
                const workShare = Number(item.workShare) || 100
                const price = Number(item.priceAtBooking) || 0
                const appointmentTime = item.appointmentTime as unknown as string

                let isOT = item.isOvertime || false
                if (appointmentTime) {
                    const timeStr = appointmentTime.substring(0, 5)
                    const [hours] = timeStr.split(':').map(Number)
                    if (hours >= 17) {
                        isOT = true
                    }
                }

                const amount = calculateCommissionAmount(price, workShare, isOT)
                totalCommission += amount
            })

            const finalSalary = baseSalaryFromDB + totalCommission + (totalBonus || 0) - (totalDeduction || 0)

            await db
                .update(payrolls)
                .set({
                    baseSalary: baseSalaryFromDB.toString(),
                    totalCommission: (Math.round(totalCommission * 100) / 100).toString(),
                    totalBonus: (totalBonus || 0).toString(),
                    totalDeduction: (totalDeduction || 0).toString(),
                    finalSalary: (Math.round(finalSalary * 100) / 100).toString(),
                })
                .where(
                    and(
                        eq(payrolls.staffId, staffId),
                        eq(payrolls.payPeriodStart, startDate),
                        eq(payrolls.payPeriodEnd, endDate)
                    )
                )
        }

        return NextResponse.json({
            success: true,
            data: {
                message: 'Payroll updated successfully',
                payrollId,
                staffId,
                startDate,
                endDate,
                baseSalary: baseSalaryFromDB,
                totalBonus: totalBonus || 0,
                totalDeduction: totalDeduction || 0,
            },
        })
    } catch (error) {
        console.error('[PUT /api/admin/payroll]', error)
        return NextResponse.json(
            {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
            },
            { status: 500 }
        )
    }
}
