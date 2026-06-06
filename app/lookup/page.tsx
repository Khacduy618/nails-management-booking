import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AppointmentLookup } from "@/components/appointment-lookup"
import Script from "next/script"

export default function LookupPage() {
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
      {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
        />
      )}
      <main className="relative z-10 pt-24 lg:pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-neutral-900 mb-4">
              Tra cứu <span className="font-serif italic font-medium text-primary">lịch hẹn.</span>
            </h1>
            <p className="text-lg text-neutral-500 font-medium max-w-2xl mx-auto">
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
