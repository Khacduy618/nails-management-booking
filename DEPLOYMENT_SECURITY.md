# Hướng Dẫn Triển Khai Khắc Phục Bảo Mật

## 🚀 Bước 1: Cài Đặt Dependencies Mới

```bash
cd /Users/khacduy/Downloads/appointment-booking/nailsapp
pnpm install
```

Package mới đã thêm: `file-type@19.5.0` (cho MIME sniffing trong upload endpoint)

---

## 🔍 Bước 2: Xác Minh Các File Đã Thay Đổi

### Files đã chỉnh sửa:
- ✅ `app/api/appointments/[id]/route.ts` - Yêu cầu phone verification khi hủy lịch
- ✅ `app/api/appointments/route.ts` - Rate limiting cho lookup & booking
- ✅ `app/api/services/route.ts` - Rate limiting cho catalog
- ✅ `app/api/upload/route.ts` - MIME sniffing với file-type
- ✅ `components/appointment-lookup.tsx` - Client gửi phone khi cancel
- ✅ `lib/logger.ts` - Scrub PII trước khi log
- ✅ `lib/email-service.ts` - Escape HTML trong email
- ✅ `middleware.ts` - CSRF protection cho admin API
- ✅ `next.config.mjs` - Security headers (CSP, HSTS, etc.)
- ✅ `package.json` - Thêm file-type dependency

### Files mới:
- ✅ `lib/rate-limit.ts` - In-memory token bucket rate limiter
- ✅ `SECURITY_HARDENING.md` - Tài liệu chi tiết các khắc phục
- ✅ `DEPLOYMENT_SECURITY.md` - File này (hướng dẫn nhanh)

---

## ✅ Bước 3: Kiểm Tra TypeScript Errors

```bash
cd /Users/khacduy/Downloads/appointment-booking/nailsapp
pnpm tsc --noEmit
```

Không có lỗi TypeScript nào nữa. ✨

---

## 🧪 Bước 4: Test Cục Bộ

### 4.1 Khởi động dev server

```bash
pnpm dev
```

Server sẽ chạy tại `http://localhost:3000`

---

### 4.2 Test Rate Limiting

**Terminal mới:**

```bash
# Test lookup rate limit (10 req / 5 min)
for i in {1..12}; do
  echo "Request $i:"
  curl -s -w "\nHTTP Status: %{http_code}\n" \
    "http://localhost:3000/api/appointments?phone=0987654321" | head -n 5
  echo "---"
done
```

**Kết quả mong đợi:**
- Requests 1-10: HTTP 200 hoặc 404 (tùy data)
- Requests 11-12: HTTP 429 + `"Too many requests"`

---

### 4.3 Test Cancel Endpoint Security

**Tạo appointment test trước (hoặc dùng ID có sẵn):**

```bash
# Giả sử appointment ID 123 thuộc phone 0987654321
# Test 1: Không có phone param
curl -X DELETE "http://localhost:3000/api/appointments/123"
# Expected: {"success":false,"error":"Phone verification required"}

# Test 2: Phone sai
curl -X DELETE "http://localhost:3000/api/appointments/123?phone=1111111111"
# Expected: {"success":false,"error":"Not authorized to cancel this appointment"}

# Test 3: Phone đúng
curl -X DELETE "http://localhost:3000/api/appointments/123?phone=0987654321"
# Expected: {"success":true,"message":"Appointment cancelled successfully"}
```

---

### 4.4 Test Security Headers

```bash
curl -I http://localhost:3000/ 2>/dev/null | grep -E "(Content-Security-Policy|X-Frame-Options|Strict-Transport-Security)"
```

**Kết quả mong đợi:**
```
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; ...
X-Frame-Options: DENY
Strict-Transport-Security: max-age=15552000; includeSubDomains; preload
```

---

### 4.5 Test Upload MIME Sniffing

**Cần admin session token.** Login vào `/login` trước, lấy cookie `next-auth.session-token`.

```bash
# Tạo file giả mạo
echo "This is not a real image" > fake.png

# Upload (thay <SESSION_TOKEN> bằng token thực)
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" \
  -F "file=@fake.png"

# Expected: {"success":false,"error":"Unsupported file type."}
```

**Upload ảnh thật:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" \
  -F "file=@real-photo.jpg"

# Expected: {"success":true,"url":"/uploads/real-photo-abc123.jpg"}
```

---

### 4.6 Test PII Scrubbing in Logs

**Trigger error với PII:**

```bash
# POST với phone/email trong body
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "0987654321",
    "customerEmail": "test@example.com",
    "customerName": "Nguyễn Văn A",
    "notes": "Sensitive note here"
  }'
