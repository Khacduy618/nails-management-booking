# 📋 DEPLOYMENT CHECKLIST & ENVIRONMENT VARIABLES

## ✅ Files đã chuẩn bị:

```
nailsapp/
├── .env.local                      # Development (Supabase)
├── .env.production                 # Production template
├── .env                            # Placeholder for scripts
├── vercel.json                     # Vercel config
├── deploy.sh                       # Helper script
├── VERCEL_DEPLOYMENT.md            # Full deployment guide
├── ENV_VARS_GUIDE.md              # Quick reference
├── SUPABASE_SETUP.md              # Supabase setup guide
└── lib/time-utils.ts              # Vietnam timezone utilities
```

---

## 🎯 QUICK START FOR DEPLOYMENT

### 1. Prepare Supabase Connection String

**Get from:** https://app.supabase.com/project/_/settings/database

Copy connection pooling string (port 6543):
```
postgresql://postgres.jagnxjcnzphdoydapere:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2. Create Vercel Project

Option A: CLI
```bash
vercel
```

Option B: Dashboard
- https://vercel.com/new
- Import GitHub repo
- Root directory: `nailsapp`
- Click Deploy

### 3. Set Environment Variables in Vercel

Go to: **Project Settings → Environment Variables → Add Variable**

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://postgres.jagnxjcnzphdoydapere:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | ✅ |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | ✅ |
| `NEXTAUTH_SECRET` | Generate: https://generate-secret.vercel.app/32 | ✅ |
| `NEXT_PUBLIC_API_URL` | `https://your-domain.vercel.app/api` | ⭕ |

**Scope:** Production

### 4. Deploy

```bash
# Push to GitHub (auto-deploy)
git push origin main

# OR manual Vercel deploy
vercel --prod
```

---

## 📝 ENVIRONMENT VARIABLES SUMMARY

### Local Development (`.env.local`)
- ✅ `DATABASE_URL` - Supabase pooling (port 6543)
- ✅ `DIRECT_URL` - Supabase direct (port 5432, for migrations)
- ✅ `NEXTAUTH_URL=http://localhost:3000`
- ✅ `NEXTAUTH_SECRET` - Dev secret

### Production (Vercel Dashboard)
- ✅ `DATABASE_URL` - Supabase pooling (port 6543)
- ❌ NO DIRECT_URL (Vercel doesn't need it)
- ✅ `NEXTAUTH_URL=https://your-domain.vercel.app`
- ✅ `NEXTAUTH_SECRET` - **NEW** production secret (32+ chars)

### Current Supabase Setup
```
Project: db.jagnxjcnzphdoydapere
Region: Southeast Asia (Singapore)
Timezone: Asia/Ho_Chi_Minh (UTC+7)
Tables: 11 (ready)
Enums: 6 (ready)
```

---

## 🚀 DEPLOYMENT STEPS (Detailed)

### Step 1: Ensure Build Passes Locally
```bash
cd nailsapp
pnpm build
```

### Step 2: Create/Link Vercel Project
```bash
# Option A: CLI
vercel

# Option B: GitHub (recommended for auto-deployments)
# 1. Push code: git push origin main
# 2. Visit: https://vercel.com/new
# 3. Import repo
# 4. Select root: nailsapp
# 5. Click Deploy
```

### Step 3: Set Environment Variables in Vercel Dashboard

**URL:** https://vercel.com/dashboard/[project-name]/settings/environment-variables

Add these variables:

1. **DATABASE_URL**
   - Scope: Production
   - Value: `postgresql://postgres.jagnxjcnzphdoydapere:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

2. **NEXTAUTH_URL**
   - Scope: Production
   - Value: `https://[your-domain].vercel.app` (or custom domain)

3. **NEXTAUTH_SECRET**
   - Scope: Production, Preview, Development
   - Value: Generate new at https://generate-secret.vercel.app/32

4. **NEXT_PUBLIC_API_URL** (Optional)
   - Scope: Production
   - Value: `https://[your-domain].vercel.app/api`

### Step 4: Trigger Deployment

```bash
# If using GitHub integration:
git push origin main
# Vercel auto-deploys

# If using Vercel CLI:
vercel --prod
```

### Step 5: Verify Deployment

```bash
# Test API
curl https://[your-domain].vercel.app/api/services

# Check logs
vercel logs [project-name]

# Check Supabase data
# Visit: https://app.supabase.com/project/_/editor
```

---

## ⚠️ Common Issues & Solutions

### "DATABASE_URL is not defined"
- ✅ Add `DATABASE_URL` to Vercel env vars
- ✅ Make sure Scope includes "Production"
- ✅ Click "Redeploy" after adding

### "NEXTAUTH_SECRET is invalid"
- ✅ Generate new at https://generate-secret.vercel.app/32
- ✅ Must be 32+ characters
- ✅ Don't reuse dev secret

### "Failed to connect to database"
- ✅ Check password is correct
- ✅ Verify connection string format
- ✅ Ensure port 6543 (pooling)

### "Timezone issues"
- Already configured in `db/index.js`
- No action needed

---

## 📚 HELPFUL COMMANDS

```bash
# Build locally
pnpm build

# Run dev server
pnpm dev

# Check env vars
vercel env list

# View Vercel logs
vercel logs [project-name]

# Redeploy
vercel --prod

# Remove deployment
vercel rm [project-name]
```

---

## 🔗 USEFUL LINKS

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Env Vars:** https://vercel.com/docs/environment-variables
- **Supabase Dashboard:** https://app.supabase.com
- **Supabase Connection:** https://app.supabase.com/project/_/settings/database
- **NextAuth Docs:** https://next-auth.js.org
- **Generate Secret:** https://generate-secret.vercel.app/32

---

## ✨ Post-Deployment

After successful deployment:

1. ✅ Test all API endpoints
2. ✅ Check database connections
3. ✅ Verify authentication works
4. ✅ Monitor logs for errors
5. ✅ Setup custom domain (if needed)
6. ✅ Enable HTTPS (auto on Vercel)
7. ⭕ Setup Sentry monitoring (optional)

---

## 🎯 Summary

| Step | File | Action |
|------|------|--------|
| 1 | Local | `pnpm build` ✅ |
| 2 | Supabase | Copy connection string |
| 3 | Vercel | Create project |
| 4 | Vercel | Add env vars (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET) |
| 5 | GitHub | `git push origin main` |
| 6 | Vercel | Auto-deploy ✅ |
| 7 | Browser | Test https://[your-domain].vercel.app |

**Estimated time:** 10-15 minutes

Ready to deploy! 🚀
