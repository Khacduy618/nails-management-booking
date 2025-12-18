import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface AppointmentEmailData {
    appointmentId: number
    customerName: string
    customerEmail: string
    customerPhone: string
    appointmentDate: string
    appointmentTime: string
    services: Array<{ name: string; price: string }>
    staffName: string
    totalPrice: number
    totalDuration: number
    notes?: string | null
}

export async function sendConfirmationEmail(data: AppointmentEmailData) {
    try {
        const {
            appointmentId,
            customerName,
            customerEmail,
            customerPhone,
            appointmentDate,
            appointmentTime,
            services,
            staffName,
            totalPrice,
            totalDuration,
            notes,
        } = data

        const escape = (s: string) => s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')

        // Parse date for Vietnamese locale
        const dateObj = new Date(`${appointmentDate}T${appointmentTime}`)
        const formattedDate = format(dateObj, 'EEEE, dd/MM/yyyy', { locale: vi })
        const totalAmount = services.reduce((sum, s) => sum + Number(s.price), 0)

        const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác Nhận Đặt Lịch</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-weight: bold;
            font-size: 14px;
            color: #667eea;
            margin-bottom: 10px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #555;
        }
        .value {
            color: #333;
        }
        .appointment-id {
            background-color: #f0f4ff;
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            text-align: center;
            font-size: 12px;
        }
        .appointment-id-label {
            font-size: 11px;
            color: #999;
            margin-bottom: 5px;
        }
        .appointment-id-value {
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
        }
        .services-list {
            background-color: #f9f9f9;
            padding: 12px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .service-item {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        .service-item:last-child {
            border-bottom: none;
        }
        .total-section {
            background-color: #f0f4ff;
            padding: 15px;
            border-radius: 4px;
            margin-top: 15px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            font-weight: bold;
            color: #667eea;
        }
        .notes {
            background-color: #fffacd;
            padding: 12px;
            border-left: 4px solid #ffd700;
            border-radius: 4px;
            font-size: 13px;
            margin: 15px 0;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            font-weight: bold;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
        }
        .footer-contact {
            margin-top: 10px;
            line-height: 1.8;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>✨ Xác Nhận Đặt Lịch ✨</h1>
        </div>
        <div class="content">
            <div class="greeting">
                <p>Xin chào <strong>${escape(customerName)}</strong>,</p>
                <p>Cảm ơn bạn đã đặt lịch hẹn tại Nails Manager. Dưới đây là thông tin chi tiết về lịch hẹn của bạn:</p>
            </div>

            <div class="appointment-id">
                <div class="appointment-id-label">Mã Lịch Hẹn</div>
                <div class="appointment-id-value">#${appointmentId}</div>
            </div>

            <div class="section">
                <div class="section-title">📅 THÔNG TIN LỊCH HẸN</div>
                <div class="info-row">
                    <span class="label">Ngày:</span>
                    <span class="value">${formattedDate}</span>
                </div>
                <div class="info-row">
                    <span class="label">Giờ:</span>
                    <span class="value">${appointmentTime}</span>
                </div>
                <div class="info-row">
                    <span class="label">Nhân Viên:</span>
                    <span class="value">${escape(staffName)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Thời Lượng:</span>
                    <span class="value">${totalDuration} phút</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🎀 DỊCH VỤ ĐẶT</div>
                <div class="services-list">
                    ${services.map(s => `
                    <div class="service-item">
                        <span>${escape(s.name)}</span>
                        <span>${Number(s.price).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    `).join('')}
                </div>
                <div class="total-section">
                    <div class="total-row">
                        <span>TỔNG TIỀN:</span>
                        <span>${totalAmount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">👤 THÔNG TIN LIÊN HỆ</div>
                <div class="info-row">
                    <span class="label">Họ và Tên:</span>
                    <span class="value">${escape(customerName)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Số Điện Thoại:</span>
                    <span class="value">${escape(customerPhone)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${escape(customerEmail)}</span>
                </div>
            </div>

            ${notes ? `
            <div class="notes">
                <strong>📝 Ghi Chú:</strong><br/>
                ${escape(notes)}
            </div>
            ` : ''}

            <p style="margin-top: 20px; margin-bottom: 20px; font-size: 14px; line-height: 1.8;">
                Vui lòng <strong>đến trước 5 phút</strong> để chuẩn bị. Nếu bạn cần hủy hoặc thay đổi lịch hẹn, hãy liên hệ với chúng tôi sớm nhất có thể.
            </p>

            <center>
                <a href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/lookup?phone=${customerPhone}" class="cta-button">
                    Xem Lịch Hẹn Của Bạn
                </a>
            </center>
        </div>
        <div class="footer">
            <p style="margin: 0; font-weight: bold;">Nails Manager - Dịch Vụ Chăm Sóc Sắc Đẹp</p>
            <div class="footer-contact">
                <p style="margin: 5px 0;">📞 Liên Hệ: <strong>(028) 1234 5678</strong></p>
                <p style="margin: 5px 0;">📧 Email: <strong>support@nailsmanager.com</strong></p>
                <p style="margin: 5px 0;">📍 Địa Chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
            </div>
            <p style="margin-top: 15px; color: #999;">
                © 2024 Nails Manager. Tất cả các quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>
    `

        // For now, we'll just log the email sending
        // In production, integrate with SendGrid, Gmail API, or other email service
        console.log('[EMAIL] Sending confirmation email:', {
            to: customerEmail,
            subject: `Xác Nhận Đặt Lịch #${appointmentId} - Nails Manager`,
            htmlContent: htmlContent.substring(0, 100) + '...',
        })

        // Placeholder for actual email sending
        // await sendEmailViaService({
        //   to: customerEmail,
        //   subject: `Xác Nhận Đặt Lịch #${appointmentId} - Nails Manager`,
        //   html: htmlContent,
        // })

        return true
    } catch (error) {
        console.error('[EMAIL] Error sending confirmation email:', error)
        // Don't throw - just log error so it doesn't block appointment creation
        return false
    }
}
