# Appointment Booking Client

Next.js 15 frontend for the appointment booking system. It provides the public booking flow (4-step form) and an admin workspace to manage services, staff, and appointments. All data access happens through the Drizzle-based API routes in this app or any external API specified via `NEXT_PUBLIC_API_URL`.

## Tech Stack

- Next.js 15 (App Router, React 19, TypeScript)
- Tailwind CSS + shadcn/ui for UI primitives
- Drizzle ORM + MySQL driver for server-side data access
- Vitest + Testing Library for component tests
- Playwright for end-to-end smoke tests

## Prerequisites

- Node.js 20+
- pnpm 10 (workspace root already pins the exact version in `packageManager`)
- MySQL database (local Docker compose or any hosted instance)

## Environment Variables

Create `nailsapp/.env` (or re-use the repo root `.env`) with at least:

| Name | Description |
| ---- | ----------- |
| `NEXT_PUBLIC_API_URL` | Base URL for public API requests (defaults to `http://localhost:3000/api/` for built-in routes). |
| `DATABASE_HOST` | MySQL host used by Drizzle routes. |
| `DATABASE_PORT` | MySQL port, e.g. `3306`. |
| `DATABASE_USER` | Database user. |
| `DATABASE_PASSWORD` | Password for the database user. |
| `DATABASE_NAME` | Schema that stores services, staff, appointments, etc. |
| `NEXTAUTH_SECRET` | Secret key for NextAuth JWT/middleware (generate via `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Public base URL when running in production (e.g. `https://admin.example.com`). |
| `SENTRY_DSN` | Server DSN for Sentry error tracking (leave empty to disable). |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional DSN exposed to the nailsapp bundle for browser error tracking. |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Optional; used by the Sentry Webpack plugin for source map uploads. |


EZ7BQLLSBVM8NJYT2MWSXUWX

If you run the Laravel backend instead of the Next.js API routes, point `NEXT_PUBLIC_API_URL` to that service (e.g. `http://localhost:3000/api/`).

## Installation & Local Development

```bash
pnpm install        # install workspace dependencies
pnpm dev            # start the Next.js dev server on http://localhost:3000
```

Database utilities (requires the env vars above):

```bash
pnpm db:generate    # regenerate Drizzle SQL based on schema definitions
pnpm db:push        # sync schema to the database
pnpm db:migrate     # run SQL migrations inside ./drizzle
pnpm db:seed        # seed demo data (ensure .env is present)
```

## Testing

| Command | Description |
| ------- | ----------- |
| `pnpm test` / `pnpm test:unit` | Run Vitest in CI mode (jsdom + Testing Library). |
| `pnpm test:watch` | Watch mode for Vitest during development. |
| `pnpm test:e2e` | Run Playwright smoke tests (requires the dev server and `npx playwright install`). |

Recommended workflow:

1. `pnpm test:watch` while working on UI/stateful logic to catch regressions quickly.
2. `pnpm dev` in one terminal, then `pnpm test:e2e` in another to verify top-level flows before pushing. The Playwright base URL defaults to `http://localhost:3000`; override via `PLAYWRIGHT_BASE_URL` if needed.

## Project Structure

```
nailsapp/
├─ app/                # Next.js routes (public + admin + API)
├─ components/         # Reusable UI + booking/admin flows
├─ db/                 # Drizzle schema & connection
├─ hooks/, lib/, types/
├─ public/             # Static assets & uploads
├─ scripts/            # Drizzle migration runner, schema helpers
└─ tests/              # Playwright specs
```

## Notes

- The admin UI expects seed data for services/staff. After `pnpm db:seed`, refresh the dashboard to see demo rows.
- File uploads land in `public/uploads`. Make sure the folder exists (the upload API creates it automatically in production builds).
- When pointing to the Laravel backend, keep the API responses aligned with the types in `nailsapp/types/index.ts` to avoid runtime casting.
- Admin area now uses NextAuth credentials login (email + password from the `users` table). Only users with role `admin` or `staff` can sign in: admins see every module, while staff is limited to lịch hẹn/lịch làm. Update seeds accordingly and remember to store hashed passwords (`bcrypt`).
- Upload API hiện yêu cầu tài khoản admin/staff, giới hạn định dạng (PNG/JPEG/WebP/GIF/MP4) và kích thước (ảnh ≤ 5MB, video ≤ 50MB). Điều này giúp ngăn abuse và thuận lợi hơn khi scale sang storage bên ngoài.
- Booking flow hỗ trợ tự động phân công nhân viên, hiển thị số nhân sự rảnh theo khung giờ, và cung cấp trang `/lookup` để khách chủ động tra cứu lịch theo số điện thoại.
- Sentry logging đã được bật (xem `sentry.*.config.ts`). Các API response trả về `error.code`/`error.message` nhất quán để frontend hiển thị đúng và trace lỗi dễ dàng.



# Tổng Quan Dự Án (nailsapp)

## Thành phần hiện có
- **Landing page** với Hero, dịch vụ, testimonial, đội ngũ và CTA tới đặt lịch/tra cứu (`nailsapp/components/hero-section.tsx`).
- **Booking Form 4 bước** (dịch vụ → ngày/giờ → nhân viên → thông tin) dùng Drizzle API routes để lấy dữ liệu và kiểm tra nhân viên rảnh (`nailsapp/components/booking-form.tsx`).
- **Trang admin** quản lý dịch vụ và lịch hẹn: lọc, phân trang, CRUD, xem chi tiết và cập nhật trạng thái (`nailsapp/components/admin/services-management.tsx`, `.../appointments-management.tsx`).
- **API nội bộ** cho admin appointments (lọc nâng cao, phân trang, PUT/DELETE) (`nailsapp/app/api/admin/appointments/route.ts`, `[id]/route.ts`).
- **Tài liệu & test cơ bản**: `nailsapp/README.md`, Vitest + Playwright khởi động (`nailsapp/components/__tests__/booking-form.test.tsx`, `nailsapp/tests/basic.spec.ts`).

## Thiếu sót chính
2. **Không có auth/role** cho admin; dashboard public -> rủi ro bảo mật. **Done**
3. **Thiếu migrations Drizzle** (`./drizzle` trống) nên không thể `pnpm db:migrate`. **Done**
4. **Upload file trực tiếp vào `public/uploads`** không giới hạn và không xác thực ⇒ khó scale + nguy hiểm. **Done**
5. **Test coverage mỏng** (chỉ 1 unit + 1 e2e smoke), chưa kiểm tra toàn bộ luồng booking/admin/API. **Done**
## Cải tiến cần thiết
1. **Hoàn thiện Next API**: viết lại GET/POST cho booking và staff availability, thêm kiểm tra xung đột, transaction, mã lỗi rõ ràng, response thống nhất với `nailsapp/types`.  **Done**
2. **Bảo vệ trang admin**: tích hợp auth (NextAuth/Clerk), middleware kiểm tra role, khóa `/app/admin/**`.  **Done**
3. **Quy trình dữ liệu**: tạo thư mục `drizzle/` với migrations, script seed thực sự, hỗ trợ đồng bộ env staging/prod. Thêm job gửi thông báo và nhắc lịch.
4. **Nâng UX booking**: tiếp tục cải thiện auto-assign staff, hiển thị lịch trống chi tiết hơn, và mở rộng trải nghiệm tra cứu `/lookup` (ví dụ cho phép hủy hoặc đặt lại).
5. **Giám sát & logging**: tích hợp Sentry/Axiom, chuẩn hóa lỗi front-end theo mã trả về, log đầy đủ.  **Done**

## Chuẩn bị Production & Scale
- **Hạ tầng**: deploy Next.js trên Vercel/Docker; dùng MySQL managed (PlanetScale/RDS) với pool tối ưu. 
- **Caching**: SWR/React Query + ISR cho trang public; cache danh mục/dịch vụ trên CDN; API booking vẫn động.
- **Tránh overbooking**: dùng transaction/Redis lock để khóa slot; chuyển upload sang S3/Supabase với signed URL.
- **Testing & CI**: mở rộng Vitest (hooks/libs), viết Playwright full flow booking + admin, chạy trong CI trước deploy; thêm load test (k6/Artillery).
- **Observability**: theo dõi response time, error rate, pool usage; bật Vercel Analytics + log drain, đặt alert khi 5xx tăng.

Thực hiện các hạng mục này sẽ giúp hệ thống book lịch nails hoạt động an toàn, chuẩn bị được cho lưu lượng lớn và deploy ổn định lên production.



## NextAuth JWT Flow

# User submits credentials

- **-** Admin/staff mở /admin/login, nhập email & password. next-auth gọi authorize trong Credentials provider (nailsapp/lib/auth.ts).
Code truy vấn users bằng Drizzle, kiểm tra role + bcrypt. Nếu hợp lệ, hàm authorize trả về object { id, name, email, role }.
JWT issued

- **-** Vì session.strategy = "jwt", NextAuth tạo một JSON Web Token:
Payload chứa thông tin user (sub, name, email) cộng với trường bổ sung bạn set trong callback jwt (token.id, token.role).
- **-** Token được ký bằng NEXTAUTH_SECRET để chống giả mạo.
- **-** Token được gửi lại cho trình duyệt trong cookie next-auth.session-token (hoặc __Secure-next-auth.session-token nếu HTTPS).
Subsequent requests

- **-** Trình duyệt tự đính kèm cookie JWT cho mọi request cùng domain.
  + **-** Server-side: middleware.ts gọi getToken({ req }) → NextAuth đọc cookie, giải mã JWT, kiểm tra chữ ký và trả payload (role, id). Dựa vào đó ta redirect nhân viên khỏi khu vực admin getServerSession(authOptions) trong app/admin/layout.tsx làm điều tương tự khi render server component để chắn người chưa login.
  + **-** client-side React: SessionProvider đọc cookie, gọi /api/auth/session (NextAuth endpoint) → endpoint giải JWT rồi trả session JSON. useSession() hook tiêu thụ dữ liệu đó để hiển thị tên/role, logout, v.v.

# Logout

- **-** Gọi signOut() xóa cookie JWT. Vì token không lưu DB, logout chỉ là xóa cookie + option redirect, không cần thao tác database.

# Refresh / expiry

- **-** JWT có exp mặc định ~30 ngày (có thể config). Mỗi lần session endpoint được hit, NextAuth kiểm tra token; nếu hết hạn sẽ yêu cầu login lại. Không có server state nên không thể revoke thủ công trừ khi đổi NEXTAUTH_SECRET hoặc chuyển sang chiến lược database.


# Tóm tắt

- **-** JWT sống trong cookie, không ghi xuống DB.
- **-** Middleware + getServerSession đều đọc token này để enforce role.
- **-** SessionProvider chỉ giúp client-side truy cập thông tin token đã được giải.
- **-** Admin/staff phải có user record + password hash; khách không đụng tới JWT vì họ không login.
