import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import nodemailer from 'nodemailer'

const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT ?? 587)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFrom = process.env.SMTP_FROM || smtpUser
const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465

let mailTransporter: nodemailer.Transporter | null = null

function getMailTransporter() {
    if (!smtpHost || !smtpUser || !smtpPass) {
        return null
    }

    if (!mailTransporter) {
        mailTransporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        })
    }

    return mailTransporter
}

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
                <p>Cảm ơn bạn đã đặt lịch hẹn tại K-Tay Nails. Dưới đây là thông tin chi tiết về lịch hẹn của bạn:</p>
            </div>

            <div class="section">
                <div class="section-title">📅 THÔNG TIN LỊCH HẸN</div>
                <div class="info-row">
                    <span class="label">Ngày: </span>
                    <span class="value">${formattedDate}</span>
                </div>
                <div class="info-row">
                    <span class="label">Giờ: </span>
                    <span class="value">${appointmentTime}</span>
                </div>
                <div class="info-row">
                    <span class="label">Nhân Viên: </span>
                    <span class="value">${escape(staffName)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Thời Lượng: </span>
                    <span class="value">${totalDuration} phút</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🎀 DỊCH VỤ ĐẶT</div>
                <div class="services-list">
                    ${services.map(s => `
                    <div class="service-item">
                        <span>${escape(s.name)}: </span>
                        <span>${Number(s.price).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    `).join('')}
                </div>
                <div class="total-section">
                    <div class="total-row">
                        <span>TỔNG TIỀN: </span>
                        <span>${totalAmount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">👤 THÔNG TIN LIÊN HỆ</div>
                <div class="info-row">
                    <span class="label">Họ và Tên: </span>
                    <span class="value">${escape(customerName)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Số Điện Thoại: </span>
                    <span class="value">${escape(customerPhone)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Email: </span>
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
            <p style="margin: 0; font-weight: bold;">K-Tay Nails - Dịch Vụ Chăm Sóc Sắc Đẹp</p>
            <div class="footer-contact">
                <p style="margin: 5px 0;">📞 Liên Hệ: <strong>(028) 1234 5678</strong></p>
                <p style="margin: 5px 0;">📧 Email: <strong>support@nailsmanager.com</strong></p>
                <p style="margin: 5px 0;">📍 Địa Chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
            </div>
            <p style="margin-top: 15px; color: #999;">
                © 2024 K-Tay Nails. Tất cả các quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>
    `

        const transporter = getMailTransporter()

        if (!transporter) {
            console.warn('[EMAIL] SMTP config missing, skipped sending confirmation email.')
            return false
        }

        const subject = `Xác Nhận Đặt Lịch - K-Tay Nails`

        await transporter.sendMail({
            from: smtpFrom || 'K-Tay Nails <no-reply@ktaynails.com>',
            to: customerEmail,
            subject,
            html: htmlContent,
        })

        console.log('[EMAIL] Confirmation email sent to:', customerEmail)
        return true
    } catch (error) {
        console.error('[EMAIL] Error sending confirmation email:', error)
        // Don't throw - just log error so it doesn't block appointment creation
        return false
    }
}

export async function sendOTP(phone: string, code: string, customerName: string) {
    try {
        const message = `Mã OTP của bạn để hủy lịch hẹn: ${code}. Mã này có hiệu lực trong 5 phút. Đừng chia sẻ mã này với bất kỳ ai.`

        console.log('[OTP] Sending OTP:', {
            to: phone,
            code,
            customerName,
            message,
        })

        // For now, just log it (development only)
        console.log('[OTP] OTP would be sent to:', phone, 'Code:', code)

        return true
    } catch (error) {
        console.error('[OTP] Error sending OTP:', error)
        throw error
    }
}

export async function sendCancellationEmail(data: AppointmentEmailData) {
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

        const dateObj = new Date(`${appointmentDate}T${appointmentTime}`)
        const formattedDate = format(dateObj, 'EEEE, dd/MM/yyyy', { locale: vi })
        const totalAmount = services.reduce((sum, s) => sum + Number(s.price), 0)

        const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác Nhận Hủy Lịch Hẹn</title>
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
            background: linear-gradient(135deg, #e53e3e 0%, #b7791f 100%);
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
            color: #e53e3e;
            margin-bottom: 10px;
            border-bottom: 2px solid #e53e3e;
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
            text-decoration: line-through;
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
            text-decoration: line-through;
            color: #777;
        }
        .service-item:last-child {
            border-bottom: none;
        }
        .total-section {
            background-color: #fff5f5;
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
            color: #e53e3e;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>❌ Xác Nhận Hủy Lịch Hẹn ❌</h1>
        </div>
        <div class="content">
            <div class="greeting">
                <p>Xin chào <strong>${escape(customerName)}</strong>,</p>
                <p>Chúng tôi xác nhận lịch hẹn của bạn tại K-Tay Nails đã được <strong>hủy thành công</strong> theo yêu cầu. Dưới đây là thông tin chi tiết về lịch hẹn đã hủy:</p>
            </div>

            <div class="section">
                <div class="section-title">📅 THÔNG TIN LỊCH HẸN ĐÃ HỦY</div>
                <div class="info-row">
                    <span class="label">Mã Lịch Hẹn: </span>
                    <span class="value" style="text-decoration: none; font-weight: bold; color: #e53e3e;">#${appointmentId}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ngày Hẹn: </span>
                    <span class="value">${formattedDate}</span>
                </div>
                <div class="info-row">
                    <span class="label">Giờ Hẹn: </span>
                    <span class="value">${appointmentTime}</span>
                </div>
                <div class="info-row">
                    <span class="label">Nhân Viên: </span>
                    <span class="value">${escape(staffName)}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🎀 DỊCH VỤ ĐÃ HỦY</div>
                <div class="services-list">
                    ${services.map(s => `
                    <div class="service-item">
                        <span>${escape(s.name)}: </span>
                        <span>${Number(s.price).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    `).join('')}
                </div>
                <div class="total-section">
                    <div class="total-row">
                        <span>TỔNG TIỀN HOÀN LẠI / HỦY: </span>
                        <span>${totalAmount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                </div>
            </div>

            <p style="margin-top: 25px; font-size: 14px; line-height: 1.8;">
                Chúng tôi rất tiếc vì không thể phục vụ bạn lần này. Bạn có thể đặt lại lịch hẹn mới bất cứ lúc nào qua trang web của chúng tôi.
            </p>

            <center style="margin-top: 25px;">
                <a href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/book" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #e53e3e 0%, #b7791f 100%); color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Đặt Lịch Hẹn Mới
                </a>
            </center>
        </div>
        <div class="footer">
            <p style="margin: 0; font-weight: bold;">K-Tay Nails - Dịch Vụ Chăm Sóc Sắc Đẹp</p>
            <p style="margin-top: 15px; color: #999;">
                © 2024 K-Tay Nails. Tất cả các quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>
`

        const transporter = getMailTransporter()
        if (!transporter) {
            console.warn('[EMAIL] SMTP config missing, skipped sending cancellation email.')
            return false
        }

        const subject = `Xác Nhận Hủy Lịch Hẹn - K-Tay Nails`

        await transporter.sendMail({
            from: smtpFrom || 'K-Tay Nails <no-reply@ktaynails.com>',
            to: customerEmail,
            subject,
            html: htmlContent,
        })

        console.log('[EMAIL] Cancellation email sent to:', customerEmail)
        return true
    } catch (error) {
        console.error('[EMAIL] Error sending cancellation email:', error)
        return false
    }
}

export async function sendAdminCancellationNotification(data: AppointmentEmailData) {
    try {
        const {
            appointmentId,
            customerName,
            customerPhone,
            appointmentDate,
            appointmentTime,
            services,
            staffName,
        } = data

        const dateObj = new Date(`${appointmentDate}T${appointmentTime}`)
        const formattedDate = format(dateObj, 'dd/MM/yyyy', { locale: vi })
        const totalAmount = services.reduce((sum, s) => sum + Number(s.price), 0)

        const adminEmail = process.env.ADMIN_EMAIL || smtpUser

        if (!adminEmail) {
            console.warn('[EMAIL] ADMIN_EMAIL is not set, skipped sending admin notification.')
            return false
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Thông Báo: Khách Hủy Lịch</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-top: 5px solid #e53e3e; border-radius: 4px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #e53e3e; margin-top: 0;">⚠️ KHÁCH HÀNG HỦY LỊCH HẸN</h2>
        <p>Hệ thống ghi nhận lịch hẹn <strong>#${appointmentId}</strong> đã bị hủy bởi khách hàng.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f2f2f2;">
                <td style="padding: 8px; font-weight: bold; width: 40%;">Tên khách hàng:</td>
                <td style="padding: 8px;">${customerName}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Số điện thoại:</td>
                <td style="padding: 8px;">${customerPhone}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
                <td style="padding: 8px; font-weight: bold;">Ngày hẹn:</td>
                <td style="padding: 8px;">${formattedDate}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Giờ hẹn:</td>
                <td style="padding: 8px;">${appointmentTime}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
                <td style="padding: 8px; font-weight: bold;">Nhân viên làm:</td>
                <td style="padding: 8px;">${staffName}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Dịch vụ đã đặt:</td>
                <td style="padding: 8px;">${services.map(s => s.name).join(', ')}</td>
            </tr>
            <tr style="background-color: #f2f2f2; font-weight: bold; color: #e53e3e;">
                <td style="padding: 8px;">Tổng tiền hủy:</td>
                <td style="padding: 8px;">${totalAmount.toLocaleString('vi-VN')} ₫</td>
            </tr>
        </table>

        <p style="margin-top: 20px; font-size: 13px; color: #666;">
            Vui lòng đăng nhập vào trang quản trị để xem và sắp xếp lại lịch làm việc của nhân viên.
        </p>
    </div>
</body>
</html>
`

        const transporter = getMailTransporter()
        if (!transporter) {
            return false
        }

        await transporter.sendMail({
            from: smtpFrom || 'K-Tay Nails <no-reply@ktaynails.com>',
            to: adminEmail,
            subject: `[⚠️ HỦY LỊCH] Lịch hẹn #${appointmentId} đã bị hủy bởi khách hàng`,
            html: htmlContent,
        })

        console.log('[EMAIL] Admin cancellation notification email sent to:', adminEmail)
        return true
    } catch (error) {
        console.error('[EMAIL] Error sending admin cancellation notification email:', error)
        return false
    }
}

