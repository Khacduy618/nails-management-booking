import { StoreSchedule } from "@/components/store-schedule"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SchedulePage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "staff") {
    redirect("/admin/appointments")
  }

  return (
    <div className="space-y-6">
        
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-balance mb-4">
              Lịch <span className="text-primary">cửa hàng</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Xem lịch trình các dịch vụ đã được đặt trong ngày
            </p>
          </div>

          {/* Schedule Component */}
          <StoreSchedule />
    </div>
  )
}
