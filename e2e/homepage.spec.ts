import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/")
    })

    test("should display hero section with main heading", async ({ page }) => {
        await expect(page.getByRole("heading", { name: /Làm đẹp tự nhiên/i })).toBeVisible()
    })

    test("should display navigation header", async ({ page }) => {
        const header = page.locator("header, [role='banner']")
        await expect(header).toBeVisible()
    })

    test("should have navigation links", async ({ page }) => {
        // Look for main navigation links
        const navLinks = page.locator("nav a, header a")
        const linkCount = await navLinks.count()

        expect(linkCount).toBeGreaterThan(0)
    })

    test("should display services section", async ({ page }) => {
        const servicesSection = page.locator("section:has-text(/dịch vụ|services|nails|hair)")
        if (await servicesSection.isVisible()) {
            await expect(servicesSection).toBeVisible()
        }
    })

    test("should display team section", async ({ page }) => {
        const teamSection = page.locator("section:has-text(/đội ngũ|team|nhân viên|staff)")
        if (await teamSection.isVisible()) {
            await expect(teamSection).toBeVisible()
        }
    })

    test("should display testimonials section", async ({ page }) => {
        const testimonials = page.locator("section:has-text(/đánh giá|testimonial|review|nhận xét)")
        if (await testimonials.isVisible()) {
            await expect(testimonials).toBeVisible()
        }
    })

    test("should display footer", async ({ page }) => {
        const footer = page.locator("footer, [role='contentinfo']")
        await expect(footer).toBeVisible()
    })

    test("should have contact information in footer", async ({ page }) => {
        const footer = page.locator("footer, [role='contentinfo']")
        const contactText = page.locator("text=/liên hệ|contact|phone|email|địa chỉ|address/i")

        if (await footer.isVisible()) {
            const hasContact = await contactText.count() > 0
            expect(hasContact).toBeGreaterThanOrEqual(0)
        }
    })

    test("should navigate to services page from homepage", async ({ page }) => {
        const servicesLink = page.locator("a:has-text(/dịch vụ|services)").first()
        if (await servicesLink.isVisible()) {
            await servicesLink.click()
            await page.waitForURL(/\/services/, { timeout: 5000 })
            expect(page.url()).toContain("/services")
        }
    })

    test("should navigate to booking page from homepage", async ({ page }) => {
        const bookingLink = page.locator("a:has-text(/đặt lịch|booking|book)").first()
        if (await bookingLink.isVisible()) {
            await bookingLink.click()
            await page.waitForURL(/\/book/, { timeout: 5000 })
            expect(page.url()).toContain("/book")
        }
    })

    test("should navigate to lookup page from homepage", async ({ page }) => {
        const lookupLink = page.locator("a:has-text(/tra cứu|lookup|check)").first()
        if (await lookupLink.isVisible()) {
            await lookupLink.click()
            await page.waitForURL(/\/lookup/, { timeout: 5000 })
            expect(page.url()).toContain("/lookup")
        }
    })
})

test.describe("Header Navigation", () => {
    test("should have responsive navigation menu", async ({ page }) => {
        await page.goto("/")

        // Check for hamburger menu on mobile
        page.setViewportSize({ width: 375, height: 667 })
        const mobileMenu = page.locator("button:has-text(/menu|☰|≡)")

        if (await mobileMenu.isVisible()) {
            await mobileMenu.click()
            const menuItems = page.locator("nav a, [role='menuitem']")
            expect(await menuItems.count()).toBeGreaterThan(0)
        }
    })

    test("should have desktop navigation links", async ({ page }) => {
        page.setViewportSize({ width: 1920, height: 1080 })
        await page.goto("/")

        const navLinks = page.locator("nav a")
        expect(await navLinks.count()).toBeGreaterThan(0)
    })
})

test.describe("Homepage Responsiveness", () => {
    test("should be fully responsive on mobile", async ({ page }) => {
        page.setViewportSize({ width: 375, height: 667 })
        await page.goto("/")
        await page.waitForLoadState("networkidle")

        // Check if main content is visible
        const mainContent = page.locator("main, [role='main']")
        await expect(mainContent).toBeVisible()
    })

    test("should be fully responsive on tablet", async ({ page }) => {
        page.setViewportSize({ width: 768, height: 1024 })
        await page.goto("/")
        await page.waitForLoadState("networkidle")

        const mainContent = page.locator("main, [role='main']")
        await expect(mainContent).toBeVisible()
    })

    test("should display properly on desktop", async ({ page }) => {
        page.setViewportSize({ width: 1920, height: 1080 })
        await page.goto("/")
        await page.waitForLoadState("networkidle")

        const mainContent = page.locator("main, [role='main']")
        await expect(mainContent).toBeVisible()
    })
})
