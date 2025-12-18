# Hướng Dẫn AI Copilot cho Hệ Thống Đặt Lịch Nails Manager

## Tổng Quan Dự Án

**Tech Stack:**
- **Frontend**: Next.js 15 (React 19, TypeScript, Tailwind CSS, shadcn/ui)
- **Backend**: Next.js API Routes (Drizzle ORM) hoặc tùy chọn Laravel backend
- **Database**: MySQL (qua Drizzle hoặc Laravel Eloquent)
- **Xác thực**: NextAuth JWT với credentials (email/password)
- **Testing**: Vitest + React Testing Library (unit), Playwright (e2e)
- **Hạ tầng**: Docker Compose (dev), Sentry tùy chọn để theo dõi lỗi

**Mục đích chính**: Hệ thống đặt lịch hẹn cho các dịch vụ nail/beauty với dashboard admin, form đặt lịch 4 bước, và tra cứu lịch hẹn.

---

## Kiến Trúc & Luồng Dữ Liệu

### Hợp Đồng Frontend-Backend

Hệ thống duy trì **tính nhất quán kiểu dữ liệu** giữa frontend và backend qua `client/types/index.ts`. Tất cả API responses phải khớp với các kiểu này:

- `ApiAppointment` – chứa chi tiết lịch hẹn với `appointmentServices[]` (tên dịch vụ + nhân viên gán)
- `ApiStaff` – thông tin nhân viên được đơn giản hóa (id, name)
- `PaginationInfo` – response phân trang chuẩn (page, limit, total, totalPages)

**Quan trọng**: Khi thêm trường vào schema database, cập nhật types ngay lập tức để tránh lỗi casting runtime.

### Các Thực Thể Chính & Mối Quan Hệ

```
users (id, email, password, role: admin|staff|customer)
  ↓
appointments (customerName, phone, date, time, status, priceAtBooking)
  ├─→ appointmentServices[] (junction Many-to-Many)
  │   ├─→ services (name, price, duration, category)
  │   └─→ staff (name, position) [optional per service]
  └─→ payrolls (để theo dõi hoa hồng)

staff (name, position, specialties, status)
  ├─→ staffServices (kỹ năng/chuyên môn dịch vụ)
  ├─→ staffSchedules (sẵn sàng hàng tuần: Thứ 2-Chủ nhật với giờ bắt đầu/kết thúc)
  └─→ appointments (lịch hẹn gán)
```

**Vị trí Schema**: `client/db/schema.js` (Drizzle schema với relations).

### Luật Khả Dụng Nhân Viên

Form đặt lịch truy vấn `/api/staff/available?serviceIds=1,2&date=2024-08-15&time=09:00` để tìm nhân viên rảnh:

1. Lọc nhân viên theo dịch vụ họ có thể cung cấp (qua join `staffServices`).
2. Loại trừ nhân viên có lịch hẹn xung đột (thời lượng quan trọng: nếu dịch vụ 60 phút + giờ yêu cầu là 09:00, nhân viên phải rảnh đến 10:00).
3. Tôn trọng `staffSchedules` (ví dụ: nhân viên vắng cuối tuần sẽ trả về 0 kết quả).
4. Trả về danh sách nhân viên rảnh được đơn giản hóa (id, name).

**Tự động gán vs Thủ công**: Form đặt lịch mặc định tự động gán (nhân viên rảnh đầu tiên), nhưng UI cho phép lựa chọn thủ công. Cả hai đường dẫn phải kiểm tra khả dụng trước khi xác nhận.

---

## Quy Trình Làm Việc Nhà Phát Triển Quan Trọng

### Setup & Phát Triển Cục Bộ

