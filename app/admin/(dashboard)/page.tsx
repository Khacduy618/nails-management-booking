import { StatisticsDashboard } from "@/components/admin/statistics-dashboard"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Dashboard – K.Tay Nails Admin",
  description: "Tổng quan dữ liệu kinh doanh, doanh thu, lịch hẹn và hiệu suất nhân viên",
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (session?.user?.role === "staff") {
    redirect("/admin/appointments")
  }

  return <StatisticsDashboard />
}
