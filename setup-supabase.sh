#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Supabase Setup Helper Script        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ File .env.local không tồn tại!${NC}"
    echo -e "${YELLOW}📝 Tạo file .env.local từ template...${NC}"
    cp .env.local.template .env.local
    echo -e "${YELLOW}⚠️  Vui lòng cập nhật DATABASE_URL và DIRECT_URL trong .env.local${NC}"
    echo -e "${YELLOW}   Xem hướng dẫn: ./SUPABASE_SETUP.md${NC}"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env.local || grep -q "\[YOUR-PASSWORD\]" .env.local; then
    echo -e "${RED}❌ DATABASE_URL chưa được cấu hình đúng!${NC}"
    echo -e "${YELLOW}📖 Xem hướng dẫn setup: cat SUPABASE_SETUP.md${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.local đã được cấu hình${NC}"
echo ""

# Step 1: Generate migrations
echo -e "${YELLOW}📦 Bước 1: Generate migration files...${NC}"
pnpm db:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Generate migrations thất bại!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Generate migrations thành công${NC}"
echo ""

# Step 2: Run migrations
echo -e "${YELLOW}🚀 Bước 2: Apply migrations lên database...${NC}"
pnpm db:migrate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration thất bại! Kiểm tra connection string.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migrations đã apply thành công${NC}"
echo ""

# Step 3: Build
echo -e "${YELLOW}🔨 Bước 3: Build project...${NC}"
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build thất bại! Kiểm tra lỗi ở trên.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build thành công${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🎉 SETUP HOÀN TẤT! 🎉           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Next steps:${NC}"
echo "   1. Run dev server: ${GREEN}pnpm dev${NC}"
echo "   2. Test API: ${GREEN}http://localhost:3000/api/services${NC}"
echo "   3. Check Supabase: ${GREEN}https://app.supabase.com${NC}"
echo ""
