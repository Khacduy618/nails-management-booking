"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Phone, Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-[200] px-3 sm:top-4 sm:px-6 lg:top-5 lg:px-8">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Logo */}
        <Link 
          href="/" 
          className="group/logo pointer-events-auto relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/80 px-2 py-1.5 pr-3 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.18),0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.28),0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.98]"
        >
          <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-neutral-900 ring-1 ring-black/10 transition-[transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/logo:scale-[1.06] group-hover/logo:-rotate-[7deg]">
            <img src="/fav.png" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/logo:scale-110" alt="K" />
          </div>
          <span className="font-sans font-extrabold text-neutral-800 text-sm tracking-tight transition-colors duration-500 group-hover/logo:text-neutral-950">
            K.Tay Nails
          </span>
        </Link>
        
        {/* Desktop Navigation Links */}
        <div className="pointer-events-auto hidden md:flex items-center gap-8 rounded-2xl border border-neutral-200/80 bg-white/80 px-6 py-2.5 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.18),0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md">
          <Link href="/" className="text-sm font-bold text-neutral-800 hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <Link href="/services" className="text-sm font-bold text-neutral-800 hover:text-primary transition-colors">
            Dịch vụ
          </Link>
          <Link href="/lookup" className="text-sm font-bold text-neutral-800 hover:text-primary transition-colors">
            Tra cứu lịch hẹn
          </Link>
        </div>

        {/* Action Button & Contact */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 rounded-2xl border border-neutral-200/80 bg-white/80 px-4 py-2.5 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.18),0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md text-xs font-extrabold text-neutral-600">
            <Phone className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>0123 456 789</span>
          </div>
          <Button asChild className="rounded-2xl shadow-[0_6px_18px_-6px_rgba(15,15,15,0.18)] bg-primary text-white hover:bg-primary/95 hover:shadow-md transition-all duration-300 font-bold px-5">
            <Link href="/book">Đặt lịch ngay</Link>
          </Button>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200/80 bg-white/80 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.18)] backdrop-blur-md pointer-events-auto" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5 text-neutral-800" /> : <Menu className="h-5 w-5 text-neutral-800" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Popover */}
      {isMenuOpen && (
        <div className="pointer-events-auto absolute right-3 top-full mt-3 origin-top-right rounded-2xl border border-neutral-200/80 bg-white/95 p-4 w-52 shadow-[0_18px_38px_-14px_rgba(15,15,15,0.22),0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-200 ease-out sm:right-6 lg:right-8">
          <nav className="flex flex-col gap-3">
            <Link
              href="/"
              className="text-sm font-semibold text-neutral-800 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Trang chủ
            </Link>
            <Link
              href="/services"
              className="text-sm font-semibold text-neutral-800 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Dịch vụ
            </Link>
            <Link
              href="/lookup"
              className="text-sm font-semibold text-neutral-800 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Tra cứu lịch hẹn
            </Link>
            <div className="h-px bg-neutral-200/60 my-1" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>0123 456 789</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