```bash
# Cài đặt dependencies (chỉ pnpm, phiên bản ghim trong package.json)
pnpm install

# Bắt đầu môi trường dev
docker-compose up -d          # MySQL + Nginx + client/server containers
pnpm dev                      # Next.js dev server (http://localhost:3000)

# Các hoạt động database
pnpm db:generate              # Tạo lại SQL từ schema.js
pnpm db:push                  # Đồng bộ schema với database đang chạy
pnpm db:migrate               # Chạy các tệp migration trong ./drizzle/
pnpm db:seed                  # Seed dữ liệu demo (xem seed.ts)
```

**Tại sao hai phương pháp?** `db:push` (khởi động nhanh) vs `db:migrate` (an toàn cho production với migrations).

### Quy Trình Test

```bash
# Unit tests (jsdom environment, Testing Library)
pnpm test:watch               # Watch mode trong quá trình phát triển
pnpm test:unit                # Chạy một lần (CI mode)

# E2E tests (Playwright)
pnpm test:e2e                 # Yêu cầu dev server đang chạy (localhost:3000)

# Ghi đè Playwright base URL
PLAYWRIGHT_BASE_URL=http://example.com pnpm test:e2e
```

**Thứ tự được khuyến nghị**: Viết unit tests cho components/hooks → chạy `pnpm test:watch` → smoke test các luồng quan trọng với `pnpm test:e2e` trước khi push.

### Build & Triển Khai

```bash
pnpm build                    # Tạo production bundle
pnpm start                    # Chạy production server

# Docker builds
docker build -f client/Dockerfile .  # Xây dựng Next.js image
```

**ESLint & TypeScript**: Config build bỏ qua cả hai (`ignoreDuringBuilds: true`) để tăng tốc phát triển; sửa issues theo cách thủ công trong IDE.

---

## Quy Ước Cụ Thể Dự Án

### Mẫu API Response

Tất cả các API routes tuân theo một **hợp đồng lỗi/thành công nhất quán**:

**Thành công** (200):
```json
{
  "success": true,
  "data": { /* entity hoặc entity[] */ },
  "meta": { "page": 1, "limit": 20, "total": 100 }  // tùy chọn
}
```

**Lỗi** (400/500):
```json
{
  "success": false,
  "error": { "code": "SLOT_CONFLICT", "message": "Dịch vụ trùng khung giờ" }
}
```

**Khi tạo API routes**, luôn bao gồm error.code để nhất quán xử lý lỗi frontend (tránh thông báo chung chung).

### Tổ Chức Component

- **UI Components** (`components/ui/`): shadcn/ui primitives (chỉ đọc, tự động sinh)
- **Feature Components** (`components/`): Business logic components (BookingForm, AdminServices, v.v.)
- **Admin Components** (`components/admin/`): Protected dashboard components (cần auth)
- **Page Layouts** (`app/admin/`, `app/book/`): Next.js route segments với `layout.tsx` và `page.tsx`

### Biến Môi Trường

**Client-side** (được exposed trong bundle):
- `NEXT_PUBLIC_API_URL` – API base URL (mặc định: `http://localhost:3000/api/`)
- `NEXT_PUBLIC_SENTRY_DSN` – Browser error tracking (tùy chọn)

**Server-side** (bảo mật):
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `NEXTAUTH_SECRET` – JWT signing key (tạo: `openssl rand -base64 32`)
- `NEXTAUTH_URL` – Public URL cho production (ví dụ: `https://admin.example.com`)
- `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` – Error tracking (tùy chọn)

**Vị trí file .env**: `client/.env` (hoặc repo root `.env`, cả hai đều hoạt động).

### NextAuth JWT Flow

**Sessions sử dụng chiến lược JWT** (không trạng thái, không lưu trữ phía server):

1. Admin/staff đăng nhập tại `/admin/login` → credentials provider kiểm tra bcrypt password so với bảng `users`
2. Nếu thành công, NextAuth phát hành JWT token với payload: `{ sub, email, id, role }`
3. Token được lưu trữ trong HTTP-only cookie: `next-auth.session-token` (bảo mật trong HTTPS)
4. Middleware (`middleware.ts`) xác thực token trên mọi request `/admin/**`
5. Logout đơn giản là xóa cookie (không có thu hồi DB có thể xảy ra với JWT)

