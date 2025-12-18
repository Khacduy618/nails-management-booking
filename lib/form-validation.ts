/**
 * Form Validation Utilities
 * Centralized validation functions for all forms in the application
 */

export interface ValidationResult {
    valid: boolean
    error?: string
}

// ===== STRING VALIDATIONS =====

export const validateName = (name: string, fieldName: string = 'Tên'): ValidationResult => {
    if (!name || !name.trim()) {
        return { valid: false, error: `Vui lòng nhập ${fieldName}` }
    }
    if (name.trim().length < 2) {
        return { valid: false, error: `${fieldName} phải có ít nhất 2 ký tự` }
    }
    if (name.trim().length > 255) {
        return { valid: false, error: `${fieldName} không được vượt quá 255 ký tự` }
    }
    return { valid: true }
}

export const validateEmail = (email: string, required = false): ValidationResult => {
    if (!email.trim()) {
        if (required) {
            return { valid: false, error: 'Vui lòng nhập email' }
        }
        return { valid: true }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
        return { valid: false, error: 'Email không hợp lệ' }
    }
    if (email.trim().length > 255) {
        return { valid: false, error: 'Email không được vượt quá 255 ký tự' }
    }
    return { valid: true }
}

export const validatePhone = (phone: string, required = true): ValidationResult => {
    if (!phone.trim()) {
        if (required) {
            return { valid: false, error: 'Vui lòng nhập số điện thoại' }
        }
        return { valid: true }
    }

    const phoneDigits = phone.replace(/\D/g, '')
    if (!/^\d{10,11}$/.test(phoneDigits)) {
        return { valid: false, error: 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)' }
    }
    return { valid: true }
}

export const validateText = (text: string, fieldName: string, minLength = 0, maxLength = 255, required = false): ValidationResult => {
    if (!text.trim()) {
        if (required) {
            return { valid: false, error: `Vui lòng nhập ${fieldName}` }
        }
        return { valid: true }
    }

    if (text.trim().length < minLength) {
        return { valid: false, error: `${fieldName} phải có ít nhất ${minLength} ký tự` }
    }
    if (text.trim().length > maxLength) {
        return { valid: false, error: `${fieldName} không được vượt quá ${maxLength} ký tự` }
    }
    return { valid: true }
}

// ===== NUMBER VALIDATIONS =====

export const validateNumber = (value: any, fieldName: string, options: {
    required?: boolean
    min?: number
    max?: number
    integer?: boolean
} = {}): ValidationResult => {
    const { required = false, min = 0, max = 999999999, integer = false } = options

    if (value === '' || value === null || value === undefined) {
        if (required) {
            return { valid: false, error: `Vui lòng nhập ${fieldName}` }
        }
        return { valid: true }
    }

    const numValue = Number(value)
    if (isNaN(numValue)) {
        return { valid: false, error: `${fieldName} phải là một số` }
    }

    if (integer && !Number.isInteger(numValue)) {
        return { valid: false, error: `${fieldName} phải là số nguyên` }
    }

    if (numValue < min) {
        return { valid: false, error: `${fieldName} không được nhỏ hơn ${min}` }
    }

    if (numValue > max) {
        return { valid: false, error: `${fieldName} không được vượt quá ${max}` }
    }

    return { valid: true }
}

export const validateSalary = (salary: any): ValidationResult => {
    return validateNumber(salary, 'Lương', {
        required: false,
        min: 0,
        max: 999999999,
        integer: true,
    })
}

export const validatePrice = (price: any, required = true): ValidationResult => {
    if (price === '' || price === null || price === undefined) {
        if (required) {
            return { valid: false, error: 'Vui lòng nhập giá' }
        }
        return { valid: true }
    }

    const numValue = Number(price)
    if (isNaN(numValue) || numValue <= 0) {
        return { valid: false, error: 'Giá phải lớn hơn 0' }
    }
    if (numValue > 999999999) {
        return { valid: false, error: 'Giá quá lớn' }
    }
    return { valid: true }
}

export const validateDuration = (duration: any, required = true): ValidationResult => {
    if (duration === '' || duration === null || duration === undefined) {
        if (required) {
            return { valid: false, error: 'Vui lòng nhập thời lượng' }
        }
        return { valid: true }
    }

    const numValue = Number(duration)
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
        return { valid: false, error: 'Thời lượng phải là một số nguyên dương' }
    }
    if (numValue > 480) { // 8 hours max
        return { valid: false, error: 'Thời lượng không được vượt quá 480 phút (8 giờ)' }
    }
    return { valid: true }
}

// ===== ARRAY VALIDATIONS =====

