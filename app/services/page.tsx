import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ServicesPageClient } from "@/components/services-page-client";
import { Suspense } from "react";

function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="h-96 bg-card rounded-lg animate-pulse" />
        </div>
        <div className="lg:col-span-3 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
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
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-neutral-900 mb-4">
              Dịch vụ <span className="font-serif italic font-medium text-primary">làm đẹp.</span>
            </h1>
            <p className="text-lg text-neutral-500 font-medium max-w-2xl">
              Khám phá đầy đủ các dịch vụ chăm sóc sức khỏe và làm móng nghệ thuật cao cấp
            </p>
          </div>

          <Suspense fallback={<PageSkeleton />}>
            <ServicesPageClient />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}