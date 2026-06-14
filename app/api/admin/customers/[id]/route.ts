import { withEncryption } from "@/lib/api-middleware";
import { db } from '@/db'
import { customers, appointments, appointmentServices, services } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { ok, fail } from '@/lib/api-response'
import { decrypt } from '@/lib/crypto'

async function _GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const customerId = parseInt(id, 10)

        if (isNaN(customerId)) {
            return fail('INVALID_INPUT', 'Invalid customer ID', 400)
        }

        console.log('[API] /api/admin/customers/[id] called with id:', customerId)

        // Lấy thông tin khách hàng
        const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, customerId))
            .then((result: any[]) => result[0])

        if (!customer) {
            return fail('NOT_FOUND', 'Customer not found', 404)
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
        const appointmentIds = customerAppointments.map((apt: any) => apt.appointmentId)

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
        const appointmentsWithServices = customerAppointments.map((apt: any) => ({
            ...apt,
            services: appointmentServicesList
                .filter((s: any) => s.appointmentId === apt.appointmentId)
                .map((s: any) => ({
                    id: s.serviceId,
                    name: s.serviceName,
                    price: s.servicePrice,
                    duration: s.serviceDuration,
                })),
        }))

        // Calculate total services and total amount by service
        const servicesSummary = appointmentServicesList.reduce((acc: any[], item: any) => {
            const existing = acc.find((s: any) => s.serviceId === item.serviceId)
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
        }, [] as any[])

        const activeAppointments = customerAppointments.filter((apt: any) => apt.status !== 'cancelled')
        const activeAppointmentIds = activeAppointments.map((apt: any) => apt.appointmentId)
        const activeServicesList = appointmentServicesList.filter((s: any) => activeAppointmentIds.includes(s.appointmentId))

        const dynamicTotalAmount = activeAppointments
            .reduce((sum: number, apt: any) => sum + parseFloat(apt.totalPrice), 0)
            .toFixed(2)

        const response = {
            data: {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    notes: customer.notes,
                    createdAt: customer.createdAt,
                },
                appointments: appointmentsWithServices,
                servicesSummary: servicesSummary,
                statistics: {
                    totalAppointments: customerAppointments.length,
                    totalServices: activeServicesList.length,
                    totalAmount: dynamicTotalAmount,
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
        return fail('FETCH_ERROR', errorMsg, 500)
    }
}


// Wrapped exports for encryption/decryption
export const GET = withEncryption(_GET);
