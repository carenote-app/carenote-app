import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude, parseJsonResponse } from "@/lib/claude";
import { checkQuotaAndIncrement } from "@/lib/quota";
import {
  INCIDENT_CLASSIFY_SYSTEM_PROMPT,
  INCIDENT_CLASSIFY_MODEL,
  buildIncidentClassifyUserPrompt,
  type IncidentClassification,
} from "@/lib/prompts/incident-classify";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (appUser) {
    const quota = await checkQuotaAndIncrement(appUser.organization_id, "ai");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 429 });
    }
  }

  const { rawInput } = await request.json();
  if (!rawInput) {
    return NextResponse.json({ error: "rawInput required" }, { status: 400 });
  }

  try {
    const raw = await callClaude({
      model: INCIDENT_CLASSIFY_MODEL,
      systemPrompt: INCIDENT_CLASSIFY_SYSTEM_PROMPT,
      userPrompt: buildIncidentClassifyUserPrompt(rawInput),
      maxTokens: 100,
    });

    const classification = parseJsonResponse<IncidentClassification>(raw);

    return NextResponse.json(classification);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // On failure, default to ROUTINE to avoid blocking the caregiver
    return NextResponse.json({
      classification: "ROUTINE" as const,
      reason: "Classification unavailable",
      error: message,
    });
  }
}
