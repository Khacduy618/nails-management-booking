import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { staff, users } from "@/db/schema"
import { asc, desc, eq } from "drizzle-orm"

/**
 * GET /api/staff
 * Public endpoint to fetch staff members for public-facing pages (homepage, services page, etc.)
 * Returns basic staff information without admin details
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '12', 10)))
    const sort = searchParams.get('sort') || 'createdAt'

    console.log('[API] /api/staff GET:', { limit, sort })

    // Build ORDER BY
    let orderBy: any = desc(staff.createdAt)
    if (sort === 'name') orderBy = asc(users.email)
    else if (sort === 'joinDate') orderBy = desc(staff.joinDate)
    else if (sort === 'rating') orderBy = desc(staff.rating)

    // Fetch only active staff with user relationship using query builder
    const staffList = await db.query.staff.findMany({
      with: {
        user: true
      },
      orderBy: orderBy,
      limit: limit,
    })

    // Transform response to match expected format
    const transformed = staffList.map((s: typeof staffList[number]) => {
      const email = s.user?.email || 'unknown@example.com'
      const phone = s.user?.phone || ''
      const namePrefix = email.split('@')[0]

      return {
        id: s.id,
        firstName: namePrefix,
        lastName: '',
        name: namePrefix,
        role: s.position || 'Staff',
        position: s.position || 'Staff',
        bio: s.experience,
        experience: s.experience,
        image: s.avatarUrl,
        avatarUrl: s.avatarUrl,
        specialties: s.specialties || [],
        rating: s.rating ? parseFloat(String(s.rating)) : 0,
        phone: phone,
        email: email,
        status: s.status,
        joinDate: s.joinDate,
        createdAt: s.createdAt,
      }
    })

    console.log('[API] Got', transformed.length, 'staff records')

    return NextResponse.json(
      {
        success: true,
        data: transformed,
        meta: {
          total: transformed.length,
          limit,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] ERROR fetching staff:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FETCH_ERROR', message: errorMsg },
        data: [],
      },
      { status: 500 }
    )
  }
}
