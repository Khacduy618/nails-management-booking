import { StatisticsDashboard } from "@/components/admin/statistics-dashboard"

export const metadata = {
  title: "Dashboard – K.Tay Nails Admin",
  description: "Tổng quan dữ liệu kinh doanh, doanh thu, lịch hẹn và hiệu suất nhân viên",
}

export default function AdminPage() {
  return <StatisticsDashboard />
}
