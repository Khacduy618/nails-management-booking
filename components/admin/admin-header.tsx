"use client"

import { Bell, User, LogOut, Loader2, Menu, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdminSidebar, adminNavigation } from "@/components/admin/admin-sidebar"
import { usePathname } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

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

interface AdminNotification {
  id: number
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function AdminHeader() {
  const { data: session } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const pathname = usePathname()

  // State thông báo
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationsRef = useRef<AdminNotification[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync ref để logic polling luôn so sánh với state mới nhất
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  const userDisplay = isMounted ? (session?.user?.name || session?.user?.email || "Người dùng") : "Người dùng"
  const roleLabel = isMounted ? (session?.user?.role === "staff" ? "Nhân viên" : "Quản trị") : "Quản trị"

  // Fetch notifications API
  const fetchNotifications = async (showToastOnNew = false) => {
    try {
      const res = await fetch("/api/admin/notifications")
      if (!res.ok) return
      const result = await res.json()
      if (result.success) {
        const newList = result.data as AdminNotification[]
        const oldList = notificationsRef.current

        // Nếu có thông báo mới (có ID chưa có trong danh sách cũ)
        if (showToastOnNew) {
          const oldIds = new Set(oldList.map(n => n.id))
          const newItems = newList.filter(n => !oldIds.has(n.id))

          newItems.forEach(item => {
            // Phát ra Toast báo động trên màn hình quản trị
            toast.warning(item.title, {
              description: item.message,
              duration: 10000, // 10 giây hiển thị để admin dễ nhận biết
            })
          })
        }

        setNotifications(newList)
        setUnreadCount(newList.length)
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    }
  }

  // Khởi động vòng lặp polling mỗi 10 giây
  useEffect(() => {
    if (isMounted) {
      fetchNotifications()
      const interval = setInterval(() => {
        fetchNotifications(true)
      }, 10000) // 10s
      return () => clearInterval(interval)
    }
  }, [isMounted])

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      if (res.ok) {
        setNotifications([])
        setUnreadCount(0)
        toast.success("Đã đánh dấu đọc tất cả thông báo")
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

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
        {/* Chuông thông báo dạng Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" title="Thông báo" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b px-4 py-2.5 bg-muted/30">
              <h3 className="font-semibold text-sm text-foreground">Thông báo ({unreadCount})</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" className="text-xs h-auto p-1 text-primary hover:bg-transparent" onClick={handleMarkAllAsRead}>
                  Đọc tất cả
                </Button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Không có thông báo mới nào
                </div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className="p-3.5 text-xs hover:bg-muted/30 transition-colors flex justify-between items-start gap-2.5">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="text-muted-foreground leading-relaxed">{item.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} - {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0 hover:bg-muted"
                      onClick={() => handleMarkAsRead(item.id)}
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

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
