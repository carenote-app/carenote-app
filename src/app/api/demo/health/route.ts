import { NextResponse } from "next/server";

// Public, unauthenticated readiness check for the landing-page demo.
// Returns enough detail to diagnose "Demo is not configured." in production
// without exposing key values. Mirrors the gating order in
// src/app/api/demo/consult/route.ts.

export async function GET() {
  const disabled = process.env.DEMO_CONSULT_DISABLED === "true";
  const openaiKey = Boolean(process.env.OPENAI_API_KEY);
  const anthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const ready = !disabled && openaiKey && anthropicKey;

  return NextResponse.json(
    {
      ready,
      checks: {
        kill_switch_disabled: !disabled,
        openai_api_key_set: openaiKey,
        anthropic_api_key_set: anthropicKey,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
