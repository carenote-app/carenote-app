import { createAdminClient } from "@/lib/supabase/admin";

interface QuotaResult {
  allowed: boolean;
  reason?: string;
  voice_minutes_remaining?: number;
  ai_calls_remaining?: number;
}

export async function checkQuotaAndIncrement(
  orgId: string,
  resource: "voice" | "ai"
): Promise<QuotaResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc(
    "check_org_quota" as never,
    { org_id: orgId } as never
  );

  if (error) {
    return { allowed: false, reason: "Failed to check usage quota" };
  }

  const result = data as unknown as QuotaResult;

  if (!result.allowed) {
    return result;
  }

  await supabase.rpc(
    "increment_usage" as never,
    { org_id: orgId, resource, amount: 1 } as never
  );

  return result;
}

export async function incrementUsage(
  orgId: string,
  resource: "voice" | "ai",
  amount: number = 1
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.rpc(
    "increment_usage" as never,
    { org_id: orgId, resource, amount } as never
  );
}