export const validateArray = (arr: any, fieldName: string, options: {
    required?: boolean
    minItems?: number
    maxItems?: number
} = {}): ValidationResult => {
    const { required = false, minItems = 0, maxItems = 100 } = options

    if (!Array.isArray(arr) || arr.length === 0) {
        if (required) {
            return { valid: false, error: `Vui lòng chọn ít nhất một ${fieldName}` }
        }
        return { valid: true }
    }

    if (arr.length < minItems) {
        return { valid: false, error: `Phải chọn ít nhất ${minItems} ${fieldName}` }
    }

    if (arr.length > maxItems) {
        return { valid: false, error: `Không được chọn quá ${maxItems} ${fieldName}` }
    }

    return { valid: true }
}

// ===== TIME VALIDATIONS =====

export const validateTime = (time: string): ValidationResult => {
    if (!time.trim()) {
        return { valid: false, error: 'Vui lòng chọn thời gian' }
    }

    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(time.trim())) {
        return { valid: false, error: 'Thời gian không hợp lệ (HH:MM)' }
    }

    return { valid: true }
}

export const validateTimeRange = (startTime: string, endTime: string): ValidationResult => {
    const startValidation = validateTime(startTime)
    if (!startValidation.valid) return startValidation

    const endValidation = validateTime(endTime)
    if (!endValidation.valid) return endValidation

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (startMinutes >= endMinutes) {
        return { valid: false, error: 'Giờ kết thúc phải sau giờ bắt đầu' }
    }

    return { valid: true }
}

// ===== COMBINED VALIDATIONS =====

export const validateStaffForm = (data: {
    name: string
    phone: string
    email?: string
    position?: string
    experience?: string
    baseSalary?: string
    specialties?: string
}): ValidationResult => {
    // Name
    let result = validateName(data.name, 'Tên nhân viên')
    if (!result.valid) return result

    // Phone
    result = validatePhone(data.phone)
    if (!result.valid) return result

    // Email
    if (data.email) {
        result = validateEmail(data.email)
        if (!result.valid) return result
    }

    // Position
    if (data.position) {
        result = validateText(data.position, 'Chức vụ', 0, 100)
        if (!result.valid) return result
    }

    // Experience
    if (data.experience) {
        result = validateText(data.experience, 'Kinh nghiệm', 0, 50)
        if (!result.valid) return result
    }

    // Base Salary
    if (data.baseSalary) {
        result = validateSalary(data.baseSalary)
        if (!result.valid) return result
    }

    // Specialties
    if (data.specialties) {
        result = validateText(data.specialties, 'Chuyên môn', 0, 255)
        if (!result.valid) return result
    }

    return { valid: true }
}

export const validateServiceForm = (data: {
    name: string
    description?: string
    price: string
    duration: string
    categoryId?: string
}): ValidationResult => {
    // Name
    let result = validateName(data.name, 'Tên dịch vụ')
    if (!result.valid) return result

    // Description
    if (data.description) {
        result = validateText(data.description, 'Mô tả', 0, 1000)
        if (!result.valid) return result
    }

    // Price
    result = validatePrice(data.price, true)
    if (!result.valid) return result

    // Duration
    result = validateDuration(data.duration, true)
    if (!result.valid) return result

    return { valid: true }
}

export const validateCategoryForm = (data: {
    name: string
    description?: string
}): ValidationResult => {
    // Name
    let result = validateName(data.name, 'Tên danh mục')
    if (!result.valid) return result

    // Description
    if (data.description) {
        result = validateText(data.description, 'Mô tả', 0, 1000)
        if (!result.valid) return result
    }

    return { valid: true }
}

export const validateBookingForm = (data: {
    customerName: string
    customerPhone: string
    customerEmail?: string
    notes?: string
}): ValidationResult => {
    // Name
    let result = validateName(data.customerName, 'Tên khách hàng')
    if (!result.valid) return result

    // Phone
    result = validatePhone(data.customerPhone)
    if (!result.valid) return result

    // Email
    if (data.customerEmail) {
        result = validateEmail(data.customerEmail)
        if (!result.valid) return result
    }

    // Notes
    if (data.notes) {
        result = validateText(data.notes, 'Ghi chú', 0, 1000)
        if (!result.valid) return result
    }

    return { valid: true }
}

// ===== INPUT SANITIZATION =====

export const sanitizeText = (text: string): string => {
    return text.trim()
}

export const sanitizePhone = (phone: string): string => {
    return phone.replace(/\D/g, '')
}

export const sanitizeNumber = (value: any): number | null => {
    const num = Number(value)
    return isNaN(num) ? null : num
}

export const sanitizeEmail = (email: string): string => {
    return email.trim().toLowerCase()
}

export const sanitizeSpecialties = (specialties: string): string[] => {
    return specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
}
