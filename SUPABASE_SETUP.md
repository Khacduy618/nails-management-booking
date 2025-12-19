# 🚀 HƯỚNG DẪN SETUP SUPABASE CHO DỰ ÁN

## Bước 1: Tạo Project Supabase

1. Truy cập: https://app.supabase.com
2. Click **"New Project"**
3. Điền thông tin:
   - **Name**: `nails-booking` (hoặc tên bạn thích)
   - **Database Password**: Tạo password mạnh (lưu lại!)
   - **Region**: `Southeast Asia (Singapore)` hoặc gần Việt Nam nhất
   - **Plan**: Free tier (đủ dùng)
4. Click **"Create new project"** và đợi ~2 phút

## Bước 2: Lấy Connection Strings

1. Trong project vừa tạo, vào **Settings** (góc trái)
2. Click **Database**
3. Scroll xuống phần **"Connection string"**
4. Chọn tab **"Connection pooling"** (quan trọng!)
5. Copy connection string, có dạng:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
6. **QUAN TRỌNG**: Replace `[YOUR-PASSWORD]` bằng password bạn đã tạo ở Bước 1

## Bước 3: Cập nhật `.env.local`

Mở file `/Users/khacduy/Downloads/appointment-booking/nailsapp/.env.local` và thay thế toàn bộ nội dung bằng:

```bash
# ========================================
# SUPABASE DATABASE
# ========================================

# Connection pooling (port 6543 - for app runtime)
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (port 5432 - for migrations)
DIRECT_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# ========================================
# NEXTAUTH
# ========================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=QAY0TwyTCy0ojS9tBQti8Z15rkSjw0Gi+NMn+/i63mo=

# ========================================
# OPTIONAL
# ========================================
DEBUG_BOOKING=false
NEXT_PUBLIC_API_URL=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

**Lưu ý**: 
- Thay `xxxxx` bằng project ref của bạn (copy từ connection string)
- Thay `[YOUR-PASSWORD]` bằng password database
- Giữ nguyên `NEXTAUTH_SECRET` hiện tại

## Bước 4: Generate & Run Migrations

```bash
cd /Users/khacduy/Downloads/appointment-booking/nailsapp

# 1. Generate migration files từ schema
pnpm db:generate

# 2. Run migrations lên Supabase
pnpm db:migrate

# 3. (Optional) Seed data nếu cần
# pnpm db:seed
```

## Bước 5: Build & Test

```bash
# Build project
pnpm build

# Run dev server
pnpm dev
```

## ✅ Kiểm tra kết nối

Sau khi chạy `pnpm dev`, test API:

1. **Health check**: http://localhost:3000/api/services
2. **Check database**: Vào Supabase Dashboard > Table Editor để xem tables đã được tạo

## 🔍 Troubleshooting

### Lỗi: "password authentication failed"
- Kiểm tra lại password trong `.env.local` có đúng không
- Password cần URL encode nếu có ký tự đặc biệt: `@` → `%40`, `#` → `%23`

### Lỗi: "relation does not exist"
- Chưa chạy migrations: `pnpm db:migrate`

### Lỗi: "too many connections"
- Đảm bảo dùng **Connection pooling** (port 6543) cho `DATABASE_URL`
- Chỉ dùng direct connection (port 5432) cho migrations

## 📊 Monitoring

- **Supabase Dashboard**: https://app.supabase.com/project/_/database/tables
- **View logs**: Project > Logs > Postgres Logs
- **Query editor**: Project > SQL Editor

## 🎯 Next Steps

Sau khi setup xong:
1. Import data cũ từ MySQL (nếu có)
2. Test các API endpoints
3. Deploy lên Vercel/Railway với DATABASE_URL từ Supabase
