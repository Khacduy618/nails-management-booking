"use client"

import { Bell, User, LogOut, Loader2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdminSidebar, adminNavigation } from "@/components/admin/admin-sidebar"
import { usePathname } from "next/navigation"

const PAGE_TITLE_MAP: Record<string, string> = {
  "/admin": "Bảng điều khiển",
  "/admin/categories": "Danh mục dịch vụ",
  "/admin/services": "Dịch vụ",
  "/admin/appointments": "Lịch hẹn",
  "/admin/customers": "Khách hàng",
  "/admin/staff": "Nhân viên",
  "/admin/payroll": "Bảng lương",
  "/admin/revenue": "Thống kê doanh thu",
  "/admin/settings": "Cài đặt",
}

export function AdminHeader() {
  const { data: session } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const userDisplay = isMounted ? (session?.user?.name || session?.user?.email || "Người dùng") : "Người dùng"
  const roleLabel = isMounted ? (session?.user?.role === "staff" ? "Nhân viên" : "Quản trị") : "Quản trị"

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/login", redirect: true })
  }

  const normalizedPath = (pathname?.split("?")[0] || "/admin").replace(/\/$/, "") || "/admin"
  const exactMatch = PAGE_TITLE_MAP[normalizedPath]
  const partialMatch = Object.keys(PAGE_TITLE_MAP)
    .filter((key) => normalizedPath.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0]
  const matchFromMap = exactMatch ? normalizedPath : partialMatch
  const navMatch = adminNavigation.find((item) => {
    if (item.href === "/admin") {
      return normalizedPath === "/admin"
    }
    return normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`)
  })
  const headerTitle = matchFromMap ? PAGE_TITLE_MAP[matchFromMap] : navMatch?.name || "Bảng điều khiển"

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 sm:max-w-none">
            <AdminSidebar variant="mobile" onNavigate={() => setIsMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <h2 className="text-base font-semibold text-foreground sm:text-lg">{headerTitle}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" title="Thông báo">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="hidden items-center gap-3 rounded-full border px-3 py-1 sm:flex">
          <div className="rounded-full bg-muted p-2 text-muted-foreground">
            <User className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="text-sm leading-tight">
            <p className="font-medium">{userDisplay}</p>
            <p className="text-muted-foreground text-xs capitalize">{roleLabel}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title="Đăng xuất"
        >
          {isSigningOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  )
}
