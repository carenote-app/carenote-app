import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Reset env so we control PRICE_ID_SMALL / PRICE_ID_STANDARD per test.
// stripe.ts reads them at module-eval time, so we use vi.resetModules
// + a fresh dynamic import in each test.
beforeEach(() => {
  vi.resetModules();
  delete process.env.STRIPE_PRICE_ID_SMALL;
  delete process.env.STRIPE_PRICE_ID_STANDARD;
});

afterEach(() => {
  vi.resetModules();
});

describe("priceIdForTier", () => {
  it("returns the small price id when tier is 'small' and the env var is set", async () => {
    process.env.STRIPE_PRICE_ID_SMALL = "price_small_123";
    const { priceIdForTier } = await import("../stripe");
    expect(priceIdForTier("small")).toBe("price_small_123");
  });

  it("returns the standard price id when tier is 'standard' and the env var is set", async () => {
    process.env.STRIPE_PRICE_ID_STANDARD = "price_std_456";
    const { priceIdForTier } = await import("../stripe");
    expect(priceIdForTier("standard")).toBe("price_std_456");
  });

  it("returns null for the enterprise tier (no SKU; contact-us flow)", async () => {
    process.env.STRIPE_PRICE_ID_SMALL = "price_small_123";
    process.env.STRIPE_PRICE_ID_STANDARD = "price_std_456";
    const { priceIdForTier } = await import("../stripe");
    expect(priceIdForTier("enterprise")).toBeNull();
  });

  it("returns null for a null tier (bed_count not yet set)", async () => {
    process.env.STRIPE_PRICE_ID_SMALL = "price_small_123";
    const { priceIdForTier } = await import("../stripe");
    expect(priceIdForTier(null)).toBeNull();
  });

  it("returns null when the env var for the requested tier is missing", async () => {
    // STRIPE_PRICE_ID_SMALL intentionally unset
    const { priceIdForTier } = await import("../stripe");
    expect(priceIdForTier("small")).toBeNull();
  });
});

describe("TIER_DISPLAY", () => {
  it("exposes both tiers with the documented bed ranges", async () => {
    const { TIER_DISPLAY } = await import("../stripe");
    expect(TIER_DISPLAY.small.bedRange).toBe("1–10 beds");
    expect(TIER_DISPLAY.standard.bedRange).toBe("11–20 beds");
  });

  it("declares numeric monthly prices that the billing page can render", async () => {
    const { TIER_DISPLAY } = await import("../stripe");
    expect(typeof TIER_DISPLAY.small.monthlyPrice).toBe("number");
    expect(typeof TIER_DISPLAY.standard.monthlyPrice).toBe("number");
    expect(TIER_DISPLAY.standard.monthlyPrice).toBeGreaterThan(
      TIER_DISPLAY.small.monthlyPrice
    );
  });
});
