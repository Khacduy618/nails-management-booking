# 🚀 DEPLOYMENT GUIDE: VERCEL + SUPABASE

## Bước 1: Chuẩn bị Supabase

### Lấy Connection String cho Vercel:
1. Vào https://app.supabase.com/project/_ → Settings → Database
2. Copy "Connection pooling" string (port 6543)
3. Sẽ có dạng:
   ```
   postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

## Bước 2: Deploy lên Vercel

### Option A: Deploy via CLI

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
cd /Users/khacduy/Downloads/appointment-booking/nailsapp
vercel

# 4. Follow prompts:
#    - Link to existing Vercel project or create new
#    - Environment variables setup (see below)
```

### Option B: Deploy via GitHub (Recommended)

1. **Push code to GitHub**
   ```bash
   cd /Users/khacduy/Downloads/appointment-booking
   git remote add origin https://github.com/khacduy618/nails-management-booking.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Vào https://vercel.com/new
   - Click "Import Git Repository"
   - Chọn `appointment-booking` hoặc `nails-management-booking`
   - Root directory: `nailsapp`
   - Click "Deploy"

## Bước 3: Setup Environment Variables trên Vercel

### Cách 1: Via Dashboard (Easy)

1. Vào Vercel Project Settings → Environment Variables
2. Click "Add Environment Variable"
3. Thêm các biến sau:

| Key | Value | Scope |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Production |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Production |
| `NEXTAUTH_SECRET` | `your-random-string-32-chars` | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `https://your-domain.vercel.app/api` | Production |

**QUAN TRỌNG:**
- ✅ Replace `your-domain` với domain thực (auto: `[project-name].vercel.app`)
- ✅ Replace `[PASSWORD]` với Supabase password
- ✅ `NEXTAUTH_SECRET` phải >= 32 characters, tạo mới không dùng dev

### Cách 2: Via Vercel CLI

```bash
vercel env add DATABASE_URL
# Paste: postgresql://postgres.xxxxx:[PASSWORD]@...

vercel env add NEXTAUTH_URL
# Paste: https://your-domain.vercel.app

vercel env add NEXTAUTH_SECRET
# Paste: random-32-char-string

vercel env add NEXT_PUBLIC_API_URL
# Paste: https://your-domain.vercel.app/api
```

### Cách 3: Via Code (vercel.json)

Đã tạo file `vercel.json` - có thể sửa nếu cần.

## Bước 4: Verify Deployment

Sau khi Vercel deploy thành công:

1. **Check build logs**
   ```
   https://vercel.com/dashboard/project-name/deployments
   ```

2. **Test API**
   ```bash
   curl https://your-domain.vercel.app/api/services
   ```

3. **Login test**
   - Vào https://your-domain.vercel.app/login
   - Test login flow

4. **Check Supabase**
   - Vào https://app.supabase.com → Table Editor
   - Xem data có được insert không

## ⚠️ Lỗi thường gặp

### "DATABASE_URL is not defined"
- Kiểm tra env var đã set trong Vercel dashboard không
- Đảm bảo "Scope" = Production (nếu production environment)
- Redeploy sau khi thêm env

### "Failed to connect to database"
- Kiểm tra connection string có đúng không
- Test connection local: `pnpm db:migrate`
- Check Supabase IP whitelist (nếu có)

### "NEXTAUTH_SECRET is invalid"
- Phải >= 32 characters
- Không dùng dev secret trên production
- Generate mới: https://generate-secret.vercel.app/32

### "Timezone not set"
- Đã cấu hình trong `db/index.js` tự động
- Nếu cần, thêm env: `TZ=Asia/Ho_Chi_Minh`

## 📊 Production Checklist

- [ ] Supabase project created & configured
- [ ] Connection pooling string copied to Vercel
- [ ] DATABASE_URL set in Vercel env
- [ ] NEXTAUTH_URL updated (production domain)
- [ ] NEXTAUTH_SECRET set (32+ chars)
- [ ] Build passes locally: `pnpm build`
- [ ] Deployed to Vercel
- [ ] API endpoints tested
- [ ] Database connections working
- [ ] (Optional) Setup Sentry monitoring
- [ ] (Optional) Setup custom domain

## 🔄 Update Deployment

Sau khi push code mới:
```bash
git add .
git commit -m "feat: update PostgreSQL migration"
git push origin main
```

Vercel tự động deploy!

## 🆘 Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Auth: https://next-auth.js.org
