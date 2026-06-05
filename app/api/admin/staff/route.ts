import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, staffBaseSalaries, users } from "@/db/schema";
import { eq, asc, desc, or, count, ilike, and } from "drizzle-orm";

// --- GET: Lấy danh sách nhân viên với pagination, search, sort, filter ---
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '12', 10)))
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'createdAt'
    const statusFilter = searchParams.get('status') || ''

    console.log('[API] /api/admin/staff GET:', { page, limit, search, sort, statusFilter })

    const filters: any[] = []

    if (statusFilter === 'active' || statusFilter === 'inactive') {
      filters.push(eq(staff.status, statusFilter))
    }

    if (search.trim()) {
      const keyword = `%${search.trim()}%`
      filters.push(
        or(
          ilike(users.name, keyword),
          ilike(users.email, keyword),
          ilike(users.phone, keyword)
        )
      )
    }

    let whereClause: any
    if (filters.length === 1) {
      whereClause = filters[0]
    } else if (filters.length > 1) {
      whereClause = and(...filters)
    }

    let orderByExpr = desc(staff.createdAt)
    if (sort === 'name') orderByExpr = asc(users.name)
    else if (sort === 'joinDate') orderByExpr = desc(staff.joinDate)
    else if (sort === 'rating') orderByExpr = desc(staff.rating)

    const countQueryBase = db
      .select({ value: count() })
      .from(staff)
      .innerJoin(users, eq(staff.userId, users.id))
    const countResult = await (whereClause
      ? countQueryBase.where(whereClause)
      : countQueryBase)
    const total = Number(countResult[0]?.value ?? 0)

    const offset = (page - 1) * limit
    const dataQueryBase = db
      .select({
        id: staff.id,
        userId: staff.userId,
        position: staff.position,
        experience: staff.experience,
        specialties: staff.specialties,
        status: staff.status,
        avatarUrl: staff.avatarUrl,
        joinDate: staff.joinDate,
        rating: staff.rating,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(staff)
      .innerJoin(users, eq(staff.userId, users.id))
    const dataQuery = whereClause
      ? dataQueryBase.where(whereClause)
      : dataQueryBase

    const rows = await dataQuery
      .orderBy(orderByExpr)
      .limit(limit)
      .offset(offset)

    console.log('[API] Got', rows.length, 'staff records')

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      {
        success: true,
        data: rows.map((row: any) => ({
          id: row.id,
          name: row.userName,
          email: row.userEmail ?? '',
          phone: row.userPhone ?? '',
          position: row.position ?? '',
          experience: row.experience ?? '',
          specialties: row.specialties ?? [],
          status: row.status,
          avatarUrl: row.avatarUrl ?? '',
          joinDate: row.joinDate,
          rating: row.rating ? Number(row.rating) : 0,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          userId: row.userId,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] ERROR fetching staff:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: errorMsg } },
      { status: 500 }
    )
  }
}

