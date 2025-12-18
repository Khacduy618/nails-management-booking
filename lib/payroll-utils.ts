/**
 * Payroll calculation utilities
 * Tính toán lương dựa trên:
 * - Lương cứng
 * - Hoa hồng từ các bill hoàn thành
 * 
 * Hoa hồng:
 * - 10%: Làm trong giờ hành chính (9:00-18:00), hoàn thành 100% bill
 * - 5%: Làm trong giờ hành chính, hoàn thành 50% bill
 * - 30%: Làm ngoài giờ hành chính, hoàn thành 100% bill
 */

export interface CommissionCalculation {
    appointmentServiceId: number
    staffId: number
    price: number
    workShare: number // 50-100
    isOvertime: boolean // Ngoài giờ hành chính?
    commissionPercentage: number // Tự động tính
    commissionAmount: number
}

export interface PayrollData {
    staffId: number
    staffName: string
    payPeriodStart: string
    payPeriodEnd: string
    baseSalary: number
    commissions: CommissionCalculation[]
    totalCommission: number
    totalBonus: number
    totalDeduction: number
    finalSalary: number
}

/**
 * Tính % hoa hồng dựa trên điều kiện
 */
export function calculateCommissionPercentage(
    workShare: number, // 50-100
    isOvertime: boolean
): number {
    // 30%: Ngoài giờ hành chính + 100% công việc
    if (isOvertime && workShare === 100) {
        return 30
    }

    // 10%: Trong giờ hành chính + 100% công việc
    if (!isOvertime && workShare === 100) {
        return 10
    }

    // 5%: Trong giờ hành chính + 50% công việc
    if (!isOvertime && workShare === 50) {
        return 5
    }

    // Default: 0 (không tính hoa hồng nếu không đủ điều kiện)
    return 0
}

/**
 * Tính tiền hoa hồng từ một bill
 */
export function calculateCommissionAmount(
    price: number,
    workShare: number,
    isOvertime: boolean
): number {
    const percentage = calculateCommissionPercentage(workShare, isOvertime)
    const adjustedPrice = (price * workShare) / 100
    return (adjustedPrice * percentage) / 100
}

/**
 * Tính lương cuối cùng
 */
export function calculateFinalSalary(
    baseSalary: number,
    totalCommission: number,
    totalBonus: number = 0,
    totalDeduction: number = 0
): number {
    return baseSalary + totalCommission + totalBonus - totalDeduction
}

/**
 * Format tiền tệ
 */
export function formatCurrency(amount: number | null): string {
    if (!amount) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}

/**
 * Format tháng năm
 */
export function formatMonthYear(dateStr: string): string {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getFullYear()}`
}
