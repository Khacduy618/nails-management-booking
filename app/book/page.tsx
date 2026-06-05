import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingForm } from "@/components/booking-form"

export default function BookPage() {
  return (
    <div className="premium-page-container min-h-screen">
      {/* Background decorations */}
      <div className="premium-page-bg" aria-hidden="true">
        <img src="/cleanstoneimg.webp" alt="" className="premium-page-texture" />
        <div className="premium-page-overlay-top" />
        <div className="premium-page-overlay-bottom" />
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
      </div>

      <Header />
      <main className="relative z-10 pt-24 lg:pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-neutral-900 mb-4">
              Đặt <span className="font-serif italic font-medium text-primary">lịch hẹn.</span>
            </h1>
            <p className="text-lg text-neutral-500 font-medium max-w-2xl mx-auto">
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
