import { db } from '@/db'
import { customers } from '@/db/schema'
import { desc, asc, like, or, count } from 'drizzle-orm'
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

        let orderBy: any = desc(customers.createdAt)
        if (sort === 'serviceCount') orderBy = desc(customers.serviceCount)
        else if (sort === 'totalAmount') orderBy = desc(customers.totalAmount)
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

        let dataQuery = db.select().from(customers).orderBy(orderBy)
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
        return NextResponse.json(
            fail('FETCH_ERROR', errorMsg),
            { status: 500 }
        )
    }
}
