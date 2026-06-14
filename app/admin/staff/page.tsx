import { StaffManagement } from "@/components/admin/staff-management"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminStaffPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "staff") {
    redirect("/admin/appointments")
  }
  return <StaffManagement />
}
