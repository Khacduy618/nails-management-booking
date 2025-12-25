import Link from "next/link"
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.png" width={170} alt="K.Tay Nails Logo" />
            </Link>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              Trung tâm làm đẹp cao cấp với dịch vụ chuyên nghiệp và đội ngũ giàu kinh nghiệm.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Liên kết nhanh</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                Trang chủ
              </Link>
              <Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">
                Dịch vụ
              </Link>
              <Link href="/booking-search" className="text-muted-foreground hover:text-primary transition-colors">
                Tra cứu lịch hẹn
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Thông tin liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">0123 456 789</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">info@serenitybeauty.vn</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <span className="text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Giờ mở cửa</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-muted-foreground">
                  <p>Thứ 2 - Thứ 6: 8:00 - 20:00</p>
                  <p>Thứ 7 - CN: 9:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Serenity Beauty. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
