"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, Clock, Users, ArrowRight, Star } from "lucide-react"
import { useEffect, useState, useRef } from "react"

interface Stats {
  totalCustomers: number
  totalServices: number
}

const CAROUSEL_IMAGES = [
  "/nail-art-1.png",
  "/nail-art-2.png",
  "/nail-art-3.png",
  "/nail-art-4.png",
  "/nail-art-5.png",
]

export function HeroSection() {
  const [stats, setStats] = useState<Stats>({ totalCustomers: 0, totalServices: 0 })
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)

  // Carousel dragging refs
  const progressRef = useRef(0)
  const isDragging = useRef(false)
  const lastPointerX = useRef<number | null>(null)
  const lastPointerY = useRef<number | null>(null)
  const dragDeltaX = useRef(0)
  const dragDeltaY = useRef(0)

  useEffect(() => {
    setMounted(true)
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/"
        const res = await fetch(`${apiUrl.replace(/\/$/, "")}/stats/public`)
        if (res.ok) {
          const result = await res.json()
          if (result.success && result.data) {
            setStats({
              totalCustomers: result.data.totalCustomers || 0,
              totalServices: result.data.totalServices || 0,
            })
          }
        }
      } catch {}
    }
    fetchStats()
  }, [])

  // Auto rotation animation loop (tasteskill delta-time based)
  useEffect(() => {
    let animationFrameId: number
    let lastTime = performance.now()
    
    const animate = (time: number) => {
      const deltaTime = time - lastTime
      lastTime = time
      
      if (!isDragging.current) {
        progressRef.current = (progressRef.current + 0.000045 * deltaTime) % 1
        setProgress(progressRef.current)
      }
      
      animationFrameId = requestAnimationFrame(animate)
    }
    
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    lastPointerX.current = e.clientX
    lastPointerY.current = e.clientY
    dragDeltaX.current = 0
    dragDeltaY.current = 0
    isDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || lastPointerX.current === null || lastPointerY.current === null) return
    
    dragDeltaX.current = e.clientX - lastPointerX.current
    dragDeltaY.current = e.clientY - lastPointerY.current

    // Drag vertical offset + quarter of horizontal drag
    const dragOffset = dragDeltaY.current + 0.25 * dragDeltaX.current
    
    // Increment base progress (8e-4 scaling factor from tasteskill)
    progressRef.current = (progressRef.current + 0.0008 * dragOffset + 1) % 1
    setProgress(progressRef.current)

    lastPointerX.current = e.clientX
    lastPointerY.current = e.clientY
  }

  const handlePointerUp = () => {
    isDragging.current = false
    lastPointerX.current = null
    lastPointerY.current = null
  }

  return (
    <section className="hero-section relative min-h-[95vh] lg:min-h-screen overflow-hidden flex flex-col justify-center bg-transparent">
      {/* ── Warm organic background gradients ── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-transparent" aria-hidden="true">
        {/* Top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#f5f4f2]/20 to-transparent" />
        
        {/* Bottom gradient overlay to fade into the next section */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-[#f5f4f2]/40" />
      </div>

      {/* Blurred blob decorations */}
      <div className="hero-blob hero-blob-1" aria-hidden="true" />
      <div className="hero-blob hero-blob-2" aria-hidden="true" />
      <div className="hero-blob hero-blob-3" aria-hidden="true" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 lg:pt-28">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-12 items-center">

          {/* ── Left: Content ── */}
          <div className="space-y-8 lg:py-0">
            {/* Badge */}
            <div
              className="hero-badge"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              <span className="hero-badge-dot" aria-hidden="true" />
              Dịch vụ nail cao cấp tại TP.HCM
              <ArrowRight className="h-3.5 w-3.5 opacity-60" />
            </div>

            {/* Headline */}
            <div
              className="space-y-3"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
              }}
            >
              <h1 className="text-[44px] sm:text-6xl lg:text-7xl font-semibold leading-[1.02] tracking-tight text-neutral-900">
                K.Tay Nails
              </h1>
              <p className="text-2xl sm:text-4xl font-normal leading-snug tracking-tight text-neutral-800 font-serif italic">
                Làm đẹp tự nhiên, chuyên nghiệp.
              </p>
            </div>

            {/* Description */}
            <p
              className="text-base text-neutral-600 leading-relaxed font-medium max-w-lg"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
              }}
            >
              Trải nghiệm dịch vụ chăm sóc móng đẳng cấp với đội ngũ kỹ thuật viên lành nghề.
              Đặt lịch nhanh chóng trong 60 giây, không cần đăng ký tài khoản.
            </p>

            {/* Stats row */}
            <div
              className="hero-stats"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
              }}
            >
              <div className="hero-stat">
                <span className="hero-stat-value">
                  {Math.max(stats.totalCustomers, 1000)}+
                </span>
                <span className="hero-stat-label">Khách hàng</span>
              </div>
              <div className="hero-stat-divider" aria-hidden="true" />
              <div className="hero-stat">
                <span className="hero-stat-value">10+</span>
                <span className="hero-stat-label">Năm kinh nghiệm</span>
              </div>
              <div className="hero-stat-divider" aria-hidden="true" />
              <div className="hero-stat">
                <div className="hero-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <span className="hero-stat-label">4.9 / 5 đánh giá</span>
              </div>
            </div>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-3"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
              }}
            >
              <Button size="lg" asChild className="hero-cta-primary rounded-full">
                <Link href="/book">
                  Đặt lịch ngay
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="hero-cta-secondary rounded-full">
                <Link href="/lookup">Tra cứu lịch hẹn</Link>
              </Button>
            </div>
          </div>

          {/* ── Right: 3D Perspective Image Carousel (Desktop) or Infinite Marquee (Mobile) ── */}
          <div
            className="relative w-full flex flex-col items-center justify-center lg:h-full lg:min-h-0 lg:max-w-none lg:self-stretch"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.9s ease 0.2s",
            }}
          >
            {/* Mobile View: Infinite Marquee flow */}
            <div className="-mx-4 mt-6 w-screen max-w-[100vw] overflow-hidden sm:-mx-6 lg:hidden" aria-hidden="true">
              <div className="hero-mobile-flow flex w-max gap-3 will-change-transform sm:gap-4">
                {[...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES].map((img, r) => (
                  <figure key={`mobile-${r}`} className="flex-none w-[260px] overflow-hidden rounded-[18px] sm:w-[320px]">
                    <img
                      src={img}
                      alt=""
                      className="h-auto w-full rounded-[18px] object-cover"
                      loading="lazy"
                    />
                  </figure>
                ))}
              </div>
            </div>

            {/* Desktop View: 3D Stack Rotating Carousel */}
            <div
              className="relative mx-auto hidden w-full max-w-[1220px] touch-pan-y select-none lg:block lg:h-[82vh] lg:max-h-[940px] xl:max-w-[1400px]"
              style={{ perspective: "3400px" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label="Hero image carousel"
            >
              <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(3deg) rotateY(-4deg)",
                }}
              >
                {CAROUSEL_IMAGES.map((img, index) => {
                  const a = (index / CAROUSEL_IMAGES.length + progress) % 1
                  const isVisible = a > 0 && a < 0.72
                  const t = isVisible ? (a - 0) / 0.72 : 0
                  
                  // u is the fade-in/fade-out opacity factor
                  const u = Math.min(
                    Math.min(1, Math.max(0, t / 0.06)),
                    Math.min(1, Math.max(0, (1 - t) / 0.08))
                  )
                  
                  const arcLength = Math.PI / 2 * 90
                  const lineOut = 240
                  const totalLength = 280 + arcLength + lineOut
                  const f = 280 / totalLength
                  const g = (280 + arcLength) / totalLength
                  
                  // x is the depth/sin factor
                  const sFactor = isVisible
                    ? Math.sin((t < f ? t / (2 * f) : 0.5 + (t - f) / (2 * (1 - f))) * Math.PI)
                    : 0
                  
                  let xOffsetPercent = 0
                  let yOffsetPercent = 0
                  
                  if (t < f) {
                    xOffsetPercent = -10
                    yOffsetPercent = -300 + (t / f) * 280
                  } else if (t < g) {
                    const angle = (180 + ((t - f) / (g - f)) * 90) * Math.PI / 180
                    xOffsetPercent = 80 + 90 * Math.cos(angle)
                    yOffsetPercent = -20 - 90 * Math.sin(angle)
                  } else {
                    xOffsetPercent = 80 + ((t - g) / (1 - g)) * lineOut
                    yOffsetPercent = 70
                  }
                  
                  return (
                    <figure
                      key={index}
                      className="absolute left-1/2 top-1/2 w-[62%]"
                      style={{
                        zIndex: Math.round(20 + 80 * sFactor),
                        opacity: isVisible ? u * (0.4 + 0.6 * sFactor) : 0,
                        transform: `translate3d(calc(-50% + ${xOffsetPercent}%), calc(-50% + ${yOffsetPercent}%), ${-1000 + 1280 * sFactor}px) rotateX(${4 - 2 * sFactor}deg) rotateY(${-3 + 6 * t}deg) rotateZ(0deg) scale(${0.44 + 0.74 * sFactor})`,
                        pointerEvents: sFactor > 0.72 ? "auto" : "none",
                        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      <img
                        src={img}
                        alt={`Nail Art design ${index + 1}`}
                        className="h-auto w-full rounded-[18px] shadow-2xl border border-white/15 select-none pointer-events-none"
                        draggable={false}
                      />
                    </figure>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom feature pills ── */}
        <div
          className="hero-features"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.7s ease 0.5s, transform 0.7s ease 0.5s",
          }}
        >
          {[
            { icon: Sparkles, label: "Dịch vụ cao cấp", sub: "Nguyên vật liệu nhập khẩu" },
            { icon: Clock, label: "Đặt lịch nhanh", sub: "Không cần tài khoản" },
            { icon: Users, label: "Đội ngũ chuyên nghiệp", sub: "Kinh nghiệm 10+ năm" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="hero-feature-pill">
              <div className="hero-feature-icon" aria-hidden="true">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="hero-feature-label">{label}</p>
                <p className="hero-feature-sub">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
