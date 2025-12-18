import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const STAFF_ALLOWED_PATHS = [
  "/admin/appointments",
  "/admin/schedule",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow login page without token
  if (pathname === "/login") {
    return NextResponse.next()
  }

  // For API routes, return JSON error instead of redirect
  if (pathname.startsWith("/api/admin/")) {
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    // Basic CSRF protection via Origin/Referer for state-changing requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      const origin = req.headers.get('origin') || ''
      const referer = req.headers.get('referer') || ''
      const expected = req.nextUrl.origin
      const originOk = origin ? origin === expected : true
      const refererOk = referer ? referer.startsWith(expected) : true
      if (!originOk || !refererOk) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Invalid origin" } },
          { status: 403 }
        )
      }
    }

    // Check role for API
    if (token.role === "staff") {
      const isAllowed = [
        "/api/admin/appointments",
        "/api/admin/staff",
        "/api/admin/schedule",
      ].some(path => pathname === path || pathname.startsWith(path + "/"))

      if (!isAllowed) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Staff cannot access this endpoint" } },
          { status: 403 }
        )
      }
    }

    return NextResponse.next()
  }

  // For UI routes, check authentication and redirect
  const token = await getToken({
    req: req as any,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Redirect to appropriate dashboard based on role
  if (pathname === "/admin" || pathname === "/admin/") {
    if (token.role === "staff") {
      return NextResponse.redirect(new URL("/admin/appointments", req.url))
    }
    // Admin users can access /admin (dashboard)
    return NextResponse.next()
  }

  // Staff users can only access specific paths
  if (token.role === "staff") {
    const isAllowed = STAFF_ALLOWED_PATHS.some((allowedPath) =>
      pathname === allowedPath || pathname.startsWith(allowedPath + "/")
    )

    if (!isAllowed) {
      return NextResponse.redirect(new URL("/admin/appointments", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
