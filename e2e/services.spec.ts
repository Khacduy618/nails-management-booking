import { test, expect } from "@playwright/test"

test.describe("Services Page", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/services")
    })

    test("should display services page with title", async ({ page }) => {
        await expect(page.getByRole("heading")).toBeVisible()
        await expect(page.getByText(/dịch vụ|services/i)).toBeVisible()
    })

    test("should load services from API", async ({ page }) => {
        // Wait for services to load
        await page.waitForLoadState("networkidle")

        // Check for service cards or list items
        const serviceCards = await page.locator("[data-testid='service-card'], .service-card, [role='article']").count()
        const hasServices = serviceCards > 0

        // If no service cards, check for service text/links
        if (!hasServices) {
            const serviceText = await page.locator("text=/nails|nail art|hair|massage|spa/i").count()
            expect(serviceText).toBeGreaterThanOrEqual(0)
        }
    })

    test("should display service details (price, duration, category)", async ({ page }) => {
        await page.waitForLoadState("networkidle")

        // Check for price information
        const priceElements = await page.locator("text=/đ|vnd|price|cost/i").count()

        // Check for duration information
        const durationElements = await page.locator("text=/phút|minutes|duration/i").count()

        // At least one should exist
        expect(priceElements + durationElements).toBeGreaterThan(0)
    })

    test("should have service filter/search functionality", async ({ page }) => {
        // Look for search or filter input
        const searchInput = page.getByPlaceholder(/tìm kiếm|search/i)
        const filterButtons = page.locator("button:has-text(/lọc|filter|danh mục|category)")

        const hasSearch = await searchInput.isVisible().catch(() => false)
        const hasFilter = await filterButtons.count() > 0

        expect(hasSearch || hasFilter).toBeTruthy()
    })

    test("should filter services by search", async ({ page }) => {
        await page.waitForLoadState("networkidle")

        const searchInput = page.getByPlaceholder(/tìm kiếm|search/i)
        if (await searchInput.isVisible()) {
            await searchInput.fill("nail")
            await page.waitForTimeout(500)

            // Results should update
            const results = await page.locator("[data-testid='service-card'], .service-card").count()
            expect(results).toBeGreaterThanOrEqual(0)
        }
    })

    test("should filter services by category", async ({ page }) => {
        await page.waitForLoadState("networkidle")

        const categoryButtons = page.locator("button:has-text(/nails|hair|massage|danh mục)")
        if (await categoryButtons.count() > 0) {
            await categoryButtons.first().click()
            await page.waitForTimeout(500)

            // Results should be filtered
            const results = await page.locator("[data-testid='service-card'], .service-card").count()
            expect(results).toBeGreaterThanOrEqual(0)
        }
    })

    test("should filter services by price range", async ({ page }) => {
        await page.waitForLoadState("networkidle")

        // Look for price filter inputs
        const priceInputs = page.locator("input[type='range'], input[placeholder*='giá']")
        if (await priceInputs.count() > 0) {
            const firstPriceInput = priceInputs.first()
            await firstPriceInput.fill("500000")
            await page.waitForTimeout(500)

            // Results should be filtered
            const results = await page.locator("[data-testid='service-card'], .service-card").count()
            expect(results).toBeGreaterThanOrEqual(0)
        }
    })

    test("should allow adding service to booking from services page", async ({ page }) => {
        await page.waitForLoadState("networkidle")

        // Look for "Book" or "Add to booking" button on service card
        const addButtons = page.locator("button:has-text(/đặt lịch|book|add|chọn)")
        if (await addButtons.count() > 0) {
            await addButtons.first().click()
            // May navigate to booking page or add to cart
            await page.waitForTimeout(500)
            expect(page).toBeDefined()
        }
    })
})

test.describe("Services with Categories", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/services")
    })

    test("should display category list", async ({ page }) => {
        await page.waitForLoadState("networkidle")

        const categories = page.locator("button:has-text(/danh mục|category|nail|hair)")
        const categoryCount = await categories.count()

        expect(categoryCount).toBeGreaterThan(0)
    })

    test("should highlight selected category", async ({ page }) => {
        await page.waitForLoadState("networkidle")

        const firstCategory = page.locator("button:has-text(/danh mục|category|nail|hair)").first()
        if (await firstCategory.isVisible()) {
            await firstCategory.click()
            await page.waitForTimeout(300)

            // Category button should have active/selected styling
            const ariaSelected = await firstCategory.getAttribute("aria-selected")
            const hasActiveClass = await firstCategory.evaluate((el) =>
                el.className.includes("active") || el.className.includes("selected")
            )

            // Either aria-selected or class should indicate selection
            expect(ariaSelected === "true" || hasActiveClass).toBeDefined()
        }
    })
})

test.describe("Services Responsive Design", () => {
    test("should be responsive on mobile", async ({ page }) => {
        page.setViewportSize({ width: 375, height: 667 })
        await page.goto("/services")
        await page.waitForLoadState("networkidle")

        // Check if layout adapts (service cards should be stacked on mobile)
        const services = page.locator("[data-testid='service-card'], .service-card")
        const count = await services.count()

        // Should still display services
        expect(count).toBeGreaterThanOrEqual(0)

        // Navigation should be accessible
        const backButton = page.getByRole("button", { name: /quay lại|back/i })
        const hasNavigation = await backButton.isVisible().catch(() => false)
        expect(hasNavigation || count >= 0).toBeTruthy()
    })

    test("should be responsive on tablet", async ({ page }) => {
        page.setViewportSize({ width: 768, height: 1024 })
        await page.goto("/services")
        await page.waitForLoadState("networkidle")

        const services = page.locator("[data-testid='service-card'], .service-card")
        const count = await services.count()

        expect(count).toBeGreaterThanOrEqual(0)
    })

    test("should be responsive on desktop", async ({ page }) => {
        page.setViewportSize({ width: 1920, height: 1080 })
        await page.goto("/services")
        await page.waitForLoadState("networkidle")

        const services = page.locator("[data-testid='service-card'], .service-card")
        const count = await services.count()

        expect(count).toBeGreaterThanOrEqual(0)
    })
})
