#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Vercel Deployment Helper Script     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if in nailsapp directory
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Không tìm thấy vercel.json!${NC}"
    echo -e "${YELLOW}   Chạy script từ thư mục: nailsapp${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 PRE-DEPLOYMENT CHECKLIST${NC}"
echo ""

# Check 1: Build
echo -n "🔨 Building project... "
if pnpm build > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo -e "${RED}Build failed! Fix errors before deploying.${NC}"
    exit 1
fi

# Check 2: Environment variables
echo -n "🔑 Checking .env.local... "
if [ -f ".env.local" ] && grep -q "DATABASE_URL" .env.local; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️${NC} (Optional for local testing)"
fi

# Check 3: Git status
echo -n "📦 Checking Git status... "
if git status --short | grep -q .; then
    echo -e "${YELLOW}⚠️ Uncommitted changes${NC}"
    echo -e "${YELLOW}   Stage changes: git add .${NC}"
    echo -e "${YELLOW}   Commit: git commit -m 'msg'${NC}"
else
    echo -e "${GREEN}✅${NC} (All committed)"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      DEPLOYMENT INSTRUCTIONS          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Option 1: Deploy via Vercel CLI${NC}"
echo "   $ vercel deploy"
echo ""

echo -e "${YELLOW}Option 2: Deploy via GitHub (Recommended)${NC}"
echo "   1. Push to GitHub:"
echo "      $ git push origin main"
echo "   2. Vercel auto-deploys"
echo ""

echo -e "${YELLOW}Option 3: Setup Environment Variables${NC}"
echo "   1. Go to: https://vercel.com/dashboard"
echo "   2. Select project"
echo "   3. Settings → Environment Variables"
echo "   4. Add these variables:"
echo ""
echo -e "${BLUE}   ┌─ Required${NC}"
echo "   │"
echo "   ├─ DATABASE_URL"
echo "   │  postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
echo "   │"
echo "   ├─ NEXTAUTH_URL"
echo "   │  https://your-domain.vercel.app"
echo "   │"
echo "   ├─ NEXTAUTH_SECRET"
echo "   │  (32+ random characters)"
echo "   │"
echo -e "${BLUE}   └─ Optional${NC}"
echo "      ├─ NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api"
echo "      └─ SENTRY_DSN=... (if using Sentry)"
echo ""

echo -e "${GREEN}📖 Full guide: cat VERCEL_DEPLOYMENT.md${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Deploy now? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Starting deployment...${NC}"
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not installed${NC}"
        echo -e "${YELLOW}   Install: npm i -g vercel${NC}"
        exit 1
    fi
    
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment started!${NC}"
        echo -e "${YELLOW}   Check progress: https://vercel.com/dashboard${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
    fi
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
fi
