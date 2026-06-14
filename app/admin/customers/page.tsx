import { CustomersManagement } from '@/components/admin/customers-management'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CustomersPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "staff") {
    redirect("/admin/appointments")
  }
  return <CustomersManagement />
}
