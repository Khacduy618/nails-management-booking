"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Scissors, Calendar, Users, BarChart3, Settings, Menu, DollarSign, PieChart } from "lucide-react"
import { useSession } from "next-auth/react"

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
  { name: "Thống kê & Phân tích", href: "/admin/statistics", icon: PieChart, roles: ["admin"] },
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
  const role = session?.user?.role ?? "admin"

  const visibleNavigation = adminNavigation.filter((item) => !item.roles || item.roles.includes(role as "admin" | "staff"))

  return (
    <div
      className={cn(
        "bg-sidebar border-sidebar-border relative flex h-full w-64 flex-col border-r",
        variant === "mobile" && "w-full border-none",
        className,
      )}
    >
      <div className={cn("p-6", variant === "mobile" && "pb-4")}
      >
        <h1 className="text-xl font-bold text-sidebar-foreground">Serenity Admin</h1>
        <p className="text-xs text-muted-foreground capitalize">
          Quyền: {role === "staff" ? "Nhân viên" : "Quản trị"}
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-4 pb-6">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              onClick={onNavigate}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