**Quan trọng**: Chỉ người dùng với `role: "admin" hoặc "staff"` mới có thể đăng nhập. Người dùng staff bị hạn chế ở `/admin/appointments` và `/admin/schedule` bằng middleware.

### Xử Lý Upload File

Upload endpoint: `/api/upload` (server-side)

- **Yêu cầu xác thực**: Phải là người dùng đã đăng nhập với role admin/staff
- **Định dạng được phép**: PNG, JPEG, WebP, GIF (ảnh ≤ 5MB), MP4 (≤ 50MB)
- **Lưu trữ**: Lưu vào `public/uploads/` (dựa trên file; chuyển sang S3/Supabase để scale)
- **Response**: Trả về đường dẫn file để nhúng vào các bản ghi dịch vụ/nhân viên

**Lưu ý bảo mật**: Xác thực ngăn chặn lạm dụng; hãy xem xét lưu trữ bên ngoài trước khi scale production.

---

## Các Điểm Tích Hợp & Mẫu Chung

### Tìm Nạp Dịch Vụ & Khả Dụng Nhân Viên

**Mẫu trong `BookingForm`**:
1. Tải tất cả dịch vụ khi mount: `GET /api/services?limit=100`
2. Người dùng chọn dịch vụ và ngày/giờ → gọi: `GET /api/staff/available?serviceIds=1,2&date=2024-08-15&time=09:00`
3. Nhận danh sách nhân viên có sẵn; tự động gán nhân viên đầu tiên hoặc để người dùng chọn

**Tại sao các cuộc gọi riêng biệt?** Dịch vụ là tĩnh (thân thiện với cache); khả dụng là động (phải truy vấn mới trên mỗi lựa chọn thời gian).

### Tạo Lịch Hẹn

**POST /api/appointments**:
```json
{
  "serviceIds": [1, 2],
  "customerName": "John Doe",
  "customerPhone": "0987654321",
  "date": "2024-08-15",
  "time": "09:00",
  "staffId": 5,
  "notes": "..."
}
```

**Xác thực**:
- Dịch vụ tồn tại và hoạt động
- Nhân viên có thể cung cấp dịch vụ được yêu cầu
- Không có lịch hẹn xung đột (kiểm tra chồng chéo thời lượng)
- Định dạng số điện thoại (10-11 chữ số)

**Trả về**: `AppointmentId` và chi tiết xác nhận.

### Quản Lý Lịch Hẹn Admin

**Admin API**: `/api/admin/appointments` (yêu cầu auth)

- **GET** với query params: `page`, `limit`, `status` (bộ lọc), `date` (hỗ trợ phạm vi)
- **PUT** `[id]` – cập nhật chỉ trạng thái/ghi chú (bất biến: thông tin khách hàng, định giá)
- **DELETE** `[id]` – soft delete hoặc status=cancelled

**Phân trang**: Trả về 10-20 mỗi trang; admin UI xử lý cuộn vô hạn hoặc điều khiển phân trang.

---

## Test & Xử Lý Lỗi

### Mẫu Unit Tests

Các test nằm bên cạnh components (ví dụ: `components/__tests__/booking-form.test.tsx`). Sử dụng `@testing-library/react`:

```tsx
// Cấu trúc test: arrange → act → assert
import { render, screen } from "@testing-library/react"
import { BookingForm } from "@/components/booking-form"

it("should show error when no service selected", () => {
  render(<BookingForm />)
  // user.click(nextBtn)
  // expect(screen.getByText(/chọn ít nhất một dịch vụ/i)).toBeInTheDocument()
})
```

**Config Vitest** (`vitest.config.ts`): jsdom environment, React plugin, tự động phát hiện test files trong `/components`, `/app`, `/lib`, `/hooks`.

