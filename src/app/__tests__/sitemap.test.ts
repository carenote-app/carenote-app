import { describe, it, expect, beforeEach, afterEach } from "vitest";
import sitemap from "../sitemap";

describe("sitemap()", () => {
  const ORIGINAL_ENV = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
  afterEach(() => {
    if (ORIGINAL_ENV !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_ENV;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  it("lists exactly the public marketing surface", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toEqual([
      "https://kinroster.com/",
      "https://kinroster.com/hipaa",
      "https://kinroster.com/support",
      "https://kinroster.com/privacy",
      "https://kinroster.com/terms",
    ]);
  });

  it("does not leak any auth, dashboard, api, or portal URL into the sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    const forbidden = [
      "auth",
      "login",
      "signup",
      "verify",
      "dashboard",
      "today",
      "api",
      "portal",
      "residents",
      "voice-sessions",
      "incidents",
      "billing",
      "settings",
    ];
    for (const term of forbidden) {
      expect(
        urls.some((u) => u.includes(`/${term}`)),
        `sitemap should not include ${term}`
      ).toBe(false);
    }
  });

  it("flags the landing page as the highest-priority entry", () => {
    const entries = sitemap();
    const landing = entries.find((e) =>
      e.url.endsWith("kinroster.com/")
    );
    expect(landing?.priority).toBe(1.0);
    // No other entry should match or exceed the landing priority.
    for (const e of entries) {
      if (e === landing) continue;
      expect(e.priority).toBeLessThan(1.0);
    }
  });

  it("respects the configured origin via NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://preview.kinroster.com";
    const entries = sitemap();
    expect(entries[0].url).toBe("https://preview.kinroster.com/");
    expect(entries[1].url).toBe("https://preview.kinroster.com/hipaa");
  });
});
