import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingForm } from "@/components/booking-form"

export default function BookPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-balance mb-4">
              Đặt <span className="text-primary">lịch hẹn</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Chọn dịch vụ và thời gian phù hợp để đặt lịch hẹn của bạn
            </p>
          </div>

          {/* Booking Form */}
          <div className="max-w-4xl mx-auto">
            <BookingForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
