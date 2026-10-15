# Project Report: K.Tay Nails Management & Booking System

**Generated:** July 15, 2026  
**Project:** nails-management-booking  
**Author:** Khac Duy

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [Features & Functionality](#6-features--functionality)
7. [API Endpoints](#7-api-endpoints)
8. [Security Implementation](#8-security-implementation)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment](#10-deployment)
11. [Project Structure](#11-project-structure)
12. [Configuration & Environment](#12-configuration--environment)
13. [Recommendations](#13-recommendations)

---

## 1. Executive Summary

K.Tay Nails is a comprehensive nail salon management and booking platform built with modern web technologies. The application serves two primary user groups:

- **Customers**: Public-facing booking interface for scheduling appointments
- **Staff/Admin**: Administrative dashboard for managing operations, staff, payroll, and analytics

The system features end-to-end encryption for sensitive data, role-based access control, automated payroll calculations, and real-time appointment management.

---

## 2. Project Overview

### Business Context

A nail salon management solution that digitizes the entire appointment lifecycle—from customer booking to staff compensation. The platform handles:

- Service catalog management
- Real-time availability checking
- Customer relationship management
- Staff scheduling and skill matching
- Commission-based payroll automation
- Revenue analytics and reporting

### Target Users

| User Role | Access Level | Primary Functions |
|-----------|--------------|-------------------|
| Customer | Public (no auth) | Book appointments, view services, lookup appointments, leave reviews |
| Staff | Authenticated | View assigned appointments, update appointment status, view own schedule |
| Admin | Authenticated | Full system access: manage staff, services, payroll, revenue, customers |

---

## 3. Technology Stack

### Core Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.10 | Full-stack React framework with App Router |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Node.js | 18+ | Runtime environment |

### Frontend Technologies

| Technology | Purpose |
|------------|---------|
| Tailwind CSS 4.1.18 | Utility-first styling |
| Radix UI | Accessible component primitives |
| Lucide React | Icon library |
| React Hook Form | Form management |
| Zod | Schema validation |
| Date-fns | Date manipulation |
| Recharts | Charts and analytics |

### Backend & Data Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | - | Relational database |
| Drizzle ORM | 0.45.1 | Type-safe SQL query builder |
| NextAuth.js | 4.24.7 | Authentication & session management |
| bcryptjs | 2.4.3 | Password hashing |
| Nodemailer | 7.0.12 | Email service |

### Infrastructure & Services

| Service | Purpose |
|---------|---------|
| Neon Database | Serverless PostgreSQL |
| Upstash Redis | Distributed rate limiting |
| Vercel Blob | File storage |
| Sentry | Error monitoring |
| Vercel Analytics | Usage analytics |

### Testing Tools

| Tool | Purpose |
|------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| Testing Library | React component testing |

---

## 4. System Architecture

### Architecture Pattern

The application follows a **Next.js App Router** architecture with:

- **Server Components** for data fetching and SEO
- **Client Components** for interactive UI elements
- **API Routes** for backend logic
- **Server Actions** for form mutations

### Request Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │────▶│  Next.js Server  │────▶│   PostgreSQL    │
│  (Browser)  │     │  (API Routes)    │     │    (Neon)       │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                    │                        │
       │                    ▼                        │
       │            ┌──────────────┐                 │
       │            │  Drizzle ORM │                 │
       │            └──────────────┘                 │
       │                                             │
       ▼                                             ▼
┌─────────────┐                            ┌─────────────────┐
│   Redis     │                            │  Rate Limiting  │
│  (Upstash)  │                            │    Middleware   │
└─────────────┘                            └─────────────────┘
```

### Key Architectural Decisions

1. **Encrypted Fields**: PII (email, phone, name) encrypted at rest using AES-256-GCM
2. **Blind Indexes**: HMAC-SHA256 indexes for searchable encrypted fields
3. **Rate Limiting**: Token bucket algorithm via Upstash Redis
4. **Session Strategy**: JWT-based sessions with 8-hour inactivity timeout

---

## 5. Database Schema

### Entity Relationship Diagram

```
┌────────────┐       ┌────────────┐       ┌─────────────────┐
│   users    │──1:1──│   staff    │──M:N──│    services     │
└────────────┘       └────────────┘       └─────────────────┘
                           │                      │
                           │                      │
                           ▼                      ▼
                    ┌────────────────┐    ┌──────────────────┐
                    │ staff_services │    │ staff_schedules  │
                    └────────────────┘    └──────────────────┘

┌──────────────┐       ┌─────────────────┐       ┌────────────────────┐
│  customers   │──1:N──│  appointments   │──1:N──│ appointment_services│
└──────────────┘       └─────────────────┘       └────────────────────┘
                              │                          │
                              │                          │
                              ▼                          ▼
                       ┌─────────────┐           ┌─────────────┐
                       │ otp_tokens  │           │   payroll   │
                       └─────────────┘           └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   reviews   │
                       └─────────────┘
```

### Table Definitions

#### Users Table (`db/schema.ts:27`)

Authentication and role management for staff/admin accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | text | Encrypted display name |
| email | text | Encrypted email |
| emailHash | varchar(255) | Blind index for email lookup |
| phone | text | Encrypted phone number |
| phoneHash | varchar(255) | Blind index for phone lookup |
| password | varchar(255) | bcrypt hashed password |
| role | enum | customer/staff/admin |

#### Staff Table (`db/schema.ts:41`)

Employee profiles with skills and availability.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | FK to users |
| position | varchar(100) | Job title |
| specialties | jsonb | Array of skill IDs |
| status | enum | active/inactive |
| avatarUrl | varchar(255) | Profile image |
| rating | numeric(3,2) | Average review score |

#### Services Table (`db/schema.ts:79`)

Service catalog with pricing and duration.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | varchar(255) | Service name |
| description | text | Service description |
| price | numeric(10,2) | Price in VND |
| duration | integer | Duration in minutes |
| categoryId | integer | FK to service_categories |
| status | enum | active/archived |

#### Appointments Table (`db/schema.ts:140`)

Booking records with customer info and service details.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| customerId | integer | FK to customers |
| customerName | text | Encrypted customer name |
| customerPhone | text | Encrypted phone |
| customerPhoneHash | varchar(255) | Blind index for lookup |
| appointmentDate | date | Scheduled date |
| appointmentTime | time | Scheduled time |
| status | enum | pending/confirmed/completed/cancelled/in-progress |
| priceAtBooking | numeric(10,2) | Total price |
| durationAtBooking | integer | Total duration in minutes |

#### Appointment Services Table (`db/schema.ts:163`)

Junction table linking appointments to services and staff.

| Column | Type | Description |
|--------|------|-------------|
| appointmentId | integer | FK to appointments |
| serviceId | integer | FK to services |
| staffId | integer | FK to staff |
| priceAtBooking | numeric(10,2) | Service price at booking time |
| commissionPercentage | numeric(5,2) | Staff commission rate |
| workShare | numeric(5,2) | Percentage of work (for split services) |
| payrollId | integer | FK to payrolls |

#### Payrolls Table (`db/schema.ts:123`)

Staff compensation records.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| staffId | integer | FK to staff |
| payPeriodStart | date | Period start date |
| payPeriodEnd | date | Period end date |
| baseSalary | numeric(10,2) | Fixed salary |
| totalCommission | numeric(10,2) | Commission from services |
| totalBonus | numeric(10,2) | Bonuses |
| totalDeduction | numeric(10,2) | Deductions |
| finalSalary | numeric(10,2) | Net payment |
| status | enum | pending/calculated/paid/cancelled |

### Enum Types

```typescript
roleEnum: 'customer' | 'staff' | 'admin'
staffStatusEnum: 'active' | 'inactive'
categoryStatusEnum: 'active' | 'deleted' | 'inactive'
serviceStatusEnum: 'active' | 'archived'
payrollStatusEnum: 'pending' | 'calculated' | 'paid' | 'cancelled'
appointmentStatusEnum: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in-progress'
```

---

## 6. Features & Functionality

### 6.1 Customer-Facing Features (Public)

#### Homepage (`app/page.tsx`)

- Hero section with call-to-action
- Services showcase
- Team/staff profiles
- Customer testimonials
- Navigation to booking

#### Services Page (`app/services/page.tsx`)

- Category-filtered service listing
- Service details: price, duration, description
- Direct booking link for each service

#### Booking System (`app/book/page.tsx`)

**Flow:**
1. Customer selects one or more services
2. System calculates total price and duration
3. Customer selects preferred date
4. System shows available time slots based on staff availability
5. Customer optionally selects specific staff member
6. Customer enters contact information (name, phone, email)
7. System validates and creates appointment
8. Confirmation email sent

**Key Features:**
- Real-time slot availability calculation
- Staff skill matching (only shows staff qualified for selected services)
- Conflict prevention (no double-booking)
- Business hours validation
- Overtime detection and handling

#### Appointment Lookup (`app/lookup/page.tsx`)

- Search by phone number
- View appointment history and status
- Cancel appointments with OTP verification

#### Reviews (`app/review/page.tsx`)

- Post-appointment review submission
- Rating (1-5 stars) and comments
- Token-based review links (secure, one-time use)

### 6.2 Admin/Staff Dashboard Features

#### Dashboard Overview (`app/admin/(dashboard)/page.tsx`)

- Today's appointments count
- Revenue metrics
- Staff performance charts
- Recent activity feed

#### Appointment Management (`app/admin/appointments/page.tsx`)

- Calendar view (daily/weekly/monthly)
- List view with filters
- Status updates: pending → confirmed → in-progress → completed
- Notes and internal comments
- Walk-in appointment creation

#### Staff Management (`app/admin/staff/page.tsx`)

- Staff profile CRUD
- Skill assignment (which services each staff can perform)
- Schedule configuration (weekly working hours)
- Status management (active/inactive)
- Salary configuration

#### Service Management (`app/admin/services/page.tsx`)

- Service CRUD operations
- Category organization
- Price and duration management
- Image uploads
- Archive/hide services

#### Customer Management (`app/admin/customers/page.tsx`)

- Customer database
- Appointment history per customer
- Notes and preferences
- Contact information (decrypted for authorized staff)

#### Payroll System (`app/admin/payroll/page.tsx`)

**Calculation Logic:**
```
Final Salary = Base Salary + Total Commission + Total Bonus - Total Deductions

Commission = Σ (Service Price × Commission % × Work Share %)
```

**Features:**
- Period-based calculation
- Manual bonus/deduction entry
- Export functionality
- Payment status tracking

#### Revenue Reports (`app/admin/revenue/page.tsx`)

- Daily/weekly/monthly revenue
- Service breakdown
- Staff revenue contribution
- Comparison charts

#### Schedule Management (`app/admin/schedule/page.tsx`)

- Weekly schedule grid
- Staff availability overview
- Day-off management
- Shift planning

---

## 7. API Endpoints

### Public APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services` | GET | List active services |
| `/api/services/[id]` | GET | Get service details |
| `/api/service-categories` | GET | List service categories |
| `/api/staff` | GET | List staff profiles |
| `/api/staff/available` | GET | Get available staff for date/services |
| `/api/appointments` | GET | Lookup appointments by phone |
| `/api/appointments` | POST | Create new appointment |
| `/api/appointments/[id]` | PATCH | Update appointment |
| `/api/otp/send` | POST | Send OTP for cancellation |
| `/api/otp/verify` | POST | Verify OTP code |
| `/api/reviews` | POST | Submit review |

### Admin APIs (Require Authentication)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/appointments` | GET, POST | List/create admin appointments |
| `/api/admin/appointments/[id]` | GET, PATCH, DELETE | Manage single appointment |
| `/api/admin/staff` | GET, POST | List/create staff |
| `/api/admin/staff/[id]` | GET, PATCH, DELETE | Manage single staff |
| `/api/admin/staff/[id]/schedule` | PUT | Update staff schedule |
| `/api/admin/staff/[id]/salary` | GET, PUT | Manage staff base salary |
| `/api/admin/services` | GET, POST | List/create services |
| `/api/admin/services/[id]` | GET, PATCH, DELETE | Manage single service |
| `/api/admin/service-categories` | GET, POST | List/create categories |
| `/api/admin/service-categories/[id]` | PATCH, DELETE | Manage single category |
| `/api/admin/customers` | GET | List customers |
| `/api/admin/customers/[id]` | GET, PATCH | Manage single customer |
| `/api/admin/payroll` | GET, POST | List/create payrolls |
| `/api/admin/revenue` | GET | Revenue statistics |
| `/api/admin/notifications` | GET | Admin notifications |

### Authentication APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | ALL | NextAuth.js handlers |

---

## 8. Security Implementation

### 8.1 Data Encryption

**Implementation:** `lib/crypto.ts`

All sensitive PII fields are encrypted at rest using AES-256-GCM:

```typescript
// Encryption format: v1:iv_hex:ciphertext_hex:tag_hex
encrypt(text) → "v1:abc123:def456:ghi789"
decrypt(encryptedText) → original text
```

**Encrypted Fields:**
- `users.email`, `users.phone`, `users.name`
- `customers.email`, `customers.phone`, `customers.name`
- `appointments.customerName`, `appointments.customerPhone`

### 8.2 Blind Indexes

Searchable encryption via HMAC-SHA256 blind indexes:

```typescript
// Allows exact-match queries on encrypted fields
generateBlindIndex("user@example.com") → "a1b2c3d4..."
```

**Indexed Fields:**
- `users.emailHash`, `users.phoneHash`
- `customers.emailHash`, `customers.phoneHash`
- `appointments.customerPhoneHash`

### 8.3 Authentication & Authorization

**NextAuth.js Configuration:** `lib/auth.ts`

- **Strategy:** JWT-based sessions
- **Session Duration:** 8 hours inactivity, 24 hours absolute maximum
- **Provider:** Credentials (email/password)
- **Password Hashing:** bcrypt with salt

**Role-Based Access Control:**
```typescript
verifyAdminOnly() // Admin-only routes
verifyAdminOrStaff() // Admin and Staff routes
```

### 8.4 Rate Limiting

**Implementation:** `lib/rate-limit.ts`

Token bucket algorithm via Upstash Redis:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Booking | 5 requests | 60 seconds |
| Lookup | 10 requests | 60 seconds |
| Lookup (tight) | 3 requests | 60 seconds |

### 8.5 CSRF Protection

API routes implement double-submit pattern:
- Origin header validation
- X-Requested-With header requirement
- SameSite cookie attributes

### 8.6 Input Validation

All API inputs validated via Zod schemas:
- Request body validation
- Query parameter sanitization
- Type coercion and transformation

---

## 9. Testing Strategy

### Unit Tests (Vitest)

**Location:** `components/__tests__/`, `app/api/admin/__tests__/`

**Coverage:**
- Component rendering tests
- Booking form validation
- API response handling
- Utility functions

**Run Command:**
```bash
pnpm test          # Run once
pnpm test:watch    # Watch mode
```

### End-to-End Tests (Playwright)

**Location:** `e2e/`

**Test Suites:**

| File | Coverage |
|------|----------|
| `basic.spec.ts` | Basic app functionality |
| `homepage.spec.ts` | Homepage rendering |
| `booking-flow.spec.ts` | Complete booking journey |
| `auth.spec.ts` | Authentication flows |
| `admin-dashboard.spec.ts` | Admin functionality |
| `appointment-lookup.spec.ts` | Lookup feature |
| `api-integration.spec.ts` | API contracts |
| `services.spec.ts` | Service management |
| `accessibility.spec.ts` | WCAG compliance |

**Run Command:**
```bash
pnpm test:e2e
```

---

## 10. Deployment

### Platform: Vercel

The application is optimized for Vercel deployment with:
- Edge functions for API routes
- Static generation for public pages
- Incremental Static Regeneration (ISR) for semi-dynamic content

### CI/CD Pipeline

**Configuration:** `.github/workflows/pipeline.yml`

1. **Build Stage:**
   - Install dependencies
   - Run linting
   - Build Next.js application
   - Run unit tests

2. **Deploy Stage:**
   - Deploy to Vercel (preview for PRs, production for main branch)
   - Run database migrations

### Environment Variables

See `.env.example` for required configuration:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | Direct DB connection for migrations |
| `NEXTAUTH_URL` | Yes | Application URL |
| `NEXTAUTH_SECRET` | Yes | Session signing key |
| `NEXT_PUBLIC_ENCRYPTION_KEY` | Yes | Field encryption key |
| `SMTP_*` | No | Email service |
| `UPSTASH_REDIS_*` | No | Rate limiting |
| `TWILIO_*` | No | SMS/OTP |
| `RECAPTCHA_*` | No | Bot protection |

---

## 11. Project Structure

```
nails-management-booking/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/                # Admin endpoints
│   │   │   ├── appointments/
│   │   │   ├── customers/
│   │   │   ├── notifications/
│   │   │   ├── payroll/
│   │   │   ├── revenue/
│   │   │   ├── service-categories/
│   │   │   ├── services/
│   │   │   └── staff/
│   │   ├── appointments/         # Public appointments
│   │   ├── auth/                 # NextAuth handlers
│   │   ├── otp/                  # OTP verification
│   │   ├── reviews/              # Reviews
│   │   └── upload/               # File uploads
│   ├── admin/                    # Admin pages
│   │   ├── (dashboard)/          # Dashboard home
│   │   ├── appointments/         # Appointment management
│   │   ├── categories/           # Service categories
│   │   ├── customers/            # Customer management
│   │   ├── payroll/              # Payroll system
│   │   ├── revenue/              # Revenue reports
│   │   ├── schedule/             # Schedule management
│   │   ├── services/             # Service management
│   │   ├── staff/                # Staff management
│   │   └── statistics/           # Statistics
│   ├── book/                     # Booking page
│   ├── login/                    # Login page
│   ├── lookup/                   # Appointment lookup
│   ├── review/                   # Review submission
│   ├── services/                 # Services catalog
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # React components
│   ├── __tests__/                # Component tests
│   ├── booking-form.tsx          # Main booking form
│   ├── header.tsx                # Navigation header
│   ├── hero-section.tsx          # Hero banner
│   ├── services-section.tsx      # Services display
│   ├── team-section.tsx          # Staff showcase
│   └── testimonials-section.tsx  # Customer reviews
├── db/                           # Database layer
│   ├── index.ts                  # Drizzle client
│   └── schema.ts                 # Schema definitions
├── drizzle/                      # Migrations
│   ├── meta/                     # Migration metadata
│   └── *.sql                     # Migration files
├── e2e/                          # E2E tests
├── hooks/                        # React hooks
│   ├── use-debounce.ts           # Debounce hook
│   ├── use-mobile.ts             # Mobile detection
│   └── use-toast.ts              # Toast notifications
├── lib/                          # Utility libraries
│   ├── api-middleware.ts         # API middleware
│   ├── api-response.ts           # Response helpers
│   ├── auth.ts                   # NextAuth config
│   ├── crypto.ts                 # Encryption utilities
│   ├── email-service.ts          # Email sending
│   ├── logger.ts                 # Logging utility
│   └── rate-limit.ts             # Rate limiting
├── public/                       # Static assets
│   └── uploads/                  # User uploads
├── scripts/                      # Utility scripts
│   ├── database-schema.sql       # SQL schema export
│   ├── migrate.ts                # Migration runner
│   └── populate-hashes.ts        # Hash migration
├── package.json                  # Dependencies
├── drizzle.config.ts             # Drizzle configuration
├── playwright.config.ts          # E2E test config
├── tsconfig.json                 # TypeScript config
└── vitest.config.ts              # Unit test config
```

---

## 12. Configuration & Environment

### Package Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Production server |
| `lint` | `next lint` | ESLint check |
| `test` | `vitest run` | Unit tests |
| `test:e2e` | `playwright test` | E2E tests |
| `db:generate` | `drizzle-kit generate` | Generate migrations |
| `db:migrate` | `tsx scripts/migrate.ts` | Run migrations |
| `db:push` | `drizzle-kit push` | Push schema changes |
| `db:seed` | `tsx seed.ts` | Seed database |

### Key Dependencies

**Production:**
- `@neondatabase/serverless` - Serverless Postgres driver
- `drizzle-orm` - Type-safe ORM
- `next-auth` - Authentication
- `bcryptjs` - Password hashing
- `nodemailer` - Email service
- `@upstash/ratelimit` - Rate limiting
- `@vercel/blob` - File storage
- `@sentry/nextjs` - Error tracking

**Development:**
- `drizzle-kit` - Migration tooling
- `@playwright/test` - E2E testing
- `vitest` - Unit testing
- `tsx` - TypeScript execution

---

## 13. Recommendations

### 13.1 Performance Optimizations

1. **Implement caching layer**
   - Cache service catalog and categories (rarely change)
   - Use Next.js `unstable_cache` or Redis caching
   - Implement stale-while-revalidate for staff availability

2. **Optimize database queries**
   - Add composite indexes for common query patterns
   - Consider read replicas for reporting queries
   - Implement connection pooling

3. **Image optimization**
   - Use Next.js Image component throughout
   - Implement responsive images with srcset
   - Consider CDN for static assets

### 13.2 Feature Enhancements

1. **Booking improvements**
   - Add appointment reminders (SMS/Email)
   - Implement waitlist for fully booked slots
   - Add recurring appointment support
   - Multi-location support

2. **Customer experience**
   - Customer accounts with appointment history
   - Loyalty program integration
   - Gift card system
   - Service packages/bundles

3. **Staff management**
   - Time-off request system
   - Performance analytics per staff
   - Commission tier management

4. **Reporting**
   - Export to PDF/Excel
   - Custom date range reports
   - Predictive analytics

### 13.3 Security Enhancements

1. **Add security headers middleware**
   - CSP (Content Security Policy)
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options

2. **Implement audit logging**
   - Track all admin actions
   - Login attempt monitoring
   - Data access logging

3. **Add 2FA for admin accounts**
   - TOTP support
   - SMS backup

### 13.4 Code Quality

1. **Add API documentation**
   - OpenAPI/Swagger specification
   - API versioning strategy

2. **Improve test coverage**
   - Aim for 80%+ coverage
   - Add integration tests
   - Visual regression tests

3. **Type safety improvements**
   - Stricter TypeScript config
   - Branded types for IDs
   - Runtime type guards

### 13.5 DevOps

1. **Add monitoring**
   - Application performance monitoring (APM)
   - Database query performance
   - Error tracking dashboards

2. **Backup strategy**
   - Automated database backups
   - Point-in-time recovery
   - Backup verification tests

3. **Staging environment**
   - Separate staging deployment
   - Production-like data (anonymized)
   - E2E tests against staging

---

## Appendix: Quick Reference

### Default Admin Credentials (Seed Data)

After running `pnpm db:seed`, use these credentials:
- Admin: `admin@nails.com` / `[SEED_ADMIN_PASSWORD]`
- Staff: `staff@nails.com` / `[SEED_STAFF_PASSWORD]`

### Useful Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm db:seed               # Seed database

# Testing
pnpm test                  # Unit tests
pnpm test:e2e              # E2E tests

# Database
pnpm db:generate           # Create migration
pnpm db:migrate            # Apply migrations
pnpm db:push               # Push schema (dev)

# Build
pnpm build                 # Production build
pnpm start                 # Start production
```

---

*Report generated by OpenCode - Development Assistant*  
*Last updated: July 15, 2026*
