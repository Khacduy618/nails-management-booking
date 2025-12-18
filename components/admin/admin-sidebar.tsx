"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Scissors, Calendar, Users, BarChart3, Settings, Menu, DollarSign } from "lucide-react"
import { useSession } from "next-auth/react"

type NavItem = {
  name: string
  href: string
  icon: ComponentType<any>
  roles?: Array<"admin" | "staff">
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { name: "Quản lý danh mục", href: "/admin/categories", icon: Menu, roles: ["admin"] },
  { name: "Quản lý dịch vụ", href: "/admin/services", icon: Scissors, roles: ["admin"] },
  { name: "Quản lý đặt lịch", href: "/admin/appointments", icon: Calendar, roles: ["admin", "staff"] },
  { name: "Quản lý khách hàng", href: "/admin/customers", icon: Users, roles: ["admin"] },
  { name: "Quản lý nhân viên", href: "/admin/staff", icon: Users, roles: ["admin"] },
  { name: "Quản lý lương", href: "/admin/payroll", icon: DollarSign, roles: ["admin"] },
  { name: "Thống kê doanh thu", href: "/admin/revenue", icon: BarChart3, roles: ["admin"] },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings, roles: ["admin"] },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? "admin"

  const visibleNavigation = navigation.filter((item) => !item.roles || item.roles.includes(role as "admin" | "staff"))

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border relative">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">Serenity Admin</h1>
        <p className="text-xs text-muted-foreground capitalize">Quyền: {role === "staff" ? "Nhân viên" : "Quản trị"}</p>
      </div>

      <nav className="px-4 space-y-2">
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
