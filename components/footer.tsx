import Link from "next/link"
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-transparent border-t border-neutral-200/80 relative overflow-hidden">

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.png" width={170} alt="K.Tay Nails Logo" />
            </Link>
            <p className="text-sm text-neutral-500 leading-relaxed font-medium">
              Trung tâm làm đẹp móng cao cấp với dịch vụ chuyên nghiệp và đội ngũ kỹ thuật viên giàu kinh nghiệm.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-bold text-neutral-800 text-base">Liên kết nhanh</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-sm text-neutral-500 hover:text-primary transition-colors font-medium">
                Trang chủ
              </Link>
              <Link href="/services" className="text-sm text-neutral-500 hover:text-primary transition-colors font-medium">
                Dịch vụ
              </Link>
              <Link href="/lookup" className="text-sm text-neutral-500 hover:text-primary transition-colors font-medium">
                Tra cứu lịch hẹn
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-neutral-800 text-base">Thông tin liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm text-neutral-500 font-medium">0123 456 789</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm text-neutral-500 font-medium">info@ktaynails.vn</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm text-neutral-500 leading-relaxed font-medium">123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h3 className="font-bold text-neutral-800 text-base">Giờ mở cửa</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm text-neutral-500 font-medium space-y-1">
                  <p>Thứ 2 - Thứ 6: 8:00 - 20:00</p>
                  <p>Thứ 7 - CN: 9:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-200/50 mt-12 pt-8 text-center text-xs text-neutral-400 font-semibold">
          <p>&copy; {new Date().getFullYear()} K.Tay Nails. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
