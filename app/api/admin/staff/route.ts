import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, staffBaseSalaries } from "@/db/schema";
import { eq, asc, desc, like, or, count } from "drizzle-orm";

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

    // Build WHERE clause
    const conditions = []

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      conditions.push(
        or(
          like(staff.name, searchTerm),
          like(staff.phone, searchTerm),
          like(staff.email, searchTerm)
        )
      )
    }

    if (statusFilter === 'active' || statusFilter === 'inactive') {
      conditions.push(eq(staff.status, statusFilter))
    }

    let whereConditions: any = conditions.length > 0 ? conditions[0] : undefined

    // Build ORDER BY
    let orderBy: any = desc(staff.createdAt)
    if (sort === 'name') orderBy = asc(staff.name)
    else if (sort === 'joinDate') orderBy = desc(staff.joinDate)
    else if (sort === 'rating') orderBy = desc(staff.rating)

    // Count
    let countQuery = db.select({ count: count() }).from(staff)
    if (whereConditions) {
      countQuery = countQuery.where(whereConditions) as any
    }
    const countResult = await countQuery
    const total = countResult[0]?.count || 0

    // Fetch data
    const offset = (page - 1) * limit
    let dataQuery = db.select().from(staff).orderBy(orderBy)
    if (whereConditions) {
      dataQuery = dataQuery.where(whereConditions) as any
    }

    const data = await dataQuery.limit(limit).offset(offset)

    console.log('[API] Got', data.length, 'staff records')

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      {
        success: true,
        data: data.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email || '',
          phone: s.phone || '',
          position: s.position || '',
          experience: s.experience || '',
          specialties: s.specialties || [],
          status: s.status,
          avatarUrl: s.avatarUrl || '',
          joinDate: s.joinDate,
          rating: parseFloat(s.rating || '0'),
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
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

    // 1. Validate Name (required, string, 2-255 chars)
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Tên nhân viên là bắt buộc' } },
        { status: 400 }
      )
    }
    if (body.name.trim().length < 2 || body.name.trim().length > 255) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Tên nhân viên phải từ 2-255 ký tự' } },
        { status: 400 }
      )
    }

    // 2. Validate Phone (required, string, 10-11 digits)
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

    // 3. Validate Email (optional but must be valid string if provided)
    if (body.email) {
      if (typeof body.email !== 'string') {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: 'Email phải là một chuỗi' } },
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
    }

    // 4. Validate Position (optional, must be string if provided)
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

    // 5. Validate Experience (optional, must be string if provided)
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

    // 6. Validate BaseSalary (optional, must be a valid positive number if provided)
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

    // 7. Validate Specialties (optional, must be array if provided)
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

    // 8. Validate avatarUrl (optional, must be string if provided)
    if (body.avatarUrl && typeof body.avatarUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Avatar URL phải là một chuỗi' } },
        { status: 400 }
      )
    }

    const newStaff = await db.transaction(async (tx) => {
      const staffResult = await tx.insert(staff).values({
        name: body.name,
        email: body.email || null,
        phone: body.phone,
        position: body.position || null,
        specialties: body.specialties || [],
        experience: body.experience || null,
        status: 'active',
        avatarUrl: body.avatarUrl || null,
        joinDate: new Date(),
        rating: '0',
      })

      // Get the staff ID from the insert result
      const staffId = Array.isArray(staffResult) && staffResult.length > 0
        ? (staffResult as any[])[0].id
        : (staffResult as any).insertId

      console.log('[API] Staff insert result:', { staffResult, staffId })

      // Create base salary record if provided
      if (body.baseSalary && staffId) {
        await tx.insert(staffBaseSalaries).values({
          staffId: staffId,
          baseSalary: String(body.baseSalary),
          notes: null,
        })
      }

      return staffId
    })

    console.log('[API] Created staff:', body.name, 'with ID:', newStaff)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newStaff,
          name: body.name,
          email: body.email || '',
          phone: body.phone,
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
    if (error.code === 'ER_DUP_ENTRY') {
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