```

**Kiểm tra console/logs:**
- Phone nên hiển thị: `***21`
- Email nên hiển thị: `te***@example.com`
- Notes nên được mask hoặc redact

---

## 🔐 Bước 5: CRITICAL - Rotate Secrets (Phải làm trước Production)

### 5.1 Tạo NEXTAUTH_SECRET mới

```bash
openssl rand -base64 32
```

Copy output, cập nhật vào `.env`:

```env
NEXTAUTH_SECRET='<NEW_SECRET_HERE>'
```

---

### 5.2 Đổi Database Password

1. **Cập nhật `.env`:**
   ```env
   DATABASE_PASSWORD=<NEW_STRONG_PASSWORD>
   ```

2. **Cập nhật `docker/mysql/mysql.env`:**
   ```env
   MYSQL_ROOT_PASSWORD=<NEW_STRONG_PASSWORD>
   MYSQL_PASSWORD=<NEW_STRONG_PASSWORD>
   ```

3. **Xóa volume cũ và rebuild:**
   ```bash
   cd /Users/khacduy/Downloads/appointment-booking
   docker-compose down -v
   docker-compose up -d mysql
   ```

4. **Re-seed database:**
   ```bash
   cd nailsapp
   pnpm db:migrate
   pnpm db:seed
   ```

---

### 5.3 Kiểm Tra `.gitignore`

```bash
grep -E "^\.env|mysql\.env" nailsapp/.gitignore
```

**Kết quả mong đợi:**
```
.env*
```

**Nếu `mysql.env` chưa được ignore, thêm vào `.gitignore`:**

```bash
echo "docker/mysql/mysql.env" >> .gitignore
```

---

### 5.4 Verify Không Commit Secrets

```bash
git log --all --full-history -- "**/.env" "**/*.env" "**/mysql.env"
```

**Nếu có kết quả:** Secrets đã bị commit trong lịch sử → **cần làm sạch Git history** hoặc tạo repo mới.

**Làm sạch history (nguy hiểm, backup trước):**
```bash
# Cài git-filter-repo
brew install git-filter-repo  # macOS

# Xóa file khỏi toàn bộ lịch sử
git filter-repo --path nailsapp/.env --invert-paths
git filter-repo --path docker/mysql/mysql.env --invert-paths

# Force push (nếu đã push)
git push origin --force --all
```

**Hoặc đơn giản hơn:** Tạo repo mới, copy code (không copy `.git`), commit mới.

---

## 🚢 Bước 6: Chuẩn Bị Production

### 6.1 Vercel / Netlify

1. **Environment Variables:**
   - `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
   - `NEXTAUTH_SECRET` (mới tạo)
   - `NEXTAUTH_URL` (URL production, ví dụ `https://yourapp.com`)
   - `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` (nếu dùng Sentry)

2. **Database:**
   - Chuyển từ local MySQL sang managed DB (PlanetScale, Railway, AWS RDS, etc.)
   - Update `DATABASE_*` env vars

3. **HTTPS:**
   - Vercel/Netlify tự động cấp SSL
   - HSTS header sẽ có ý nghĩa

4. **Rate Limiting:**
   - Nâng cấp `lib/rate-limit.ts` lên Upstash Redis:
     ```bash
     pnpm add @upstash/ratelimit @upstash/redis
     ```
   - Thay thế in-memory limiter bằng `Ratelimit` từ Upstash

---

### 6.2 Docker Production

1. **Build image:**
   ```bash
   cd /Users/khacduy/Downloads/appointment-booking/nailsapp
   docker build -t nailsapp:latest .
   ```

2. **Run với secrets từ env file:**
   ```bash
   docker run -d \
     --name nailsapp \
     -p 3000:3000 \
     --env-file .env.production \
     nailsapp:latest
   ```

3. **Nginx reverse proxy:**
   - Cấu hình SSL termination (Let's Encrypt)
   - Forward `/api` và `/_next` đến container
   - Add security headers nếu chưa có trong Next.js

---

## 📊 Bước 7: Monitoring & Alerting

### 7.1 Sentry Setup

1. Tạo project tại [sentry.io](https://sentry.io)
2. Cập nhật `.env`:
   ```env
   SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
   SENTRY_ORG=your-org
   SENTRY_PROJECT=nailsapp
   ```
3. Verify errors được gửi:
   ```bash
   # Trigger test error
   curl http://localhost:3000/api/appointments/999999999
   ```
   Kiểm tra dashboard Sentry

---

### 7.2 Uptime Monitoring

- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com)
- [BetterStack](https://betterstack.com)

Cấu hình ping `/api/health` mỗi 5 phút, alert nếu down.

---

## 🎯 Checklist Cuối Cùng

- [ ] `pnpm install` hoàn tất không lỗi
- [ ] TypeScript compile sạch (`pnpm tsc --noEmit`)
- [ ] Rate limiting hoạt động (test với curl)
- [ ] Cancel endpoint yêu cầu phone
- [ ] Security headers xuất hiện trong response
- [ ] Upload reject file giả mạo
- [ ] Logs không chứa PII raw
- [ ] Email không bị HTML injection
- [ ] `NEXTAUTH_SECRET` đã rotate
- [ ] DB password mạnh (16+ chars)
- [ ] `.env` và `mysql.env` trong `.gitignore`
- [ ] Secrets không có trong Git history
- [ ] Sentry integration hoạt động
- [ ] Production DB đã setup (PlanetScale/Railway/AWS)
- [ ] HTTPS enabled (Vercel auto / Let's Encrypt manual)
- [ ] Uptime monitor đã cấu hình

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. **Check logs:** `pnpm dev` sẽ hiển thị console logs
2. **TypeScript errors:** `pnpm tsc --noEmit`
3. **Rate limiter debug:** Set `DEBUG_BOOKING=true` trong `.env`
4. **Database issues:** Verify `docker-compose ps` và connection string

Xem chi tiết trong `SECURITY_HARDENING.md` để hiểu cơ chế từng khắc phục.

---

**🎉 Hoàn thành!** Dự án đã sẵn sàng triển khai với bảo mật cơ bản tốt.
