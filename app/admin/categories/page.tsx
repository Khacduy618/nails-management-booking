import { CategoriesManagement } from "@/components/admin/categories-management"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "staff") {
    redirect("/admin/appointments")
  }
  return <CategoriesManagement />
}
