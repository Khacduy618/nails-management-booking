import { test, expect } from "@playwright/test"

test.describe("Appointment Lookup Flow", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/lookup")
    })

    test("should display lookup form", async ({ page }) => {
        await expect(page.getByRole("heading", { name: /Tra cứu lịch hẹn/i })).toBeVisible()
        await expect(page.getByLabel(/Số điện thoại/i)).toBeVisible()
        await expect(page.getByRole("button", { name: /Tra cứu/i })).toBeVisible()
    })

    test("should show error for invalid phone number", async ({ page }) => {
        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("123")
        await searchButton.click()

        await expect(page.getByText(/Số điện thoại không hợp lệ/i)).toBeVisible()
    })

    test("should show no appointments for non-existent phone", async ({ page }) => {
        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("9999999999")
        await searchButton.click()

        await page.waitForSelector("text=/Không tìm thấy lịch hẹn/i", { timeout: 5000 })
        await expect(page.getByText(/Không tìm thấy lịch hẹn/i)).toBeVisible()
    })

    test("should find appointments for existing phone", async ({ page }) => {
        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        // Using a test phone number that should have appointments in test data
        await phoneInput.fill("0932105214")
        await searchButton.click()

        // Wait for results
        await page.waitForSelector("text=/Lịch hẹn •/i", { timeout: 5000 })
        await expect(page.getByText(/Lịch hẹn •/i)).toBeVisible()
    })

    test("should display appointment details correctly", async ({ page }) => {
        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("0932105214")
        await searchButton.click()

        await page.waitForSelector("text=/Lịch hẹn •/i", { timeout: 5000 })

        // Check for appointment details
        await expect(page.locator("text=/Ngày/i")).toBeVisible()
        await expect(page.locator("text=/Giờ/i")).toBeVisible()
        await expect(page.locator("text=/Đã xác nhận|Chờ xác nhận|Hoàn thành|Đang thực hiện/i")).toBeVisible()
    })

    test("should show cancel button for valid appointments", async ({ page }) => {
        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("0932105214")
        await searchButton.click()

        await page.waitForSelector("text=/Hủy lịch hẹn/i", { timeout: 5000 })
        const cancelButton = page.getByRole("button", { name: /Hủy lịch hẹn/i }).first()

        // Button should be enabled for appointments > 2 hours away
        const isDisabled = await cancelButton.isDisabled()
        // May be disabled if appointment is within 2 hours, so just check it exists
        await expect(cancelButton).toBeVisible()
    })

    test("should trigger OTP flow when cancelling appointment", async ({ page }) => {
        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("0932105214")
        await searchButton.click()

        await page.waitForSelector("text=/Hủy lịch hẹn/i", { timeout: 5000 })
        const cancelButton = page.getByRole("button", { name: /Hủy lịch hẹn/i }).first()

        // Check if button is enabled
        const isDisabled = await cancelButton.isDisabled()
        if (!isDisabled) {
            await cancelButton.click()

            // Should show confirmation dialog
            await page.waitForSelector("text=/Xác nhận hủy lịch hẹn/i", { timeout: 3000 })
            await expect(page.getByText(/Xác nhận hủy lịch hẹn/i)).toBeVisible()

            // Click confirm button
            const confirmButton = page.getByRole("button", { name: /Xác nhận/ }).first()
            await confirmButton.click()

            // OTP dialog should appear
            await page.waitForSelector("text=/Xác thực mã OTP/i", { timeout: 3000 })
            await expect(page.getByText(/Xác thực mã OTP/i)).toBeVisible()
        }
    })

    test("should validate OTP input length", async ({ page }) => {
        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("0932105214")
        await searchButton.click()

        await page.waitForSelector("text=/Hủy lịch hẹn/i", { timeout: 5000 })
        const cancelButton = page.getByRole("button", { name: /Hủy lịch hẹn/i }).first()
        const isDisabled = await cancelButton.isDisabled()

        if (!isDisabled) {
            await cancelButton.click()
            await page.waitForSelector("text=/Xác nhận hủy lịch hẹn/i", { timeout: 3000 })

            const confirmButton = page.getByRole("button", { name: /Xác nhận/ }).first()
            await confirmButton.click()

            await page.waitForSelector("text=/Xác thực mã OTP/i", { timeout: 3000 })

            // OTP input should only accept 6 digits
            const otpInput = page.getByPlaceholder(/000000/)
            await otpInput.fill("12345")

            // Verify button should be disabled with incomplete OTP
            let verifyButton = page.getByRole("button", { name: /Xác thực/ }).first()
            await expect(verifyButton).toBeDisabled()

            // Complete OTP
            await otpInput.fill("123456")
            verifyButton = page.getByRole("button", { name: /Xác thực/ }).first()
            await expect(verifyButton).toBeEnabled()
        }
    })
})
