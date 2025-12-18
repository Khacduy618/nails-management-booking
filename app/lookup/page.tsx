import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AppointmentLookup } from "@/components/appointment-lookup"

export default function LookupPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-balance mb-4">
              Tra cứu <span className="text-primary">lịch hẹn</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Nhập số điện thoại để xem và quản lý các lịch hẹn đã đặt của bạn
            </p>
          </div>

          {/* Lookup Component */}
          <div className="max-w-4xl mx-auto">
            <AppointmentLookup />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
