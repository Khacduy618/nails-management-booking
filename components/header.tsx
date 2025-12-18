"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Phone, Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">KTs</span>
            </div>
            <span className="font-bold text-xl text-foreground">K.Tay Nails</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <Link href="/services" className="text-foreground hover:text-primary transition-colors">
              Dịch vụ
            </Link>
            <Link href="/lookup" className="text-foreground hover:text-primary transition-colors">
              Tra cứu lịch hẹn
            </Link>
          </nav>

          {/* Contact & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>0123 456 789</span>
            </div>
            <Button asChild>
              <Link href="/book">Đặt lịch ngay</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href="/services"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dịch vụ
              </Link>
              <Link
                href="/lookup"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Tra cứu lịch hẹn
              </Link>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-2">
                <Phone className="h-4 w-4" />
                <span>0123 456 789</span>
              </div>
              <Button asChild className="w-fit">
                <Link href="/book" onClick={() => setIsMenuOpen(false)}>
                  Đặt lịch ngay
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
