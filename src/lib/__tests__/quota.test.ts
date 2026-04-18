import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: mockRpc,
  }),
}));

import { checkQuotaAndIncrement } from "@/lib/quota";

describe("quota", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("returns allowed when under quota", async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        voice_minutes_remaining: 29,
        ai_calls_remaining: 49,
      },
      error: null,
    });

    const result = await checkQuotaAndIncrement("org-123", "voice");
    expect(result.allowed).toBe(true);
    expect(result.voice_minutes_remaining).toBe(29);
  });

  it("returns not allowed when quota check fails", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await checkQuotaAndIncrement("org-123", "ai");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Failed to check usage quota");
  });

  it("returns not allowed with reason when quota exceeded", async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: false,
        reason: "Daily usage limit reached. Limits reset at midnight UTC.",
        voice_minutes_remaining: 0,
        ai_calls_remaining: 0,
      },
      error: null,
    });

    const result = await checkQuotaAndIncrement("org-123", "voice");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Daily usage limit");
  });

  it("calls increment_usage after successful quota check", async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: { allowed: true, voice_minutes_remaining: 10, ai_calls_remaining: 20 },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    await checkQuotaAndIncrement("org-123", "voice");

    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc).toHaveBeenLastCalledWith(
      "increment_usage",
      { org_id: "org-123", resource: "voice", amount: 1 }
    );
  });

  it("does not call increment when quota denied", async () => {
    mockRpc.mockResolvedValue({
      data: { allowed: false, reason: "Trial expired" },
      error: null,
    });

    await checkQuotaAndIncrement("org-123", "ai");
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });
});
