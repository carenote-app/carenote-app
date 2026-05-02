import { describe, it, expect, beforeEach, afterEach } from "vitest";
import robots from "../robots";

describe("robots()", () => {
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

  it("allows the root path", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    expect(rules[0]?.allow).toBe("/");
    expect(rules[0]?.userAgent).toBe("*");
  });

  it("disallows the dashboard, api, auth, and portal route trees", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallow = (rules[0]?.disallow ?? []) as string[];

    // The high-stakes ones: anything user-scoped or API.
    expect(disallow).toContain("/api");
    expect(disallow).toContain("/auth");
    expect(disallow).toContain("/dashboard");
    expect(disallow).toContain("/portal");
    // Auth pages individually — defence-in-depth.
    expect(disallow).toContain("/login");
    expect(disallow).toContain("/signup");
    expect(disallow).toContain("/verify");
    // PHI-bearing pages.
    expect(disallow).toContain("/today");
    expect(disallow).toContain("/residents");
    expect(disallow).toContain("/voice-sessions");
    expect(disallow).toContain("/incidents");
  });

  it("does NOT disallow public marketing or legal routes", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallow = (rules[0]?.disallow ?? []) as string[];

    for (const publicPath of ["/", "/hipaa", "/support", "/privacy", "/terms"]) {
      expect(disallow).not.toContain(publicPath);
    }
  });

  it("points crawlers at the sitemap URL on the configured origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://staging.kinroster.com";
    const result = robots();
    expect(result.sitemap).toBe("https://staging.kinroster.com/sitemap.xml");
  });

  it("falls back to the production origin when NEXT_PUBLIC_APP_URL is unset", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://kinroster.com/sitemap.xml");
  });
});
