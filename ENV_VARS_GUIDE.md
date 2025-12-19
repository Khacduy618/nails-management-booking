# ENVIRONMENT VARIABLES QUICK REFERENCE

## Development (Local)
File: `.env.local`
```
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@db.jagnxjcnzphdoydapere.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxxx:PASSWORD@db.jagnxjcnzphdoydapere.supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=QAY0TwyTCy0ojS9tBQti8Z15rkSjw0Gi+NMn+/i63mo=
```

## Production (Vercel)

### Required Variables (MUST SET)

1. **DATABASE_URL** (Connection Pooling)
   ```
   postgresql://postgres.jagnxjcnzphdoydapere:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   - Get from: https://app.supabase.com/project/_/settings/database
   - Copy from "Connection pooling" tab (port 6543)
   - Replace PASSWORD with your database password

2. **NEXTAUTH_URL**
   ```
   https://your-domain.vercel.app
   ```
   - Replace `your-domain` with your actual Vercel domain
   - Or use custom domain if configured

3. **NEXTAUTH_SECRET**
   ```
   (generate 32+ character random string)
   ```
   - Generate: https://generate-secret.vercel.app/32
   - Or: `openssl rand -base64 32`
   - Must be different from dev!

### Optional Variables

- **NEXT_PUBLIC_API_URL** = `https://your-domain.vercel.app/api`
- **SENTRY_DSN** = Your Sentry project DSN
- **NEXT_PUBLIC_SENTRY_DSN** = Public Sentry DSN
- **SENTRY_ENVIRONMENT** = `production`
- **DEBUG_BOOKING** = `false`

## How to Set Variables in Vercel

### Via Dashboard (Easiest)
1. Vercel Dashboard → Select Project
2. Settings → Environment Variables
3. Add each variable with scope = "Production"
4. Save & Re-deploy

### Via Vercel CLI
```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
```

### Via vercel.json (Optional)
Currently configured in `vercel.json`

## Important Notes

✅ **DO:**
- Use Connection Pooling URL (port 6543) for DATABASE_URL
- Generate unique NEXTAUTH_SECRET for production
- Keep passwords secure (never commit to git)
- Use HTTPS URLs for NEXTAUTH_URL

❌ **DON'T:**
- Use dev database on production
- Reuse dev NEXTAUTH_SECRET
- Hardcode passwords in code
- Share DATABASE_URL publicly

## Testing Connection

After deploying:
```bash
# Test API
curl https://your-domain.vercel.app/api/services

# Check env vars loaded
curl https://your-domain.vercel.app/api/health

# View logs
vercel logs your-project-name
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `DATABASE_URL is not defined` | Add to Vercel env vars, redeploy |
| `NEXTAUTH_SECRET is invalid` | Must be 32+ chars, regenerate |
| `Failed to connect to database` | Check password, connection string, IP whitelist |
| `Timezone issues` | Already set in code, no action needed |

## Redeployment

When you push changes:
```bash
git push origin main
# Vercel auto-deploys (if using GitHub integration)

# Or manual:
vercel --prod
```
