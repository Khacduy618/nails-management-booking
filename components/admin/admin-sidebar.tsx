"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Scissors, Calendar, Users, BarChart3, Settings, Menu, DollarSign, PieChart } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

type NavItem = {
  name: string
  href: string
  icon: ComponentType<any>
  roles?: Array<"admin" | "staff">
}

export const adminNavigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { name: "Danh mục", href: "/admin/categories", icon: Menu, roles: ["admin"] },
  { name: "Dịch vụ", href: "/admin/services", icon: Scissors, roles: ["admin"] },
  { name: "Lịch hẹn", href: "/admin/appointments", icon: Calendar, roles: ["admin", "staff"] },
  { name: "Khách hàng", href: "/admin/customers", icon: Users, roles: ["admin"] },
  { name: "Nhân viên", href: "/admin/staff", icon: Users, roles: ["admin"] },
  { name: "Lương", href: "/admin/payroll", icon: DollarSign, roles: ["admin"] },
  { name: "Thống kê doanh thu", href: "/admin/revenue", icon: BarChart3, roles: ["admin"] },
  // { name: "Cài đặt", href: "/admin/settings", icon: Settings, roles: ["admin"] },
]

type AdminSidebarProps = {
  className?: string
  onNavigate?: () => void
  variant?: "desktop" | "mobile"
}

export function AdminSidebar({ className, onNavigate, variant = "desktop" }: AdminSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const role = isMounted ? (session?.user?.role ?? "admin") : "admin"

  const visibleNavigation = adminNavigation.filter((item) => !item.roles || item.roles.includes(role as "admin" | "staff"))

  return (
    <div
      className={cn(
        "bg-white/70 backdrop-blur-md border-r border-neutral-200/50 relative flex h-full w-64 flex-col",
        variant === "mobile" && "w-full border-none",
        className,
      )}
    >
      {/* Branded Brand Area */}
      <div className={cn("p-6 border-b border-neutral-200/40 mb-4", variant === "mobile" && "pb-4")}>
        <Link 
          href="/admin" 
          className="group/logo pointer-events-auto relative inline-flex shrink-0 items-center gap-2.5 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/80 px-2.5 py-1.5 pr-4 shadow-[0_4px_12px_-4px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 hover:border-neutral-300 hover:bg-white hover:shadow-[0_8px_20px_-6px_rgba(15,15,15,0.15),0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] w-full"
        >
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-neutral-900 ring-1 ring-black/10 transition-[transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/logo:scale-[1.06] group-hover/logo:-rotate-[7deg]">
            <img src="/fav.png" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/logo:scale-110" alt="K" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-sans font-extrabold text-neutral-800 text-sm tracking-tight transition-colors duration-500 group-hover/logo:text-neutral-950 truncate">
              K.Tay Nails
            </span>
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
              {role === "staff" ? "Nhân viên" : "Quản trị viên"}
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4 pb-6">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:brightness-105 translate-x-1"
                  : "text-neutral-600 hover:bg-neutral-100/60 hover:text-neutral-900",
              )}
              onClick={onNavigate}
            >
              <item.icon className={cn("h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary-foreground" : "text-neutral-500 group-hover:text-neutral-700")} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
