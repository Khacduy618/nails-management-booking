# Frontend/Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Kích hoạt pnpm
RUN corepack enable

# Cài đặt dependencies
# Copy file package và cài đặt dependencies vào image để tăng tốc
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

EXPOSE 3000

# Lệnh mặc định để khởi động dev server
CMD ["pnpm", "run", "dev"]
