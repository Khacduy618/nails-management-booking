# Hệ Thống Quản Lý & Đặt Lịch Nail Salon (NailsApp)

Một ứng dụng web hiện đại, toàn diện để quản lý tiệm Nail, bao gồm giao diện đặt lịch công khai cho khách hàng và bảng điều khiển quản trị mạnh mẽ cho nhân viên và quản lý. Được xây dựng với các công nghệ web mới nhất để đảm bảo hiệu suất, khả năng mở rộng và trải nghiệm người dùng tốt nhất.

## 🚀 Chức Năng Chính

### 🌟 Dành Cho Khách Hàng (Public)
*   **Xem Dịch Vụ**: Duyệt danh sách dịch vụ chi tiết với giá cả, thời gian thực hiện và danh mục.
*   **Đặt Lịch Thông Minh**: Chọn ngày giờ trên lịch tương tác, hệ thống tự động tính toán khung giờ trống dựa trên lịch làm việc của nhân viên.
*   **Chọn Nhân Viên**: Khách hàng có thể chọn nhân viên yêu thích hoặc để hệ thống tự động chỉ định nhân viên rảnh.
*   **Tra Cứu Lịch Hẹn**: Kiểm tra trạng thái lịch hẹn bằng số điện thoại.
*   **Giao Diện Responsive**: Tối ưu hóa hoàn toàn cho cả thiết bị di động và máy tính để bàn.

### 🛡️ Dành Cho Quản Trị Viên & Nhân Viên (Dashboard)
*   **Tổng Quan (Dashboard)**: Xem các chỉ số thời gian thực về lịch hẹn trong ngày, doanh thu, và hiệu suất nhân viên.
*   **Quản Lý Lịch Hẹn**: Xem danh sách, phê duyệt, dời lịch, hoặc hủy lịch hẹn.
*   **Quản Lý Nhân Viên**: Quản lý hồ sơ nhân viên, lịch làm việc hàng tuần, và kỹ năng (dịch vụ có thể làm).
*   **Hệ Thống Tính Lương (Payroll)**: Tự động tính toán hoa hồng và lương dựa trên dịch vụ hoàn thành và giờ làm việc.
*   **Báo Cáo Doanh Thu**: Báo cáo tài chính chi tiết theo ngày, tuần, tháng.
*   **Quản Lý Dịch Vụ**: Thêm, sửa, xóa dịch vụ và danh mục dịch vụ.

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Core (Lõi)
*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router) - Framework React hiện đại nhất.
*   **Ngôn Ngữ**: [TypeScript](https://www.typescriptlang.org/) - Đảm bảo type-safety.
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS.
*   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) - Bộ component đẹp và accessible.

