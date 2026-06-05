import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ServicesPageClient } from "@/components/services-page-client";
import { Suspense } from "react";

function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left: Filter Column Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Card Skeleton */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1)] backdrop-blur-md">
            <div className="h-5 w-24 bg-neutral-200 rounded-md mb-4 animate-pulse" />
            <div className="h-10 w-full bg-neutral-100 rounded-xl animate-pulse" />
          </div>

          {/* Categories Card Skeleton */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1)] backdrop-blur-md">
            <div className="h-5 w-32 bg-neutral-200 rounded-md mb-4 animate-pulse" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 w-2/3">
                    <div className="h-4 w-4 bg-neutral-200 rounded-md animate-pulse" />
                    <div className="h-4 w-full bg-neutral-100 rounded-md animate-pulse" />
                  </div>
                  <div className="h-3 w-8 bg-neutral-100 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Duration Card Skeleton */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1)] backdrop-blur-md">
            <div className="h-5 w-28 bg-neutral-200 rounded-md mb-4 animate-pulse" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 w-2/3">
                    <div className="h-4 w-4 bg-neutral-200 rounded-md animate-pulse" />
                    <div className="h-4 w-full bg-neutral-100 rounded-md animate-pulse" />
                  </div>
                  <div className="h-3 w-8 bg-neutral-100 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Service Cards Grid Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-5 w-48 bg-neutral-200 rounded-md animate-pulse" />
            <div className="flex space-x-2">
              <div className="h-9 w-16 bg-neutral-200 rounded-md animate-pulse" />
              <div className="h-9 w-24 bg-neutral-200 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-neutral-200/80 bg-white/50 p-0 flex flex-col justify-between min-h-[380px] overflow-hidden shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1)]"
              >
                {/* Image Placeholder */}
                <div className="aspect-video w-full bg-neutral-200 animate-pulse" />
                {/* Content */}
                <div className="flex-1 flex flex-col p-6 justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="h-5 w-2/3 bg-neutral-200 rounded-md animate-pulse" />
                      <div className="h-5 w-16 bg-neutral-200 rounded-md animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-neutral-100 rounded-md animate-pulse" />
                      <div className="h-3 w-5/6 bg-neutral-100 rounded-md animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-100/60 flex flex-col gap-3">
                    <div className="h-4 w-20 bg-neutral-100 rounded-md animate-pulse" />
                    <div className="h-10 w-full bg-neutral-200 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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