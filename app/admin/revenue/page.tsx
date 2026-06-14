import { RevenueAnalytics } from "@/components/admin/revenue-analytics"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminRevenuePage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "staff") {
    redirect("/admin/appointments")
  }
  return <RevenueAnalytics />
}
