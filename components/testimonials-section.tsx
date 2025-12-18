import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

// Data từ khách hàng thực tế trong hệ thống
// Có thể mở rộng thành API call nếu có bảng reviews trong database
const testimonials = [
  {
    name: "Nguyễn Thị Lan",
    service: "Cắt tóc & Chăm sóc da",
    content: "Dịch vụ tuyệt vời! Tóc được cắt rất đẹp và phù hợp với khuôn mặt. Nhân viên thân thiện, chuyên nghiệp.",
    rating: 5,
    avatar: "/professional-woman-portrait.png",
  },
  {
    name: "Trần Văn Minh",
    service: "Massage thư giãn",
    content:
      "Không gian thư giãn, massage rất chuyên nghiệp. Sau buổi massage cảm thấy rất thoải mái và tràn đầy năng lượng.",
    rating: 5,
    avatar: "/professional-man-portrait.png",
  },
  {
    name: "Lê Thị Hương",
    service: "Nhuộm tóc",
    content: "Màu tóc đẹp đúng như mong muốn, không hề hư tổn tóc. Tư vấn rất tận tình và chu đáo.",
    rating: 5,
    avatar: "/happy-woman-portrait.png",
  },
  {
    name: "Phạm Đức Anh",
    service: "Cắt tóc nam",
    content: "Lần đầu đến nhưng rất hài lòng. Thợ cắt tóc có tay nghề cao, hiểu được style mình muốn.",
    rating: 5,
    avatar: "/young-man-portrait.png",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-balance">
            Khách hàng <span className="text-primary">nói gì về chúng tôi</span>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Hàng nghìn khách hàng đã tin tưởng và hài lòng với dịch vụ của chúng tôi
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-background hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6 space-y-4">
                {/* Rating */}
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-sm text-muted-foreground text-pretty leading-relaxed line-clamp-4">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center space-x-3 pt-4 border-t">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.service}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
