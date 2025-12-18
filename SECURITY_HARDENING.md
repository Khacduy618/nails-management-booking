# Báo Cáo Bảo Mật & Khắc Phục Đã Thực Hiện

**Ngày thực hiện:** 18/12/2025  
**Dự án:** NailsApp - Hệ thống đặt lịch hẹn

---

## 🔒 Tóm Tắt Các Khắc Phục Đã Thực Hiện

Các lỗ hổng bảo mật nghiêm trọng và trung bình đã được vá theo thứ tự ưu tiên. Dưới đây là chi tiết từng khắc phục:

---

### ✅ 1. Bảo Mật Endpoint Hủy Lịch Hẹn (Priority 1)

**Vấn đề:** API `DELETE /api/appointments/:id` cho phép bất kỳ ai biết `id` hủy lịch mà không xác minh quyền sở hữu.

**Khắc phục:**
- File: `app/api/appointments/[id]/route.ts`
- Yêu cầu tham số `?phone=` trong query string
- So sánh số điện thoại đã sanitize với `appointments.customerPhone` trong DB
- Trả về 401/403 nếu không khớp

**Code thay đổi:**
```typescript
const phoneParam = url.searchParams.get("phone") || ""
const sanitizedPhone = sanitizePhone(phoneParam)
if (!sanitizedPhone) {
  return NextResponse.json({ success: false, error: "Phone verification required" }, { status: 401 })
}
const apt = await db.query.appointments.findFirst({ where: eq(appointments.id, id) })
const ownerPhone = sanitizePhone(apt.customerPhone)
if (ownerPhone !== sanitizedPhone) {
  return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
}
```

**Client cập nhật:** `components/appointment-lookup.tsx` gửi số điện thoại đã sanitize trong query string.

---

### ✅ 2. Rate Limiting Cơ Bản (Priority 2)

**Vấn đề:** Public endpoints có thể bị spam/abuse không giới hạn.

**Khắc phục:**
- Tạo `lib/rate-limit.ts`: in-memory token bucket limiter với key theo IP + User-Agent
- Áp dụng cho:
  - `GET /api/appointments` (tra cứu): 10 req / 5 phút
  - `POST /api/appointments` (đặt lịch): 6 req / 10 phút
  - `GET /api/services` (danh mục): 60 req / 1 phút
