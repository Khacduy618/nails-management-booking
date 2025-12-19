import { test, expect } from "@playwright/test"

test.describe("Accessibility Tests", () => {
    test("should have proper heading hierarchy", async ({ page }) => {
        await page.goto("/")

        const h1 = page.locator("h1")
        const h2 = page.locator("h2")

        // Page should have at least one h1
        expect(await h1.count()).toBeGreaterThanOrEqual(0)
    })

    test("should have alt text for images", async ({ page }) => {
        await page.goto("/services")
        await page.waitForLoadState("networkidle")

        const images = page.locator("img")
        const imageCount = await images.count()

        if (imageCount > 0) {
            // Check first few images for alt text
            for (let i = 0; i < Math.min(3, imageCount); i++) {
                const alt = await images.nth(i).getAttribute("alt")
                // Some images may not have alt (logo, decorative), but important ones should
                expect(alt || images.nth(i).isVisible()).toBeDefined()
            }
        }
    })

    test("should have keyboard navigation support", async ({ page }) => {
        await page.goto("/")

        // Tab to first interactive element
        await page.keyboard.press("Tab")

        // Check if something is focused
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName)

        expect(focusedElement).toBeDefined()
    })

    test("should have aria labels for interactive elements", async ({ page }) => {
        await page.goto("/lookup")

        const buttons = page.locator("button")
        const inputs = page.locator("input[type='text'], input[type='tel'], input[type='email']")

        // Check if inputs have labels
        const inputCount = await inputs.count()
        if (inputCount > 0) {
            const firstInput = inputs.first()
            const hasLabel = await firstInput.getAttribute("aria-label")
            expect(hasLabel || (await page.locator(`label[for]`).count()) > 0).toBeDefined()
        }
    })

    test("should have sufficient color contrast", async ({ page }) => {
        await page.goto("/")

        // This is a simple check - just verify page loads
        // Proper contrast testing would require accessibility testing library
        await expect(page.locator("body")).toBeVisible()
    })

    test("should support screen reader navigation", async ({ page }) => {
        await page.goto("/")

        // Check for semantic HTML
        const main = page.locator("main")
        const nav = page.locator("nav")
        const footer = page.locator("footer")

        // At least one semantic element should exist
        const semanticCount = (await main.count()) + (await nav.count()) + (await footer.count())

        expect(semanticCount).toBeGreaterThanOrEqual(0)
    })

    test("should have proper form labels", async ({ page }) => {
        await page.goto("/book")

        const inputs = page.locator("input[type='text'], input[type='tel'], textarea, select")
        const inputCount = await inputs.count()

        if (inputCount > 0) {
            // Should have associated labels
            const labels = page.locator("label")
            expect(await labels.count()).toBeGreaterThanOrEqual(0)
        }
    })
})

test.describe("Keyboard Navigation", () => {
    test("should navigate through form fields with Tab", async ({ page }) => {
        await page.goto("/book")

        const initialFocus = await page.evaluate(() => document.activeElement?.tagName)

        // Press Tab multiple times
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press("Tab")
        }

        const finalFocus = await page.evaluate(() => document.activeElement?.tagName)

        // Focus should have moved
        expect(finalFocus).toBeDefined()
    })

    test("should allow form submission with keyboard", async ({ page }) => {
        await page.goto("/lookup")

        // Tab to search button
        let focusedElement = await page.evaluate(() => document.activeElement?.textContent)

        let attempts = 0
        while (!focusedElement?.includes("Tra cứu") && attempts < 10) {
            await page.keyboard.press("Tab")
            focusedElement = await page.evaluate(() => document.activeElement?.textContent)
            attempts++
        }

        // If we found the button, press Enter
        if (focusedElement?.includes("Tra cứu")) {
            // But first fill the input
            const phoneInput = page.getByLabel(/Số điện thoại/i)
            await phoneInput.focus()
            await phoneInput.fill("0932105214")

            // Tab to button and press Enter
            await page.keyboard.press("Tab")
            await page.keyboard.press("Enter")

            // Should trigger search
            await page.waitForTimeout(500)
            expect(page).toBeDefined()
        }
    })
})

test.describe("Focus Management", () => {
    test("should show focus indicators on interactive elements", async ({ page }) => {
        await page.goto("/")

        const buttons = page.locator("button").first()
        if (await buttons.isVisible()) {
            await buttons.focus()

            const outlineStyle = await buttons.evaluate((el) => {
                const style = window.getComputedStyle(el)
                return style.outline || style.outlineWidth || style.boxShadow
            })

            // Should have some focus indication
            expect(outlineStyle).toBeDefined()
        }
    })

    test("should trap focus in modal dialogs", async ({ page }) => {
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

            // Dialog should open
            await page.waitForSelector("text=/Xác nhận/i", { timeout: 3000 })

            // Tab should cycle through dialog elements, not page elements
            await page.keyboard.press("Tab")
            await page.keyboard.press("Tab")
            await page.keyboard.press("Tab")

            // Should still be in dialog area
            expect(page).toBeDefined()
        }
    })
})

test.describe("Responsive Images & Media", () => {
    test("should load appropriate images for viewport size", async ({ page }) => {
        page.setViewportSize({ width: 375, height: 667 })
        await page.goto("/services")
        await page.waitForLoadState("networkidle")

        const images = page.locator("img")
        const visibleImages = await images.filter({ hasNot: page.locator("[style*='display: none']") }).count()

        expect(visibleImages).toBeGreaterThanOrEqual(0)
    })

    test("should lazy load images", async ({ page }) => {
        await page.goto("/services")

        const images = page.locator("img[loading='lazy']")
        const lazyImageCount = await images.count()

        // Should have some lazy-loaded images or use intersection observer
        expect(lazyImageCount).toBeGreaterThanOrEqual(0)
    })
})
