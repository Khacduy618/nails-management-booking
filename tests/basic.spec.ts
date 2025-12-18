import { test, expect } from "@playwright/test"

test("homepage renders the hero heading", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /Làm đẹp tự nhiên/i })).toBeVisible()
})
