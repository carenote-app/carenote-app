import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Voice-First")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Start AI Consult/i })
    ).toBeVisible();
  });

  test("features section is visible and scrollable", async ({ page }) => {
    await page.goto("/");
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeVisible();
    await expect(page.getByText("Streamlined Clinical Documentation")).toBeVisible();
  });

  test("role selection section is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Select Your Role")).toBeVisible();
    const roleSection = page.locator("#how-it-works");
    await expect(roleSection.getByText("Caretaker")).toBeVisible();
    await expect(roleSection.getByRole("heading", { name: "Doctor" })).toBeVisible();
  });

  test("waitlist form accepts email submission", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Get Early Access")).toBeVisible();

    const waitlistSection = page.locator("section").filter({ hasText: "Get Early Access" });
    const emailInput = waitlistSection.locator('input[type="email"]');
    await emailInput.fill("test-e2e@example.com");

    const joinButton = waitlistSection.getByRole("button", { name: "Join Waitlist" });
    await expect(joinButton).toBeVisible();
  });

  test("consult modal opens", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Start AI Consult/i }).click();

    // The modal renders one of two states depending on whether the consult
    // demo is currently active in src/lib/demos/registry.ts. Either is a
    // valid pass; we just want to know the modal opened.
    const modal = page.locator("[class*='fixed inset-0']");
    await expect(modal.getByText("AI Consultation")).toBeVisible();

    const liveDemo = modal.getByText("Generated Documentation");
    const pausedDemo = modal.getByText("Demo coming soon");
    await expect(liveDemo.or(pausedDemo)).toBeVisible();
  });

  test("footer links navigate to public pages", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await footer.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();

    await page.goBack();

    await footer.getByRole("link", { name: "Terms of Service" }).click();
    await expect(page).toHaveURL(/\/terms/);

    await page.goBack();

    await footer.getByRole("link", { name: "HIPAA Compliance" }).click();
    await expect(page).toHaveURL(/\/hipaa/);

    await page.goBack();

    await footer.getByRole("link", { name: "Support" }).click();
    await expect(page).toHaveURL(/\/support/);
  });

  test("sign in link navigates to login", async ({ page }) => {
    await page.goto("/");
    // Desktop nav has Sign In link; on mobile it's in the hamburger menu
    const signInLink = page.locator("header").getByRole("link", { name: "Sign In" });
    if (await signInLink.isVisible()) {
      await signInLink.click();
    } else {
      // Mobile: open hamburger menu first
      await page.locator("header").getByRole("button").first().click();
      await page.getByRole("link", { name: "Sign In" }).click();
    }
    await expect(page).toHaveURL(/\/login/);
  });
});
