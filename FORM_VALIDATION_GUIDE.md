# Form Validation Guide - Appointment Booking System

## 📋 Overview

Toàn bộ form trong hệ thống đã được cung cấp validation kĩ lưỡng. Validation được thực hiện ở 2 lớp:

1. **Frontend (Form Dialog/Component)** - Kiểm tra input lúc nhập
2. **Backend (API Route)** - Kiểm tra dữ liệu trước khi lưu vào database

---

## 🔧 Validation Utility Functions

### Location: `/lib/form-validation.ts`

Tất cả hàm validation tập trung trong 1 file duy nhất để dễ quản lý và tái sử dụng.

#### String Validations

##### 1. `validateName(name: string, fieldName?: string)`
- **Purpose**: Validate tên (nhân viên, khách hàng, dịch vụ, etc.)
- **Rules**:
  - ✓ Required (bắt buộc)
  - ✓ Min: 2 ký tự
  - ✓ Max: 255 ký tự
- **Example**:
```typescript
const result = validateName(formData.name, 'Tên nhân viên')
if (!result.valid) toast.error(result.error)
```

##### 2. `validateEmail(email: string, required?: boolean)`
- **Purpose**: Validate email address
- **Rules**:
  - ✓ Optional (tùy chọn)
  - ✓ Format: `name@domain.com`
  - ✓ Max: 255 ký tự
- **Example**:
```typescript
const result = validateEmail(email, false) // optional email
```

##### 3. `validatePhone(phone: string, required?: boolean)`
- **Purpose**: Validate Vietnamese phone number
- **Rules**:
  - ✓ Required/Optional
  - ✓ Length: 10-11 digits
  - ✓ Removes non-digit characters
- **Example**:
```typescript
const result = validatePhone(customerPhone, true)
```

##### 4. `validateText(text: string, fieldName: string, minLength: number, maxLength: number, required?: boolean)`
- **Purpose**: Generic text validation
- **Example**:
```typescript
validateText(position, 'Chức vụ', 0, 100) // Max 100 chars
```

#### Number Validations

##### 5. `validateNumber(value: any, fieldName: string, options: {...})`
- **Purpose**: Validate any numeric value
- **Options**:
  - `required`: boolean (default: false)
  - `min`: number (default: 0)
  - `max`: number (default: 999999999)
  - `integer`: boolean (default: false)
- **Example**:
```typescript
validateNumber(duration, 'Thời lượng', {
  required: true,
  min: 15,
  max: 480,
  integer: true
})
```

##### 6. `validateSalary(salary: any)`
- **Purpose**: Validate employee salary
- **Rules**:
  - ✓ Optional
  - ✓ Min: 0
  - ✓ Max: 999,999,999
  - ✓ Must be integer
- **Example**:
```typescript
const result = validateSalary(formData.baseSalary)
```

##### 7. `validatePrice(price: any, required?: boolean)`
- **Purpose**: Validate service/product price
- **Rules**:
  - ✓ Must be > 0
  - ✓ Max: 999,999,999
- **Example**:
```typescript
validatePrice(servicePrice, true)
```

##### 8. `validateDuration(duration: any, required?: boolean)`
- **Purpose**: Validate service duration (in minutes)
- **Rules**:
  - ✓ Must be positive integer
  - ✓ Max: 480 minutes (8 hours)
- **Example**:
```typescript
validateDuration(duration, true)
```

#### Array Validations

##### 9. `validateArray(arr: any, fieldName: string, options: {...})`
- **Purpose**: Validate array selections
- **Options**:
  - `required`: boolean (default: false)
  - `minItems`: number (default: 0)
  - `maxItems`: number (default: 100)
- **Example**:
```typescript
validateArray(selectedServices, 'dịch vụ', {
  required: true,
  minItems: 1
})
```

#### Time Validations

##### 10. `validateTime(time: string)`
- **Purpose**: Validate time format (HH:MM)
- **Example**:
```typescript
validateTime('09:00') // ✓ Valid
validateTime('9:00')  // ✗ Invalid
```

##### 11. `validateTimeRange(startTime: string, endTime: string)`
- **Purpose**: Validate time range (start < end)
- **Example**:
```typescript
validateTimeRange('09:00', '17:00') // ✓ Valid
validateTimeRange('17:00', '09:00') // ✗ Invalid
```

#### Combined Validations

