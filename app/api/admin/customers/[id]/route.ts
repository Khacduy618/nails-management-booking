import { db } from '@/db'
import { customers, appointments, appointmentServices, services } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { ok, fail } from '@/lib/api-response'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const customerId = parseInt(params.id, 10)

        if (isNaN(customerId)) {
            return NextResponse.json(
                fail('INVALID_INPUT', 'Invalid customer ID'),
                { status: 400 }
            )
        }

        console.log('[API] /api/admin/customers/[id] called with id:', customerId)

        // Lấy thông tin khách hàng
        const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, customerId))
            .then(result => result[0])

        if (!customer) {
            return NextResponse.json(
                fail('NOT_FOUND', 'Customer not found'),
                { status: 404 }
            )
        }

        // Lấy tất cả lịch hẹn của khách hàng
        const customerAppointments = await db
            .select({
                appointmentId: appointments.id,
                appointmentDate: appointments.appointmentDate,
                appointmentTime: appointments.appointmentTime,
                status: appointments.status,
                totalPrice: appointments.priceAtBooking,
                createdAt: appointments.createdAt,
            })
            .from(appointments)
            .where(eq(appointments.customerId, customerId))

        // Lấy chi tiết dịch vụ của từng lịch hẹn
        const appointmentIds = customerAppointments.map(apt => apt.appointmentId)

        let appointmentServicesList: Array<{
            appointmentId: number
            serviceId: number
            serviceName: string
            servicePrice: string
            serviceDuration: number
        }> = []

        if (appointmentIds.length > 0) {
            appointmentServicesList = await db
                .select({
                    appointmentId: appointmentServices.appointmentId,
                    serviceId: appointmentServices.serviceId,
                    serviceName: services.name,
                    servicePrice: appointmentServices.priceAtBooking,
                    serviceDuration: services.duration,
                })
                .from(appointmentServices)
                .innerJoin(services, eq(appointmentServices.serviceId, services.id))
                .where(inArray(appointmentServices.appointmentId, appointmentIds))
        }

        // Organize services by appointment
        const appointmentsWithServices = customerAppointments.map(apt => ({
            ...apt,
            services: appointmentServicesList
                .filter(s => s.appointmentId === apt.appointmentId)
                .map(s => ({
                    id: s.serviceId,
                    name: s.serviceName,
                    price: s.servicePrice,
                    duration: s.serviceDuration,
                })),
        }))

        // Calculate total services and total amount by service
        const servicesSummary = appointmentServicesList.reduce((acc, item) => {
            const existing = acc.find(s => s.serviceId === item.serviceId)
            if (existing) {
                existing.count += 1
                existing.totalAmount = String(
                    parseFloat(existing.totalAmount) + parseFloat(item.servicePrice)
                )
            } else {
                acc.push({
                    serviceId: item.serviceId,
                    serviceName: item.serviceName,
                    price: item.servicePrice,
                    count: 1,
                    totalAmount: item.servicePrice,
                })
            }
            return acc
        }, [] as Array<{
            serviceId: number
            serviceName: string
            price: string
            count: number
            totalAmount: string
        }>)

        const response = {
            data: {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email || '',
                    phone: customer.phone,
                    notes: customer.notes || '',
                    createdAt: customer.createdAt,
                },
                appointments: appointmentsWithServices,
                servicesSummary: servicesSummary,
                statistics: {
                    totalAppointments: customerAppointments.length,
                    totalServices: appointmentServicesList.length,
                    totalAmount: customer.totalAmount,
                    lastAppointmentDate: customer.lastAppointmentDate,
                },
            },
        }

        console.log('[API] Returning customer details:', {
            customerId,
            appointmentCount: customerAppointments.length,
            serviceCount: appointmentServicesList.length,
        })

        return NextResponse.json(
            { success: true, data: response.data },
            { status: 200 }
        )
    } catch (error) {
        console.error('[API] ERROR in customer details:', error)
        const errorMsg = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            fail('FETCH_ERROR', errorMsg),
            { status: 500 }
        )
    }
}