### Backend & Database
*   **Database**: [PostgreSQL](https://www.postgresql.org/) (Neon Tech) - Serverless Postgres.
*   **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Truy vấn dữ liệu an toàn và hiệu quả.
*   **Auth**: [NextAuth.js](https://next-auth.js.org/) - Xác thực và phân quyền.
*   **Validation**: [Zod](https://zod.dev/) - Kiểm tra dữ liệu đầu vào.

---

## 🔄 Chi Tiết Chức Năng & Vòng Đời (Feature Lifecycle & Workflows)

Phần này mô tả chi tiết cách từng chức năng hoạt động từ lúc bắt đầu đến khi kết thúc và luồng dữ liệu đi kèm.

### 1. Hệ Thống Đặt Lịch (Booking System)
*Dành cho khách hàng (Public Interface)*

**Mô tả**: Cho phép khách hàng chọn dịch vụ, nhân viên và khung giờ phù hợp mà không cần đăng nhập.

**Vòng Đời (Lifecycle)**:
1.  **Khởi Tạo (Initialization)**:
    *   Khách truy cập trang chủ/đặt lịch.
    *   Hệ thống tải danh sách Danh mục (Categories) và Dịch vụ (Services) đang hoạt động (`active`).
2.  **Lựa Chọn (Selection)**:
    *   Khách chọn một hoặc nhiều dịch vụ mong muốn.
    *   Hệ thống tự động tính tổng thời gian thực hiện và giá tiền ước tính.
3.  **Kiểm Tra Tình Trạng (Availability Check)**:
    *   Khách chọn ngày mong muốn trên lịch.
    *   Hệ thống quét lịch làm việc của nhân viên (`StaffSchedule`) và các lịch hẹn đã tồn tại (`Appointments`) để tìm ra các "khe trống" (slots).
    *   *Logic thông minh*: Nếu khách chọn nhân viên cụ thể, chỉ kiểm tra nhân viên đó. Nếu chọn "Bất kỳ ai", kiểm tra toàn bộ nhân viên có kỹ năng làm dịch vụ đó.
4.  **Xác Nhận (Confirmation)**:
    *   Khách nhập thông tin cá nhân (Tên, SĐT, Email, Ghi chú).
    *   Hệ thống tạo một "Giao dịch" (Transaction) để lưu dữ liệu vào Database.
5.  **Hoàn Tất (Completion)**:
    *   Hiển thị thông báo thành công và mã lịch hẹn.
    *   Gửi email xác nhận cho khách và thông báo cho Admin (nếu được cấu hình).

**Workflow Kỹ Thuật**:
*   `GET /api/services`: Lấy dữ liệu hiển thị lên UI.
*   `GET /api/staff/available?date=...&services=...`: API quan trọng nhất. Tính toán logic giao nhau giữa thời gian làm việc và thời gian bận.
*   `POST /api/appointments`:
    *   Validate dữ liệu đầu vào bằng Zod Schema.
    *   Sử dụng `db.transaction()`: Tạo `Customer` (nếu mới) -> Tạo `Appointment` -> Tạo `AppointmentService`.

### 2. Quản Lý Lịch Hẹn (Appointment Management)
*Dành cho Admin/Staff (Dashboard)*

**Mô tả**: Theo dõi, xử lý và cập nhật trạng thái các cuộc hẹn của tiệm.

**Vòng Đời (Lifecycle)**:
1.  **Tiếp Nhận (Pending)**: Lịch hẹn mới từ web sẽ có trạng thái mặc định là `Pending`.
2.  **Xử Lý (Processing)**:
    *   Admin/Lễ tân kiểm tra lịch.
    *   Duyệt lịch -> Chuyển sang `Confirmed`.
    *   Hoặc nếu khách hủy/spam -> Chuyển sang `Cancelled`.
3.  **Thực Hiện (In-Service)**: Khách đến tiệm, check-in và bắt đầu làm dịch vụ.
4.  **Kết Thúc (Completed)**:
    *   Khách thanh toán xong.
    *   Admin cập nhật trạng thái `Completed`. *Lưu ý: Chỉ trạng thái này mới được tính vào lương/doanh thu.*
5.  **Vắng Mặt (No-show)**: Khách không đến và không báo -> Đánh dấu `No-show` để lưu vết lịch sử uy tín của khách.

**Workflow Kỹ Thuật**:
*   `GET /api/admin/appointments`: Fetch danh sách với phân trang (Pagination) & bộ lọc theo ngày (Date Filter).
*   `PATCH /api/admin/appointments/[id]`: Cập nhật trạng thái (`status`) hoặc ghi chú.
*   `DELETE /api/admin/appointments/[id]`: Soft delete (chỉ ẩn khỏi giao diện, vẫn lưu trong DB để đối soát).

### 3. Quản Lý Nhân Viên & Lịch Làm Việc (Staff Management)
*Dành cho Admin*

**Mô tả**: Quản lý hồ sơ nhân viên, kỹ năng tay nghề và thời gian làm việc hàng tuần.

**Vòng Đời (Lifecycle)**:
1.  **Onboarding (Tạo mới)**:
    *   Admin tạo hồ sơ nhân viên (Tên, SĐT, Màu hiển thị trên lịch).
    *   Tạo tài khoản đăng nhập hệ thống (User account) liên kết với hồ sơ này.
2.  **Cấu Hình Kỹ Năng (Skill Set)**:
    *   Gán các dịch vụ mà nhân viên này có thể làm (Ví dụ: Nhân viên A chỉ làm Nail, không làm Mi).
    *   Hệ thống booking sẽ dựa vào đây để lọc nhân viên phù hợp khi khách chọn dịch vụ.
3.  **Thiết Lập Lịch (Scheduling)**:
    *   Cấu hình lịch làm việc hàng tuần (Thứ 2 - CN, giờ bắt đầu - kết thúc).
    *   Cấu hình ngày nghỉ phép (Day off) hoặc nghỉ đột xuất.
4.  **Vận Hành**: Nhân viên nhận lịch hẹn dựa trên cấu hình trên.

**Workflow Kỹ Thuật**:
*   `POST /api/admin/staff`: Tạo nhân viên + User trong một transaction.
*   `PUT /api/admin/staff/[id]/schedule`: Cập nhật bảng `staff_schedules`.
*   `GET /api/admin/staff/[id]`: Lấy chi tiết thông tin để chỉnh sửa.

### 4. Hệ Thống Tính Lương (Payroll System)
*Dành cho Admin*

**Mô tả**: Tự động tính toán thu nhập cho nhân viên dựa trên hiệu suất làm việc.

**Vòng Đời (Lifecycle)**:
1.  **Thu Thập Dữ Liệu**:
    *   Admin chọn khoảng thời gian tính lương (Ví dụ: 01/12 - 31/12).
    *   Hệ thống truy vấn tất cả lịch hẹn có trạng thái `Completed` trong khoảng này.
2.  **Tính Toán (Calculation)**:
    *   **Lương cơ bản**: Dựa trên số ngày/giờ làm việc (nếu có).
    *   **Hoa hồng (Commission)**: Tổng giá trị dịch vụ hoàn thành * % hoa hồng được cài đặt cho nhân viên đó.
    *   **Tips**: Cộng dồn tiền tip từ khách (nếu có).
3.  **Tổng Hợp & Báo Cáo**: Hiển thị bảng lương chi tiết, cho phép xuất ra Excel/PDF (tính năng mở rộng).

**Workflow Kỹ Thuật**:
*   `GET /api/admin/payroll`:
    *   Query bảng `appointments` join với `appointment_services`.
    *   Filter điều kiện `status = 'completed'`.
    *   Group by `staffId`.
    *   Sum `price` và áp dụng công thức tính `commission`.

### 5. Xác Thực & Phân Quyền (Authentication & Authorization)
*Bảo mật hệ thống*

**Vòng Đời (Lifecycle)**:
1.  **Đăng Nhập**: User nhập email/password -> Hệ thống mã hóa password và so sánh với hash trong Database.
2.  **Cấp Phiên (Session)**: Nếu đúng, hệ thống cấp JWT Token chứa `userId` và `role` (Admin/Staff).
3.  **Điều Hướng (Routing)**:
    *   **Admin**: Truy cập toàn quyền (Quản lý nhân viên, Doanh thu, Cấu hình).
    *   **Staff**: Quyền hạn chế (Chỉ xem lịch hẹn của mình, không xem doanh thu tổng).
4.  **Bảo Vệ API**: Mọi request tới `/api/admin/*` đều bị chặn bởi Middleware để kiểm tra tính hợp lệ của Token.

**Workflow Kỹ Thuật**:
*   `lib/auth.ts`: Cấu hình NextAuth Credentials Provider.
*   `middleware.ts`: Chặn request không có token hoặc token hết hạn, redirect về trang login.

---

## 📂 Cấu Trúc Dự Án (Project Structure)

```
nailsapp/
├── app/                # Next.js App Router (Pages & API Routes)
│   ├── api/            # Các API endpoints (Backend logic)
│   ├── admin/          # Các trang quản trị (Dashboard)
│   ├── (public)/       # Các trang công khai (Booking, Home)
│   └── layout.tsx      # Layout chính của ứng dụng
├── components/         # Các React components tái sử dụng
│   ├── ui/             # Shadcn UI components (Button, Input, Dialog...)
│   ├── admin/          # Components dành riêng cho trang Admin
│   └── ...             # Các components chức năng khác
├── db/                 # Cấu hình Database và Schema
│   ├── schema.ts       # Định nghĩa bảng (Tables) bằng Drizzle
│   └── index.ts        # Khởi tạo kết nối Database
├── lib/                # Các hàm tiện ích (Utils) và logic chung
│   ├── auth.ts         # Cấu hình NextAuth
│   ├── rate-limit.ts   # Logic giới hạn lượt truy cập API
│   └── ...
├── scripts/            # Scripts bảo trì và migration
├── tests/              # Unit tests
└── e2e/                # End-to-end tests
```

## 🔧 Các Kỹ Thuật Kỹ Thuật Chính (Key Patterns)

*   **Database Transactions**: Sử dụng `db.transaction()` của Drizzle cho các thao tác ghi quan trọng (Đặt lịch, Tính lương) để đảm bảo tính nhất quán dữ liệu. Nếu một bước lỗi, toàn bộ thao tác sẽ được hoàn tác (rollback).
*   **Zod Validation**: Tất cả API routes đều sử dụng `zod` schemas để kiểm tra dữ liệu JSON body và Query Parameters đầu vào, đảm bảo dữ liệu rác không bao giờ lọt vào database.
*   **Rate Limiting**: `lib/rate-limit.ts` triển khai thuật toán Token Bucket để bảo vệ các API công khai (như Booking và Lookup) khỏi spam và tấn công DDoS.
*   **Server-Side Pagination**: Các bảng dữ liệu Admin sử dụng phân trang phía server (`limit`, `offset`) để xử lý lượng dữ liệu lớn hiệu quả, thay vì tải toàn bộ về trình duyệt.

## ⚡ Hướng Dẫn Cài Đặt & Chạy (Getting Started)

### 📋 Yêu cầu hệ thống
*   Docker & Docker Compose
*   Node.js 18+ & `pnpm` (Nếu chạy ứng dụng trên máy Host)

---

### 1️⃣ Cấu hình môi trường (Environment Variables)
Ứng dụng sử dụng tệp `.env` ở thư mục gốc để cấu hình. Bản mẫu `.env` mặc định đã được cấu hình sẵn để kết nối với cơ sở dữ liệu Postgres chạy bằng Docker:
*   `DATABASE_URL="postgresql://postgres:*******@localhost:5432/db"` (khi chạy ứng dụng trên Host)
*   `NEXTAUTH_SECRET`: Khóa ký phiên đăng nhập (đã điền mã mặc định cho local dev).

Nếu muốn kết nối với cơ sở dữ liệu khác (như Neon Postgres), hãy cập nhật lại `DATABASE_URL` tương ứng trong tệp `.env`.

---

### 2️⃣ Khởi động và chạy ứng dụng

Bạn có thể lựa chọn 1 trong 2 phương án phát triển dưới đây:

#### 🔹 PHƯƠNG ÁN A: Chạy Database trong Docker + Ứng dụng chạy trên Host (Khuyên Dùng)
*Phương án này giúp Hot-Reload của Next.js hoạt động nhanh nhất và tối ưu hiệu suất trên macOS/Windows.*

1.  **Khởi động Postgres database bằng Docker:**
    ```bash
    docker compose up -d postgres
    ```

2.  **Cài đặt các dependencies trên máy Host:**
    ```bash
    pnpm install
    ```

3.  **Chạy Migrations và Seeding để khởi tạo cấu trúc và dữ liệu mẫu:**
    ```bash
    # Đẩy cấu trúc bảng (schema) lên Database
    pnpm db:migrate

    # Nạp dữ liệu mẫu (Admin, Staff, Dịch vụ...)
    pnpm db:seed
    ```

4.  **Chạy Next.js ở chế độ Development:**
    ```bash
    pnpm dev
    ```
    Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để sử dụng.

---

#### 🔹 PHƯƠNG ÁN B: Chạy TOÀN BỘ trong Docker (Database + Web App)
*Phương án này phù hợp nếu bạn không muốn cài đặt Node.js/pnpm trên máy Host.*

1.  **Build và khởi động tất cả các container:**
    ```bash
    docker compose up -d --build
    ```

2.  **Chạy Migrations và Seeding bên trong container `nailsapp-web`:**
    ```bash
    # Chạy migrations để khởi tạo database schema
    docker compose exec web pnpm db:migrate

    # Chạy seed để nạp dữ liệu mẫu
    docker compose exec web pnpm db:seed
    ```

3.  **Truy cập ứng dụng:**
    Ứng dụng sẽ chạy tại [http://localhost:3000](http://localhost:3000).

---

### 🔑 Tài khoản đăng nhập mặc định (Seed Data)

## 🧪 Kiểm Thử (Testing)

*   **Chạy Unit Tests**:
    ```bash
    pnpm test
    ```
*   **Chạy E2E Tests**:
    ```bash
    pnpm test:e2e
    ```

## 🔒 Tính Năng Bảo Mật

*   **Rate Limiting**: Giới hạn tần suất gọi API để chống spam.
*   **RBAC (Role-Based Access Control)**: Phân quyền dựa trên vai trò (Admin/Staff) thông qua Middleware.
*   **Input Validation**: Kiểm tra chặt chẽ dữ liệu đầu vào bằng Zod.
*   **Secure Headers**: Middleware thực thi các security headers và kiểm tra nguồn gốc (Origin check).

## 🚀 Triển Khai (Deployment)

Dự án được tối ưu để triển khai trên **Vercel**.

1.  Đẩy code lên GitHub.
2.  Import dự án vào Vercel.
3.  Cấu hình Environment Variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, v.v.).
4.  Deploy!

---
*Được xây dựng với ❤️ bởi Khac Duy*
