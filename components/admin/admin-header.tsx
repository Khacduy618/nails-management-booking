"use client"

import { Bell, User, LogOut, Loader2, Menu, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { AdminSidebar, adminNavigation } from "@/components/admin/admin-sidebar"
import { usePathname } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

const PAGE_TITLE_MAP: Record<string, string> = {
  "/admin": "Bảng điều khiển",
  "/admin/categories": "Danh mục dịch vụ",
  "/admin/services": "Dịch vụ",
  "/admin/appointments": "Lịch hẹn",
  "/admin/schedule": "Lịch cửa hàng",
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
        setUnreadCount(newList.filter(n => !n.isRead).length)
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
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
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
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
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
    <header className="flex h-16 items-center justify-between border-b border-neutral-200/40 bg-white/65 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-neutral-100/60"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 sm:max-w-none border-none">
            <span className="sr-only"><SheetTitle>Menu điều hướng</SheetTitle></span>
            <AdminSidebar variant="mobile" onNavigate={() => setIsMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <h2 className="text-base font-extrabold text-neutral-800 tracking-tight sm:text-lg">{headerTitle}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Chuông thông báo dạng Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" title="Thông báo" className="relative hover:bg-neutral-100/60 rounded-xl transition-all active:scale-95">
              <Bell className="h-5 w-5 text-neutral-650" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-505 ring-2 ring-white animate-pulse animate-duration-1000" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-2xl border border-neutral-200/50 bg-white/95 backdrop-blur-md shadow-xl overflow-hidden" align="end">
            <div className="flex items-center justify-between border-b border-neutral-200/40 px-4 py-3 bg-neutral-50/50">
              <h3 className="font-bold text-sm text-neutral-800">Thông báo ({unreadCount})</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" className="text-xs h-auto py-1 px-2 text-primary hover:bg-neutral-100/60 rounded-lg" onClick={handleMarkAllAsRead}>
                  Đọc tất cả
                </Button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Không có thông báo mới nào
                </div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className={`p-4 text-xs hover:bg-neutral-50/50 transition-colors flex justify-between items-start gap-2.5 ${!item.isRead ? 'bg-primary/5' : ''}`}>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-bold text-neutral-800 leading-tight flex items-center gap-1.5">
                        {!item.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                        )}
                        {item.title}
                      </p>
                      <p className="text-neutral-500 leading-relaxed">{item.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} - {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    {!item.isRead ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-neutral-400 hover:text-primary hover:bg-neutral-100 rounded-md shrink-0"
                        onClick={() => handleMarkAsRead(item.id)}
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <div className="w-6 h-6 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
 
        <div className="hidden items-center gap-2.5 rounded-2xl border border-neutral-200/60 bg-white/80 px-3 py-1 sm:flex shadow-[0_2px_8px_-2px_rgba(15,15,15,0.05)]">
          <div className="rounded-xl bg-neutral-100 p-1.5 text-neutral-600">
            <User className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="text-xs leading-tight min-w-0">
            <p className="font-bold text-neutral-800 truncate">{userDisplay}</p>
            <p className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider mt-0.5">{roleLabel}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-neutral-100/60 rounded-xl transition-all active:scale-95 text-neutral-600"
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