### Mẫu E2E Tests

Playwright specs trong `client/tests/` (ví dụ: `basic.spec.ts`):

```ts
import { test, expect } from "@playwright/test"

test("booking flow end-to-end", async ({ page }) => {
  await page.goto("http://localhost:3000")
  // select service, date, time → submit → verify success page
})
```

**Điều kiện tiên quyết**: `pnpm dev` chạy. Ghi đè base URL qua biến môi trường `PLAYWRIGHT_BASE_URL`.

### Ghi Nhật Ký Lỗi

**Tích hợp Sentry** (`sentry.*.config.ts`):
- Lỗi client tự động được báo cáo tới `NEXT_PUBLIC_SENTRY_DSN`
- Lỗi server được báo cáo tới `SENTRY_DSN`
- Source maps được tải lên qua webpack plugin (config qua `SENTRY_ORG`/`SENTRY_PROJECT`)

**Toast notifications** (qua `sonner`):
- Sử dụng `toast.error(message)` cho lỗi hướng tới người dùng sau lỗi API
- Giữ thông báo ngắn gọn và hành động ("Chọn khung giờ khác" chứ không phải "Internal Server Error")

---

## Tình Huống Phổ Biến & Gỡ Lỗi

1. **Schema Drizzle không đồng bộ?** Sau khi sửa schema.js, chạy `pnpm db:generate` + `pnpm db:push`; không trộn `db:push` và migrations thủ công trong `./drizzle/`.

2. **Khả dụng nhân viên trả về danh sách trống?** Kiểm tra:
   - Nhân viên tồn tại và có status='active'
   - Nhân viên được liên kết với dịch vụ được yêu cầu qua bảng `staffServices`
   - Khả dụng của nhân viên trong `staffSchedules` bao gồm ngày yêu cầu (ngày trong tuần phải khớp)
   - Không có lịch hẹn xung đột cho ngày/giờ được yêu cầu

3. **Admin chuyển hướng tới đăng nhập liên tục?** Xác minh:
   - `NEXTAUTH_SECRET` được đặt và nhất quán
   - JWT trong cookie hợp lệ (kiểm tra DevTools → Application → Cookies)
   - Người dùng có role='admin' hoặc 'staff' trong DB
   - Middleware giải mã token đúng (`middleware.ts` dòng ~15)

4. **Upload thất bại im lặng?** Đảm bảo:
   - Người dùng được xác thực (kiểm tra cookie)
   - Thư mục `public/uploads/` tồn tại
   - Kích thước/định dạng tệp nằm trong giới hạn
   - API route không trả về lỗi (kiểm tra Network tab)

5. **Tests hết thời gian chờ trong CI/Docker?** Playwright cần `npx playwright install` chạy trước `test:e2e`; Docker image cài đặt sẵn trình duyệt.

---

## Ưu Tiên Phát Triển Tính Năng Mới

Khi triển khai tính năng mới, ưu tiên theo thứ tự này:
1. **Schema database** (`client/db/schema.js`) + relations – đảm bảo an toàn kiểu
2. **API routes** (`client/app/api/`) – triển khai endpoint + xác thực
3. **Định nghĩa kiểu** (`client/types/index.ts`) – cập nhật để phù hợp API response
4. **Components** – xây dựng UI với các kiểu hiện có
5. **Tests** – thêm unit + e2e tests cho các đường dẫn quan trọng

Ví dụ: Thêm tính năng "hủy lịch hẹn":
- [ ] Thêm `cancelledAt` timestamp + `cancellationReason` vào schema `appointments`
- [ ] Tạo endpoint `DELETE /api/appointments/[id]` với xác thực
- [ ] Cập nhật kiểu `ApiAppointment` để bao gồm các trường hủy
- [ ] Thêm nút "Hủy" + modal xác nhận trong dashboard admin
- [ ] Viết test e2e: người dùng hủy → lịch hẹn được đánh dấu là hủy trong danh sách