##### 12. `validateStaffForm(data: {...})`
- **Purpose**: Validate entire staff form
- **Validates**:
  - name (required, 2-255)
  - phone (required, 10-11 digits)
  - email (optional, valid format)
  - position (optional, max 100)
  - experience (optional, max 50)
  - baseSalary (optional, valid number)
  - specialties (optional, max 255)

##### 13. `validateServiceForm(data: {...})`
- **Purpose**: Validate entire service form
- **Validates**:
  - name (required, 2-255)
  - description (optional, max 1000)
  - price (required, > 0)
  - duration (required, positive integer)

##### 14. `validateCategoryForm(data: {...})`
- **Purpose**: Validate category form
- **Validates**:
  - name (required, 2-255)
  - description (optional, max 1000)

##### 15. `validateBookingForm(data: {...})`
- **Purpose**: Validate booking/appointment form
- **Validates**:
  - customerName (required, 2-255)
  - customerPhone (required, 10-11 digits)
  - customerEmail (optional, valid format)
  - notes (optional, max 1000)

#### Input Sanitization

##### Helper Functions
- `sanitizeText(text: string)` - Trim whitespace
- `sanitizePhone(phone: string)` - Remove non-digit chars
- `sanitizeNumber(value: any)` - Convert to number or null
- `sanitizeEmail(email: string)` - Trim and lowercase
- `sanitizeSpecialties(specialties: string)` - Split by comma into array

---

## 📝 Form Components Using Validation

### 1. Staff Form Dialog
**File**: `components/admin/staff-form-dialog.tsx`

**Validated Fields**:
- ✓ Name (2-255 chars)
- ✓ Phone (10-11 digits)
- ✓ Email (optional, valid format)
- ✓ Position (max 100 chars)
- ✓ Experience (max 50 chars)
- ✓ Base Salary (positive integer)
- ✓ Avatar Upload (image file only, max 5MB)
- ✓ Specialties (max 255 chars)

**Input Filtering**:
- Phone: Only digits and separators (+, -, ())
- Experience: Only numbers and Vietnamese keywords
- BaseSalary: Only digits, auto-resets if negative

**API Validation**: POST/PUT `/api/admin/staff` and `/api/admin/staff/[id]`

### 2. Service Form
**File**: `components/admin/service-form.tsx`

**Validated Fields**:
- ✓ Name (2-255 chars)
- ✓ Category (required)
- ✓ Price (must be > 0)
- ✓ Duration (15-480 minutes)
- ✓ Description (optional, max 1000)
- ✓ Image Upload (max file size check)

**API Validation**: POST/PUT `/api/admin/services` and `/api/admin/services/[id]`

### 3. Booking Form
**File**: `components/booking-form.tsx`

**Validated Fields**:
- ✓ Customer Name (2-255 chars)
- ✓ Customer Phone (10-11 digits)
- ✓ Customer Email (optional, valid format)
- ✓ Notes (optional, max 1000)
- ✓ Services Selected (at least 1)
- ✓ Date & Time (valid and not in past)
- ✓ Staff Assignment (available staff)

**API Validation**: POST `/api/appointments`

### 4. Admin Login Form
**File**: `components/admin/admin-login-form.tsx`

**Validated Fields**:
- ✓ Email (required, valid format)
- ✓ Password (required, min 1 char)

**No API validation needed** (handled by NextAuth)

---

## 🛡️ Validation Flow

### Frontend → Backend

```
┌─────────────────────────────┐
│   User Inputs Form Data     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│  Input Filtering/Sanitize   │
│  (handleChange function)    │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│  Form Submit Validation     │
│  (validateXxxForm function) │
└──────────────┬──────────────┘
               ↓
        ✓ Valid?  ✗ Invalid
               │          │
               ↓          ↓
            POST      Show Error
            API       Message
               │
               ↓
┌─────────────────────────────┐
│    API Endpoint Validation  │
│    (Server-side check)      │
└──────────────┬──────────────┘
               ↓
        ✓ Valid?  ✗ Invalid
               │          │
               ↓          ↓
          Save DB    Return 400
                    Error Code
```

---

## 📊 Validation Summary Table

