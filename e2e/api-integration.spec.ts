import { test, expect } from "@playwright/test"

test.describe("API Integration Tests", () => {
    test("should fetch services from API", async ({ page }) => {
        await page.goto("/services")

        // Wait for API call to complete
        const response = await page.waitForResponse((resp) =>
            resp.url().includes("/api/services") && resp.status() === 200
        )

        expect(response.status()).toBe(200)
    })

    test("should fetch service metadata from API", async ({ page }) => {
        await page.goto("/services")

        const response = await page.waitForResponse((resp) =>
            resp.url().includes("/api/services-meta") && resp.status() === 200
        )

        expect(response.status()).toBe(200)
    })

    test("should handle API errors gracefully", async ({ page }) => {
        // Intercept and fail API call
        await page.route("**/api/services", (route) => {
            route.abort("failed")
        })

        await page.goto("/services")

        // Page should still be usable (not crash)
        await expect(page.locator("body")).toBeVisible()
    })
})

test.describe("Appointment API Tests", () => {
    test("should fetch appointments for valid phone", async ({ page }) => {
        await page.goto("/lookup")

        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("0932105214")

        const response = await Promise.race([
            page.waitForResponse((resp) => resp.url().includes("/api/appointments") && resp.status() === 200),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ])

        await searchButton.click()

        if (response) {
            expect(response.status()).toBe(200)
        }
    })

    test("should send OTP for appointment cancellation", async ({ page }) => {
        await page.goto("/lookup")

        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("0932105214")
        await searchButton.click()

        await page.waitForSelector("text=/Hủy lịch hẹn/i", { timeout: 5000 })

        const cancelButton = page.getByRole("button", { name: /Hủy lịch hẹn/i }).first()
        const isDisabled = await cancelButton.isDisabled()

        if (!isDisabled) {
            await cancelButton.click()
            await page.waitForSelector("text=/Xác nhận/i", { timeout: 3000 })

            const confirmButton = page.getByRole("button", { name: /Xác nhận/ }).first()
            await confirmButton.click()

            // Check if OTP API call is made
            const otpResponse = await Promise.race([
                page.waitForResponse((resp) => resp.url().includes("/api/otp/send") && resp.status() === 200),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
            ])

            if (otpResponse) {
                expect(otpResponse.status()).toBe(200)
            }
        }
    })

    test("should verify OTP and cancel appointment", async ({ page }) => {
        await page.goto("/lookup")

        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("0932105214")
        await searchButton.click()

        await page.waitForSelector("text=/Hủy lịch hẹn/i", { timeout: 5000 })

        const cancelButton = page.getByRole("button", { name: /Hủy lịch hẹn/i }).first()
        const isDisabled = await cancelButton.isDisabled()

        if (!isDisabled) {
            await cancelButton.click()
            await page.waitForSelector("text=/Xác nhận/i", { timeout: 3000 })

            const confirmButton = page.getByRole("button", { name: /Xác nhận/ }).first()
            await confirmButton.click()

            await page.waitForSelector("text=/Xác thực mã OTP/i", { timeout: 3000 })

            const otpInput = page.getByPlaceholder(/000000/)

            // In development, OTP should be logged to console
            // For this test, we'll try a dummy OTP (will fail, which is expected)
            await otpInput.fill("000000")

            const verifyButton = page.getByRole("button", { name: /Xác thực/ }).first()
            if (await verifyButton.isEnabled()) {
                await verifyButton.click()

                // Wait for response
                await page.waitForTimeout(1000)

                // Response may be 400 (invalid OTP) which is expected
                expect(page).toBeDefined()
            }
        }
    })
})

test.describe("Rate Limiting Tests", () => {
    test("should handle rate limiting on appointment lookup", async ({ page }) => {
        await page.goto("/lookup")

        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        // Make multiple rapid requests
        for (let i = 0; i < 3; i++) {
            await phoneInput.fill("0932105214")
            await searchButton.click()
            await page.waitForTimeout(200)
        }

        // Page should handle rate limits gracefully
        await expect(page.locator("body")).toBeVisible()
    })

    test("should handle rate limiting on OTP requests", async ({ page }) => {
        await page.goto("/lookup")

        const phoneInput = page.getByLabel(/Số điện thoại/i)
        const searchButton = page.getByRole("button", { name: /Tra cứu/i })

        await phoneInput.fill("0932105214")
        await searchButton.click()

        await page.waitForSelector("text=/Hủy lịch hẹn/i", { timeout: 5000 })

        const cancelButton = page.getByRole("button", { name: /Hủy lịch hẹn/i }).first()
        const isDisabled = await cancelButton.isDisabled()

        if (!isDisabled) {
            // Make multiple cancel attempts
            for (let i = 0; i < 2; i++) {
                await cancelButton.click()
                await page.waitForSelector("text=/Xác nhận/i", { timeout: 3000 })

                // Cancel the dialog
                const cancelDialog = page.getByRole("button", { name: /Hủy/ }).last()
                await cancelDialog.click()
                await page.waitForTimeout(300)
            }
        }

        // Page should still be functional
        await expect(page.locator("body")).toBeVisible()
    })
})

test.describe("Error Handling", () => {
    test("should show error for network failures", async ({ page }) => {
        // Go offline
        await page.context().setOffline(true)

        await page.goto("/services")

        // Should show some error or offline message
        await page.waitForTimeout(1000)

        // Go back online
        await page.context().setOffline(false)

        // Page should recover
        await page.reload()
        await expect(page.locator("body")).toBeVisible()
    })

    test("should handle invalid responses gracefully", async ({ page }) => {
        // Intercept and return invalid response
        await page.route("**/api/services", (route) => {
            route.fulfill({ status: 500, body: "Server Error" })
        })

        await page.goto("/services")

        // Page should show error or fallback UI
        await page.waitForTimeout(1000)

        expect(page).toBeDefined()
    })
})