---

## Tham Khảo

- **Next.js 15 Docs**: https://nextjs.org/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **NextAuth Docs**: https://next-auth.js.org
- **Tailwind CSS**: https://tailwindcss.com
- **shadcn/ui Components**: https://ui.shadcn.com

---

## 📋 PHẦN MỚI: PHÂN TÍCH THIẾU SÓT VÀ ROADMAP PHÁT TRIỂN

**Lần cập nhật cuối**: November 2025 | **Dự án**: Nails Manager Booking System v0.1.0

---

## ❌ Các Thiếu Sót Hiện Tại Trong Client

### 1. **API Routes (Chưa hoàn thiện)**

#### Thiếu sót:
- ❌ `/api/appointments/[id]` - **PUT endpoint không kiểm tra xung đột**. Khi cập nhật ngày/giờ, không xác thực xem có nhân viên rảnh không
- ❌ `/api/staff/available` - **Không hỗ trợ `staffSchedules`**. Hiện tại bỏ qua lịch làm hàng tuần (Mon-Sun) của nhân viên
- ❌ Không có `/api/appointments/reschedule` - Yêu cầu phải hủy + tạo mới thay vì cập nhật trực tiếp
- ❌ Không có `/api/staff/[id]/appointments` - API để xem lịch hẹn của một nhân viên cụ thể
- ❌ Không có `/api/dashboard/stats` - Thống kê dashboard (tổng doanh thu, lịch hẹn hôm nay, v.v.)
- ❌ Không có `/api/otp/*` - OTP endpoints được khai báo nhưng chưa triển khai (có folder nhưng không có route.ts)

**Ưu tiên**: 🔴 Cao - Ảnh hưởng đến chức năng core

### 2. **Database Schema (Thiếu dữ liệu quan trọng)**

#### Thiếu sót:
- ❌ **staffSchedules** - Bảng được định nghĩa nhưng **chưa được tạo trong migration**. Seed.ts import nhưng không có dữ liệu
- ❌ Không có trường **notification settings** - Không thể cấu hình SMS/email thông báo theo nhân viên
- ❌ Không có **service_commissions** table - Schema có định nghĩa nhưng chưa được sử dụng trong seed
- ❌ Không có **payroll_details** - Được định nghĩa nhưng chưa seed dữ liệu
- ❌ Thiếu trường **priceAtBooking** trong `appointmentServices` - Giá được lưu nhưng không đủ để tính commission chính xác
- ❌ Không có trường **work_share** trong schema - Cần để tính hoa hồng cho nhiều nhân viên trên 1 dịch vụ

**Ưu tiên**: 🔴 Cao - Cơ sở cho tính năng lương/hoa hồng

### 3. **Components & UI (Chưa đủ chức năng)**

#### Thiếu sót:
- ❌ **StaffSchedule Management** - Không có component để quản lý lịch làm của nhân viên (chỉ có page route trống)
- ❌ **Revenue Analytics** - Có component nhưng **chưa có API endpoint** để lấy dữ liệu doanh thu theo ngày/tháng/dịch vụ
- ❌ **Customer Analytics** - Component tồn tại nhưng không liên kết dữ liệu thực
- ❌ Không có **SMS/Email notification** component - BookingForm không gửi thông báo xác nhận
- ❌ Không có **Appointment History** - Khách hàng không thể xem lịch sử lịch hẹn của họ
- ❌ **Appointment Reschedule Modal** - Chỉ có cập nhật trạng thái, không cho phép thay đổi ngày/giờ
- ❌ Không có **Undo/Archive** features - Xóa appointment là vĩnh viễn, không thể phục hồi

**Ưu tiên**: 🟡 Trung - Nâng cao UX nhưng không phải core

### 4. **Testing (Rất Ít)**

