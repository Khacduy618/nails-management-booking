import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Toaster } from "@/components/ui/sonner"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

// Dynamic render for admin routes (don't try to prerender with redirects)
export const dynamic = "force-dynamic"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // Redirect unauthenticated users to login
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