| Component | Fields | Input Type | Required | Validation |
|-----------|--------|-----------|----------|------------|
| **Staff Form** | name | text | Yes | 2-255 chars |
| | phone | text | Yes | 10-11 digits |
| | email | email | No | Valid email format |
| | position | text | No | Max 100 chars |
| | experience | text | No | Max 50 chars |
| | baseSalary | number | No | Positive integer, max 999M |
| | specialties | text | No | Max 255 chars |
| | avatar | file | No | Image only, max 5MB |
| **Service Form** | name | text | Yes | 2-255 chars |
| | category | select | Yes | Required |
| | price | number | Yes | > 0, max 999M |
| | duration | number | Yes | 15-480 minutes |
| | description | textarea | No | Max 1000 chars |
| **Booking Form** | customerName | text | Yes | 2-255 chars |
| | customerPhone | text | Yes | 10-11 digits |
| | customerEmail | email | No | Valid email format |
| | notes | textarea | No | Max 1000 chars |
| | services | checkbox | Yes | Min 1 selected |
| **Login Form** | email | email | Yes | Valid email format |
| | password | password | Yes | Min 1 char |

---

## 🚀 How to Use Validation in New Forms

### Step 1: Import validation function
```typescript
import { validateStaffForm } from '@/lib/form-validation'
```

### Step 2: Add to handleSubmit
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const validation = validateStaffForm({
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    // ... other fields
  })

  if (!validation.valid) {
    toast.error(validation.error)
    return
  }

  // Continue with API call
  setLoading(true)
  // ...
}
```

### Step 3: Optional - Add input filtering
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target

  if (name === 'phone') {
    // Only allow digits and separators
    const filtered = value.replace(/[^\d\s\-\+()]/g, '')
    setFormData(prev => ({ ...prev, [name]: filtered }))
  } else if (name === 'baseSalary') {
    // Only allow digits
    const numOnly = value.replace(/[^\d]/g, '')
    setFormData(prev => ({ ...prev, [name]: numOnly }))
  } else {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
}
```

---

## ✨ Error Messages (Vietnamese)

| Error | Message |
|-------|---------|
| Empty Required Field | "Vui lòng nhập [field name]" |
| Min Length | "[field name] phải có ít nhất X ký tự" |
| Max Length | "[field name] không được vượt quá X ký tự" |
| Invalid Email | "Email không hợp lệ" |
| Invalid Phone | "Số điện thoại không hợp lệ (phải có 10-11 chữ số)" |
| Not A Number | "[field name] phải là một số" |
| Negative Number | "[field name] không được là số âm" |
| Invalid Time | "Thời gian không hợp lệ (HH:MM)" |
| Invalid Time Range | "Giờ kết thúc phải sau giờ bắt đầu" |

---

## 🔐 Security Notes

1. **Frontend Validation**: For UX only, can be bypassed
2. **Backend Validation**: **MANDATORY** - prevents invalid data entry
3. **Type Checking**: TypeScript ensures type safety
4. **SQL Injection**: Protected by Drizzle ORM parameterized queries
5. **XSS Protection**: Input sanitization + React automatic escaping

---

## 📈 Build Size Impact

After adding comprehensive validation:
- `/admin/staff`: 13.9 kB → **14.6 kB** (+0.7 kB)
- `/admin/services`: 9.44 kB → **10.5 kB** (+1.06 kB)
- `/login`: 3.43 kB → **4.5 kB** (+1.07 kB)
- `/book`: 5.5 kB → **5.5 kB** (no change)

All changes are minimal and acceptable.

---

## ✅ Validation Checklist

- [x] Staff Form: Name, Phone, Email, Position, Experience, Salary, Avatar, Specialties
- [x] Service Form: Name, Category, Price, Duration, Description
- [x] Booking Form: Name, Phone, Email, Notes, Services, Date, Time, Staff
- [x] Category Form: Name, Description
- [x] Login Form: Email, Password
- [x] Input Filtering: Phone, Experience, BaseSalary in form dialogs
- [x] API Validation: POST/PUT endpoints for staff, services, appointments
- [x] Error Messages: All in Vietnamese
- [x] Type Safety: TypeScript validation
- [x] Reusable Functions: Centralized in `/lib/form-validation.ts`

---

## 🔗 Related Files

- **Validation Utilities**: `/lib/form-validation.ts`
- **Staff Form Dialog**: `/components/admin/staff-form-dialog.tsx`
- **Service Form**: `/components/admin/service-form.tsx`
- **Booking Form**: `/components/booking-form.tsx`
- **Admin Login**: `/components/admin/admin-login-form.tsx`
- **Staff API**: `/app/api/admin/staff/route.ts`
- **Staff Detail API**: `/app/api/admin/staff/[id]/route.ts`

---

**Last Updated**: 23 tháng 11, 2025
**Status**: ✅ Production Ready