#### Thiếu sót:
- ❌ Chỉ có 1 unit test tồn tại (`booking-form.test.tsx` chưa hoàn thiện)
- ❌ Chỉ có 1 e2e test (`basic.spec.ts` chỉ test landing page)
- ❌ Không có test cho API routes (appointments, staff/available, admin endpoints)
- ❌ Không có test cho admin login flow
- ❌ Không có test cho form validation (phone number, date picker, etc.)

**Ưu tiên**: 🟡 Trung - Cần để đảm bảo quality

### 5. **Auth & Security (Nên Cải Thiện)**

#### Thiếu sót:
- ❌ Không có **role-based API guards** - `/api/admin/*` endpoints không kiểm tra xem user có phải admin/staff
- ❌ Không có **request rate limiting** - Dễ bị brute force attack
- ❌ Không có **audit logging** - Không biết ai thay đổi dữ liệu lúc nào
- ❌ Mật khẩu được lưu nhưng không có endpoint `/api/auth/change-password`
- ❌ Không có **2FA/MFA** - Chỉ dùng email/password

**Ưu tiên**: 🔴 Cao - Bảo mật production

### 6. **Admin Dashboard (Chưa Hoàn Thành)**

#### Thiếu sót:
- ❌ **Staff Management** - Có component nhưng không có form tạo/sửa nhân viên
- ❌ Không có trang **Payroll/Commission** - Chỉ có component revenue nhưng không tính chi tiết hoa hồng
- ❌ Không có trang **Settings** - Cấu hình giờ làm việc, chi phí, thông báo
- ❌ **Appointment Details** modal không đầy đủ - Không thể xem tất cả chi tiết hoặc chỉnh sửa ghi chú
- ❌ Không có **Customer Management** - Xem danh sách khách hàng, lịch sử, yêu thích

**Ưu tiên**: 🟡 Trung

### 7. **Performance & Optimization**

#### Thiếu sót:
- ❌ Không có **caching strategy** - Dịch vụ/nhân viên được fetch mỗi lần (nên cache)
- ❌ Không có **pagination** cho services list (nếu có 1000 dịch vụ sẽ load tất cả)
- ❌ Không có **query optimization** - API có thể N+1 queries (subquery trong available.ts nhưng chưa tối ưu)
- ❌ Không có **image optimization** - avatarUrl, imageUrl không được compress

**Ưu tiên**: 🟡 Trung - Phát triển sau khi đủ tính năng

---

## 🎯 ROADMAP PHÁT TRIỂN (Priority Order)

### **Phase 1: Core Functionality (Tuần 1-2) - 🔴 CRITICAL**

#### 1.1 Fix API Routes & Schema
- [ ] **Hoàn thiện /api/appointments/[id] PUT**
  - Thêm xác thực xung đột ngày/giờ mới
  - Kiểm tra nhân viên được gán có thể làm dịch vụ
  - Trả về error nếu không thể dời lịch
  
- [ ] **Tạo /api/appointments/reschedule POST**
  - Xác thực slot mới có nhân viên rảnh
  - Cập nhật appointmentDate, appointmentTime, staffId
  - Trả về lịch hẹn đã dời
  
- [ ] **Sửa /api/staff/available với staffSchedules**
  - Query staffSchedules trong WHERE clause
  - Loại trừ nhân viên vắng vào ngày yêu cầu (day_of_week)
  - Test với seed data có schedules khác nhau

- [ ] **Tạo migrations Drizzle cho staffSchedules**
  ```bash
  pnpm db:generate  # Tạo migration từ schema
  pnpm db:migrate   # Chạy migration
  ```

#### 1.2 Role-Based API Guards
- [ ] Tạo middleware `/lib/api-guards.ts` kiểm tra role
  ```typescript
  export async function requireAdmin(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role === 'admin') {
      return fail('UNAUTHORIZED', 'Admin access required', 401)
    }
  }
  ```