// --- POST: Tạo nhân viên mới ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ===== VALIDATION =====

    // 0. Validate Name (required)
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Tên nhân viên là bắt buộc' } },
        { status: 400 }
      )
    }
    if (body.name.trim().length > 255) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Tên nhân viên không được vượt quá 255 ký tự' } },
        { status: 400 }
      )
    }

    // 1. Validate Phone (required, string, 10-11 digits)
    if (!body.phone || typeof body.phone !== 'string' || !body.phone.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Số điện thoại là bắt buộc' } },
        { status: 400 }
      )
    }
    const phoneDigits = body.phone.replace(/\D/g, '')
    if (!/^\d{10,11}$/.test(phoneDigits)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Số điện thoại không hợp lệ (10-11 chữ số)' } },
        { status: 400 }
      )
    }

    // 2. Validate Email (required, must be valid string)
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Email là bắt buộc' } },
        { status: 400 }
      )
    }
    if (body.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Email không hợp lệ' } },
          { status: 400 }
        )
      }
      if (body.email.trim().length > 255) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Email không được vượt quá 255 ký tự' } },
          { status: 400 }
        )
      }
    }

    // 3. Validate Position (optional, must be string if provided)
    if (body.position) {
      if (typeof body.position !== 'string') {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Chức vụ phải là một chuỗi' } },
          { status: 400 }
        )
      }
      if (body.position.trim().length > 100) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Chức vụ không được vượt quá 100 ký tự' } },
          { status: 400 }
        )
      }
    }

    // 4. Validate Experience (optional, must be string if provided)
    if (body.experience) {
      if (typeof body.experience !== 'string') {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Kinh nghiệm phải là một chuỗi' } },
          { status: 400 }
        )
      }
      if (body.experience.trim().length > 50) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Kinh nghiệm không được vượt quá 50 ký tự' } },
          { status: 400 }
        )
      }
    }

    // 5. Validate BaseSalary (optional, must be a valid positive number if provided)
    if (body.baseSalary !== undefined && body.baseSalary !== null) {
      const salaryNum = Number(body.baseSalary)
      if (isNaN(salaryNum)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Lương cứng phải là một số' } },
          { status: 400 }
        )
      }
      if (salaryNum < 0) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Lương cứng không được là số âm' } },
          { status: 400 }
        )
      }
      if (!Number.isInteger(salaryNum)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Lương cứng phải là số nguyên' } },
          { status: 400 }
        )
      }
      if (salaryNum > 999999999) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Lương cứng quá lớn' } },
          { status: 400 }
        )
      }
    }

    // 6. Validate Specialties (optional, must be array if provided)
    if (body.specialties !== undefined && body.specialties !== null) {
      if (!Array.isArray(body.specialties)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Chuyên môn phải là một mảng' } },
          { status: 400 }
        )
      }
      for (const specialty of body.specialties) {
        if (typeof specialty !== 'string') {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_INPUT', message: 'Mỗi chuyên môn phải là một chuỗi' } },
            { status: 400 }
          )
        }
      }
      const specialtiesStr = body.specialties.join(', ')
      if (specialtiesStr.length > 255) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Chuyên môn không được vượt quá 255 ký tự' } },
          { status: 400 }
        )
      }
    }

    // 7. Validate avatarUrl (optional, must be string if provided)
    if (body.avatarUrl && typeof body.avatarUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Avatar URL phải là một chuỗi' } },
        { status: 400 }
      )
    }

    const normalizedName = body.name.trim()
    const normalizedEmail = body.email.trim().toLowerCase()
    const normalizedPhone = phoneDigits

    const result = await db.transaction(async (tx: any) => {
      // 1. Create user first
      const userResult = await tx.insert(users).values({
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        role: 'staff',
      }).returning({ id: users.id })

      const userId = userResult[0]?.id
      if (!userId) {
        throw new Error('Failed to create user')
      }

      console.log('[API] Created user:', normalizedEmail, 'with ID:', userId)

      // 2. Create staff record linked to user
      const staffResult = await tx.insert(staff).values({
        userId: userId,
        position: body.position || null,
        specialties: body.specialties || [],
        experience: body.experience || null,
        status: 'active',
        avatarUrl: body.avatarUrl || null,
        joinDate: new Date().toISOString().split('T')[0], // Format as date string
        rating: '0',
      }).returning({ id: staff.id })

      const staffId = staffResult[0]?.id
      if (!staffId) {
        throw new Error('Failed to create staff')
      }

      console.log('[API] Created staff with ID:', staffId, 'linked to user:', userId)

      // 3. Create base salary record if provided
      if (body.baseSalary !== undefined && body.baseSalary !== null && staffId) {
        await tx.insert(staffBaseSalaries).values({
          staffId: staffId,
          baseSalary: String(body.baseSalary),
          notes: null,
        })
      }

      return { staffId, userId, email: normalizedEmail, phone: normalizedPhone, name: normalizedName }
    })

    console.log('[API] Staff creation transaction completed:', result)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.staffId,
          userId: result.userId,
          name: result.name,
          email: result.email,
          phone: result.phone,
          position: body.position || '',
          experience: body.experience || '',
          avatarUrl: body.avatarUrl || '',
          specialties: body.specialties || [],
          baseSalary: body.baseSalary || null,
          status: 'active',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API] ERROR creating staff:', error)
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Email hoặc số điện thoại đã tồn tại' } },
        { status: 409 }
      )
    }
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_ERROR', message: errorMsg } },
      { status: 500 }
    )
  }
}