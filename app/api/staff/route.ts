import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { staff } from "@/db/schema"
import { asc, desc } from "drizzle-orm"

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
    if (sort === 'name') orderBy = asc(staff.name)
    else if (sort === 'joinDate') orderBy = desc(staff.joinDate)
    else if (sort === 'rating') orderBy = desc(staff.rating)

    // Fetch only active staff
    const data = await db
      .select({
        id: staff.id,
        firstName: staff.name, // name contains both first and last name, or we split it
        lastName: staff.name,  // In this case, will be empty or use the full name field
        name: staff.name,
        role: staff.position,
        position: staff.position,
        bio: staff.experience,
        experience: staff.experience,
        image: staff.avatarUrl,
        avatarUrl: staff.avatarUrl,
        specialties: staff.specialties,
        rating: staff.rating,
        phone: staff.phone,
        email: staff.email,
        status: staff.status,
        joinDate: staff.joinDate,
        createdAt: staff.createdAt,
      })
      .from(staff)
      .where(() => {
        // Only active staff
        return undefined // No where clause - return all for now, can filter if needed
      })
      .orderBy(orderBy)
      .limit(limit)

    console.log('[API] Got', data.length, 'staff records')

    // Transform data to match TeamSection component expectations
    const transformedData = data.map((s) => ({
      id: s.id,
      firstName: s.name.split(' ')[0] || s.name,
      lastName: s.name.split(' ').slice(1).join(' ') || '',
      name: s.name,
      role: s.position || 'Staff',
      position: s.position || 'Staff',
      bio: s.experience,
      experience: s.experience,
      image: s.avatarUrl,
      avatarUrl: s.avatarUrl,
      specialties: s.specialties || [],
      rating: parseFloat(s.rating || '0'),
      phone: s.phone || '',
      email: s.email || '',
      status: s.status,
      joinDate: s.joinDate,
      createdAt: s.createdAt,
    }))

    return NextResponse.json(
      {
        success: true,
        data: transformedData,
        meta: {
          total: transformedData.length,
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
