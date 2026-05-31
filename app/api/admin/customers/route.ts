import { db } from '@/db'
import { customers, appointments, appointmentServices } from '@/db/schema'
import { desc, asc, like, or, count, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { ok, fail } from '@/lib/api-response'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
    try {
        console.log('[API] /api/admin/customers called')

        const searchParams = request.nextUrl.searchParams
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '12', 10)))
        const search = searchParams.get('search') || ''
        const sort = searchParams.get('sort') || 'createdAt'

        console.log('[API] Params:', { page, limit, search, sort })

        const totalAmountSql = sql<string>`COALESCE((
            SELECT SUM(price_at_booking)::numeric 
            FROM ${appointments} 
            WHERE ${appointments.customerId} = "customers"."id" AND ${appointments.status} != 'cancelled'
        ), '0.00')`

        const serviceCountSql = sql<number>`COALESCE((
            SELECT COUNT(asv.id)::int
            FROM ${appointmentServices} asv
            JOIN ${appointments} apt ON asv.appointment_id = apt.id
            WHERE apt.customer_id = "customers"."id" AND apt.status != 'cancelled'
        ), 0)`

        let orderBy: any = desc(customers.createdAt)
        if (sort === 'serviceCount') orderBy = desc(serviceCountSql)
        else if (sort === 'totalAmount') orderBy = desc(totalAmountSql)
        else if (sort === 'name') orderBy = asc(customers.name)

        // Build WHERE clause - search in name, phone, or email
        let whereConditions: any = undefined
        if (search && search.trim()) {
            const searchTerm = `%${search.trim()}%`
            whereConditions = or(
                like(customers.name, searchTerm),
                like(customers.phone, searchTerm),
                like(customers.email, searchTerm)
            )
        }

        console.log('[API] WHERE condition:', whereConditions ? 'set' : 'undefined')

        // Count query
        let countQuery = db.select({ count: count() }).from(customers)
        if (whereConditions) {
            countQuery = countQuery.where(whereConditions) as any
        }

        const countResult = await countQuery

        const total = countResult[0]?.count || 0
        console.log('[API] Total:', total)

        // Data query
        const offset = (page - 1) * limit
        console.log('[API] Fetching with offset:', offset, 'limit:', limit)

        let dataQuery = db
            .select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                notes: customers.notes,
                lastAppointmentDate: customers.lastAppointmentDate,
                createdAt: customers.createdAt,
                updatedAt: customers.updatedAt,
                totalAmount: totalAmountSql,
                serviceCount: serviceCountSql,
            })
            .from(customers)
            .orderBy(orderBy)
        if (whereConditions) {
            dataQuery = dataQuery.where(whereConditions) as any
        }

        const data = await dataQuery.limit(limit).offset(offset)

        console.log('[API] Got', data.length, 'records')

        const totalPages = Math.ceil(total / limit)

        const response = {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        }

        console.log('[API] About to return response:', { hasData: !!response.data, dataLength: response.data.length, meta: response.meta })

        const result = ok(response)
        console.log('[API] ok() returned:', result)

        return result
    } catch (error) {
        console.error('[API] ERROR:', error)
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error('[API] Stack:', error instanceof Error ? error.stack : '')
        return fail('FETCH_ERROR', errorMsg, 500)
    }
}