- Trả về `429 Too Many Requests` với headers `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Cấu hình:**
```typescript
export const LIMITS = {
  lookupTight: { windowMs: 5 * 60 * 1000, max: 10 },
  booking: { windowMs: 10 * 60 * 1000, max: 6 },
  catalog: { windowMs: 60 * 1000, max: 60 },
}
```

**Lưu ý:** Đây là limiter in-memory, sẽ reset khi server restart. Production nên dùng Redis/Upstash.

---

### ✅ 3. Security Headers (Priority 3)

**Vấn đề:** Thiếu các header bảo mật chuẩn (CSP, HSTS, X-Frame-Options).

**Khắc phục:**
- File: `next.config.mjs`
- Thêm `headers()` để set cho tất cả routes:
  - **CSP**: `default-src 'self'`, script/style `'unsafe-inline'` (tạm thời, có thể tối ưu bằng nonce/hash)
  - **HSTS**: `max-age=15552000; includeSubDomains; preload` (chỉ hiệu quả khi HTTPS)
  - **X-Frame-Options**: `DENY`
  - **X-Content-Type-Options**: `nosniff`
  - **Referrer-Policy**: `strict-origin-when-cross-origin`
  - **Permissions-Policy**: giới hạn geolocation, microphone, camera

**Điều chỉnh CSP:** Nếu dùng external CDN, thêm vào `connect-src`/`script-src`. Tránh `'unsafe-inline'` bằng cách dùng styled-jsx hoặc hash inline scripts.

---

### ✅ 4. Hardening Upload Endpoint (Priority 4)

**Vấn đề:** 
- Tin cậy `file.type` từ client (dễ spoof)
- Không kiểm tra MIME thực tế từ file content

**Khắc phục:**
- File: `app/api/upload/route.ts`
- Thêm dependency: `file-type@19.5.0`
- Dùng `fileTypeFromBuffer()` để sniff MIME từ magic bytes
- Kiểm tra MIME đã sniff với whitelist `ALLOWED_MIME` (png/jpg/webp/gif/mp4)
- Reject nếu không khớp hoặc vượt quá `maxSize`

**Cài đặt:**
```bash
pnpm install file-type@19.5.0
```

**Gợi ý tiếp:** Xem xét loại bỏ `video/mp4` nếu không cần; strip EXIF metadata trước khi lưu (dùng `sharp` cho ảnh).

---

### ✅ 5. Admin CSRF Protection (Priority 5)

**Vấn đề:** Cookie-based JWT không có kiểm tra Origin/Referer → dễ bị CSRF.

**Khắc phục:**
- File: `middleware.ts`
- Với requests `/api/admin/*` không phải GET/HEAD/OPTIONS:
  - Kiểm tra `Origin` header khớp với `req.nextUrl.origin`
  - Hoặc `Referer` header bắt đầu với origin hiện tại
  - Trả về 403 nếu không hợp lệ

**Code:**
```typescript
if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
  const origin = req.headers.get('origin') || ''
  const referer = req.headers.get('referer') || ''
  const expected = req.nextUrl.origin
  const originOk = origin ? origin === expected : true
  const refererOk = referer ? referer.startsWith(expected) : true
  if (!originOk || !refererOk) {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Invalid origin" } }, { status: 403 })
  }
}
```

**Lưu ý:** NextAuth đã set `SameSite=Lax` cho cookie, giảm nguy cơ CSRF. Cơ chế này là thêm lớp bảo vệ.

---

### ✅ 6. PII-Safe Logging (Priority 6)

**Vấn đề:** Logs/Sentry chứa thông tin nhạy cảm (phone, email, notes, password).

**Khắc phục:**
- File: `lib/logger.ts`
- Thêm hàm `scrub()`:
  - Mask emails: `ab***@domain.com`
  - Mask phones: `***45` (chỉ giữ 2 số cuối)
  - Redact trường `password`, `secret`, `token`, `authorization`
  - Recursively scrub objects và arrays
- Áp dụng cho `logError()`, `logInfo()`, `logDebug()`

**Ví dụ:**
```typescript
Input:  { customerPhone: '0987654321', email: 'test@example.com', password: 'secret123' }
Output: { customerPhone: '***21', email: 'te***@example.com', password: '[REDACTED]' }
```

---

### ✅ 7. Escape Email HTML (Priority 7)

**Vấn đề:** Interpolation trực tiếp `${customerName}`, `${notes}` trong email HTML → HTML injection.

**Khắc phục:**
- File: `lib/email-service.ts`
- Thêm hàm `escape()` để encode `&`, `<`, `>`, `"`, `'`
- Áp dụng cho tất cả biến user-generated: `customerName`, `staffName`, `notes`, `customerPhone`, `customerEmail`, `services[].name`

**Code:**
```typescript
const escape = (s: string) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
```

---

## 🛡️ Các Vấn Đề Chưa Khắc Phục (Yêu Cầu Hành Động Thủ Công)

### 🔴 Critical: Rotate Secrets

**Vấn đề:**
- `.env` chứa `NEXTAUTH_SECRET` và DB password trong repo
- `docker/mysql/mysql.env` dùng password yếu `12345678`

**Hành động cần thiết:**
1. Đổi `DATABASE_PASSWORD` trong `.env` thành giá trị mạnh (16+ ký tự random)
2. Tạo `NEXTAUTH_SECRET` mới:
   ```bash
   openssl rand -base64 32
   ```
3. Cập nhật `docker/mysql/mysql.env` với password mới
4. Kiểm tra `.gitignore` đã ignore `.env*` và `docker/mysql/mysql.env`
5. Nếu đã commit secrets, xóa khỏi lịch sử Git (dùng `git filter-repo` hoặc tạo repo mới)
6. Production: dùng secret manager (Vercel Environment Variables, AWS Secrets Manager, 1Password, v.v.)

---

### 🟡 Medium: Triển Khai OTP/Session Cho Khách Hàng

Thư mục `app/api/otp` đang trống. Để tăng cường bảo mật tra cứu/hủy lịch:

**Gợi ý thiết kế:**
1. `POST /api/otp/request`: nhận `phone`, tạo OTP 6 số, lưu Redis/DB (TTL 5 phút), gửi SMS
2. `POST /api/otp/verify`: nhận `phone` + `otp`, xác thực, trả token JWT ngắn hạn (15 phút)
3. Middleware kiểm tra token cho `/api/appointments?phone=` và `/api/appointments/:id` DELETE
4. Rate limit OTP request mạnh (3 req / 30 phút / phone) để tránh spam SMS

**Lợi ích:**
- Ngăn enumeration attack trên endpoint tra cứu
- Xác thực chủ sở hữu trước khi hủy lịch
- Không cần password phức tạp cho khách

---

### 🟡 Medium: Nâng Cấp Rate Limiting Lên Redis/Upstash

In-memory limiter hiện tại:
- ✅ Đơn giản, không cần dependency
- ❌ Reset khi restart server
- ❌ Không chia sẻ giữa nhiều instance (horizontal scaling)

**Production:**
- Dùng Upstash Redis (serverless-friendly) hoặc Redis cluster
- Thư viện: `@upstash/ratelimit` hoặc `ioredis` + sliding window

---

### 🟢 Low: Tối Ưu CSP

CSP hiện tại dùng `'unsafe-inline'` cho script/style (để Next.js hydration hoạt động).

**Cải thiện:**
- Dùng nonce cho inline scripts (Next.js 13+ hỗ trợ `middleware` inject nonce)
- Hash inline styles nếu tĩnh
- Di chuyển inline scripts sang external files

Tham khảo: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

---

## 📋 Checklist Trước Production

- [ ] **Rotate toàn bộ secrets** (DB password, NEXTAUTH_SECRET, API keys)
- [ ] **Xác nhận `.env` không commit** (kiểm tra lịch sử Git)
- [ ] **Cấu hình HTTPS** (Let's Encrypt hoặc cloud provider)
- [ ] **Bật HSTS** (CSP đã set, nhưng chỉ có ý nghĩa với HTTPS)
- [ ] **Rate limiting production-grade** (Redis/Upstash)
- [ ] **OTP/Session cho khách hàng** (nếu có thời gian)
- [ ] **Audit logs** cho admin actions (tạo/sửa/xóa staff, services, v.v.)
- [ ] **Backup DB định kỳ** (automated snapshots)
- [ ] **Monitoring & alerting** (Sentry errors, uptime checks)
- [ ] **Penetration testing** (nếu có ngân sách)

---

## 🧪 Kiểm Tra Các Khắc Phục

### 1. Test Cancel Endpoint Security

**Scenario 1: Không có phone**
```bash
curl -X DELETE http://localhost:3000/api/appointments/123
# Expected: 401 Unauthorized
```

**Scenario 2: Phone sai**
```bash
curl -X DELETE "http://localhost:3000/api/appointments/123?phone=9999999999"
# Expected: 403 Forbidden (nếu appointment tồn tại nhưng phone không khớp)
```

**Scenario 3: Phone đúng**
```bash
curl -X DELETE "http://localhost:3000/api/appointments/123?phone=0987654321"
# Expected: 200 OK + appointment status = cancelled
```

---

### 2. Test Rate Limiting

**Lookup abuse:**
```bash
for i in {1..12}; do
  curl "http://localhost:3000/api/appointments?phone=0987654321"
done
# Expected: First 10 succeed, 11th & 12th return 429
```

**Check headers:**
```bash
curl -I "http://localhost:3000/api/appointments?phone=0987654321"
# Expected: X-RateLimit-Remaining: 9, X-RateLimit-Reset: <seconds>
```

---

### 3. Test Security Headers

```bash
curl -I http://localhost:3000/
# Expected headers:
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=15552000; includeSubDomains; preload
```

---

### 4. Test Upload MIME Sniffing

**Giả mạo PNG:**
```bash
echo "fake png" > fake.png
curl -F "file=@fake.png" -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/upload
# Expected: 415 Unsupported file type
```

**Real PNG:**
```bash
curl -F "file=@real-image.png" -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/upload
# Expected: 200 OK + { success: true, url: "/uploads/..." }
```

---

### 5. Test Admin CSRF Protection

**Cross-origin mutation:**
```bash
curl -X POST http://localhost:3000/api/admin/services \
  -H "Origin: https://evil.com" \
  -H "Cookie: next-auth.session-token=<valid-token>" \
  -d '{"name":"Evil Service"}'
# Expected: 403 Forbidden
```

**Same-origin mutation:**
```bash
curl -X POST http://localhost:3000/api/admin/services \
  -H "Origin: http://localhost:3000" \
  -H "Cookie: next-auth.session-token=<valid-token>" \
  -d '{"name":"Valid Service"}'
# Expected: 201 Created
```

---

## 📚 Tài Liệu Tham Khảo

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#session)
- [Rate Limiting Patterns](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)

---

**Kết luận:**  
Dự án đã được bảo mật ở mức cơ bản tốt. Các lỗ hổng nghiêm trọng (cancel endpoint, rate limiting, headers, upload, CSRF, logging, email injection) đã được vá. 

**Khuyến nghị cuối:** Trước khi production, **phải rotate secrets** và cân nhắc triển khai OTP cho khách hàng. Các khắc phục khác là tốt để có, nhưng không chặn deploy.
