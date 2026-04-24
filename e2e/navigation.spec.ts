import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  // These tests run against the login/signup pages which are public
  // Full navigation tests require auth setup which will be added with Supabase integration

  test("root shows landing page", async ({ page }) => {
    await page.goto("/");
    // Landing page is public — no redirect for unauthenticated users
    const url = page.url();
    expect(url).toMatch(/\/$/);
    await expect(page.locator("text=Voice-First")).toBeVisible();
  });

  test("pages have proper meta tags", async ({ page }) => {
    await page.goto("/login");

    const title = await page.title();
    expect(title).toContain("Kinroster");
  });

  test("mobile viewport renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");

    // Card should be visible and not overflowing
    const card = page.locator("[class*='max-w-sm']");
    await expect(card).toBeVisible();

    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(375);
  });
});