- [ ] Thêm vào tất cả `/api/admin/*` routes
- [ ] Thêm vào `/api/upload`, `/api/otp/*`

#### 1.3 Seed Data Hoàn Thiện
- [ ] Thêm staffSchedules data trong seed.ts
- [ ] Thêm users (admin, 2 staff accounts) cho testing
- [ ] Seed service_commissions nếu cần

#### Acceptance Criteria:
- ✅ PUT /api/appointments/[id] không cho phép conflict
- ✅ GET /api/staff/available tôn trọng schedules
- ✅ Tất cả admin API có role check
- ✅ Seed đủ dữ liệu test

---

### **Phase 2: Admin Dashboard (Tuần 3) - 🟡 HIGH**

#### 2.1 Hoàn Thiện Staff Management
- [ ] Tạo `/api/admin/staff/[id]/schedule` GET/PUT
  - Lấy schedules của nhân viên
  - Cập nhật ngày làm/không làm
  
- [ ] Component `StaffScheduleManager.tsx`
  - Form chọn ngày (Mon-Sun)
  - Input start_time / end_time
  - Toggle "Ngày OFF"
  
- [ ] Trang `/admin/schedule` hoàn thiện
  - Chọn staff từ dropdown
  - Hiển thị schedule hiện tại
  - Form chỉnh sửa

#### 2.2 Revenue Analytics
- [ ] Tạo `/api/admin/revenue/stats` GET
  - Query parameters: `startDate`, `endDate`, `groupBy` (day|month|service)
  - Tính tổng `priceAtBooking` của appointments
  - Group by service nếu cần
  
- [ ] RevenueAnalytics component: load từ API
- [ ] Hiển thị line chart doanh thu theo ngày

#### 2.3 Customer Management
- [ ] Tạo `/api/admin/customers` GET
  - Lấy distinct customers từ appointments
  - Paginate, search by phone
  
- [ ] Component `CustomersTable.tsx`
  - Danh sách khách hàng
  - Số lịch hẹn, tổng tiêu xài
  - Link tới chi tiết

#### Acceptance Criteria:
- ✅ Admin có thể cập nhật lịch làm nhân viên
- ✅ Dashboard hiển thị doanh thu chính xác
- ✅ Có danh sách khách hàng để quản lý

---

### **Phase 3: Customer Features (Tuần 4) - 🟡 MEDIUM**

#### 3.1 Appointment Lookup Nâng Cao
- [ ] Sửa `/lookup` page
  - Hiển thị không chỉ appointments mà còn button "Reschedule" + "Cancel"
  
- [ ] Tạo `RescheduleModal.tsx`
  - Chọn ngày/giờ mới
  - Gọi `/api/appointments/reschedule`
  - Hiển thị kết quả

#### 3.2 Notifications
- [ ] Tạo `/api/notifications/send-confirmation` POST
  - Gửi SMS/Email xác nhận (tích hợp Twilio/SendGrid sau)
  - Hiện tại chỉ in log
  
- [ ] BookingForm gọi endpoint sau POST /appointments thành công

#### 3.3 Favorites / Preferences
- [ ] Thêm trường `preferredStaffId` vào customers table (if feasible)
- [ ] Booking form: "Chọn nhân viên yêu thích"

#### Acceptance Criteria:
- ✅ Khách hàng có thể dời/hủy lịch hẹn
- ✅ Nhận thông báo xác nhận
- ✅ Có thể chọn nhân viên cụ thể

---

### **Phase 4: Testing & Quality (Tuần 5) - 🟡 MEDIUM**

#### 4.1 Unit Tests
- [ ] `components/__tests__/booking-form.test.tsx` - Hoàn thiện
  - Test step navigation
  - Test service selection
  - Test validation errors
  
- [ ] `components/__tests__/staff-schedule-manager.test.tsx` - Mới
- [ ] `lib/__tests__/api-guards.test.ts` - Mới

#### 4.2 E2E Tests
- [ ] `client/tests/booking-complete.spec.ts` - Full booking flow
- [ ] `client/tests/admin-login.spec.ts` - Admin auth
- [ ] `client/tests/reschedule.spec.ts` - Dời lịch hẹn
- [ ] `client/tests/staff-schedule.spec.ts` - Cập nhật schedule

#### 4.3 API Tests
- [ ] Playwright API testing hoặc tạo test file riêng
  ```typescript
  // tests/api.spec.ts
  test("POST /api/appointments validates conflict", async () => {
    // Create appointment 09:00-10:00
    // Try create 09:30-10:30 same staff → should fail
  })
  ```

#### Acceptance Criteria:
- ✅ Coverage ≥ 60% cho components
- ✅ Tất cả critical flows có e2e test
- ✅ CI pipeline pass

---

### **Phase 5: Performance & Production (Tuần 6-7) - 🟡 LOWER**

#### 5.1 Caching
- [ ] React Query / SWR cho `/api/services` (cache 5 phút)
- [ ] Next.js ISR cho public pages (`/services`, `/`)

#### 5.2 Image Optimization
- [ ] Next.js Image component cho avatarUrl, imageUrl
- [ ] Upload middleware: resize + compress

#### 5.3 Database Indexes
```sql
CREATE INDEX idx_appointments_date ON appointments(appointmentDate);
CREATE INDEX idx_appointments_staff ON appointments(staffId);
CREATE INDEX idx_appointmentServices_appointment ON appointmentServices(appointmentId);
```

#### 5.4 Error Monitoring
- [ ] Setup Sentry DSN
- [ ] Test error reporting flow

#### Acceptance Criteria:
- ✅ Trang load < 2s (Lighthouse)
- ✅ Sentry catches server errors
- ✅ Database queries optimized

---

### **Phase 6: Advanced Features (Tuần 8+) - 🟢 FUTURE**

- [ ] **Commission Calculator** - Tính hoa hồng nhân viên
- [ ] **SMS/Email Integration** - Thực tế với Twilio/SendGrid
- [ ] **Recurring Appointments** - Đặt lịch lặp lại
- [ ] **Payment Integration** - Online payment (Stripe/Momo)
- [ ] **Reports** - Export PDF/Excel
- [ ] **Mobile App** - React Native hoặc PWA
- [ ] **Multi-location** - Quản lý nhiều chi nhánh

---

## 📊 Thứ Tự Ưu Tiên Tóm Tắt

```
Phase 1: Core APIs + Security     [▓▓▓▓▓] (2 tuần)    - CRITICAL
Phase 2: Admin Dashboard          [▓▓▓▓░] (1 tuần)    - HIGH  
Phase 3: Customer Features        [▓▓▓░░] (1 tuần)    - MEDIUM
Phase 4: Testing                  [▓▓▓░░] (1 tuần)    - MEDIUM
Phase 5: Performance              [▓▓░░░] (2 tuần)    - LOW
Phase 6: Advanced                 [░░░░░] (Ongoing)   - Future
```

---

## 🚀 Công Việc Ngay Lập Tức (Do Từ Hôm Nay)

1. **Hôm nay**: Chạy `pnpm db:generate` + `pnpm db:push` để tạo migration staffSchedules
2. **Hôm nay**: Sửa seed.ts để thêm staffSchedules data
3. **Ngày mai**: Cập nhật `/api/staff/available` để kiểm tra schedules
4. **Ngày mai**: Thêm role-based middleware vào `/api/admin/*`
5. **Tuần sau**: Bắt đầu Phase 2 - Staff Schedule Management

---

**Lưu ý**: Roadmap này là linh hoạt. Nếu phát hiện bug hoặc yêu cầu mới, ưu tiên có thể thay đổi. Hãy commit sau mỗi phase và test thực tế trước khi deploy.
