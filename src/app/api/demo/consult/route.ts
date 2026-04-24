import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { checkRate } from "@/lib/rate-limit";
import {
  CAREGIVER_DEMO_SYSTEM_PROMPT,
  DOCTOR_DEMO_SYSTEM_PROMPT,
  buildDemoUserPrompt,
} from "@/lib/prompts/demo-consult";

// Public unauthenticated demo endpoint that powers the landing-page "AI
// Consult" modal. Audio is transcribed by Whisper then structured by Claude
// Haiku. Nothing is persisted — audio and transcript exist only for the life
// of the request.
//
// Abuse mitigations (defense in depth, since this is anonymous):
//   1. Kill switch via DEMO_CONSULT_DISABLED env var.
//   2. Same-origin Origin/Referer check (defeats casual scripted abuse).
//   3. Audio size cap of 2MB (~60-90s of opus-encoded webm).
//   4. MIME-type allow-list (must be audio/*).
//   5. Per-IP sliding-window rate limit (3 / 10 min).
//   6. Global sliding-window rate limit (200 / hour) as a hard cost ceiling
//      regardless of how many IPs an attacker rotates through.
//   7. Haiku 4.5 + capped maxTokens to keep per-call cost predictable.
//   8. No DB writes, no PHI logging. Errors are returned without echoing input.
//
// Note: rate limits are in-memory per server instance (see rate-limit.ts).
// On a multi-instance deploy this is best-effort; the global cap still bounds
// per-instance spend, so worst-case total is (instances * GLOBAL_LIMIT_MAX).

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const ALLOWED_ROLES = new Set(["caretaker", "doctor"]);

const IP_LIMIT_MAX = 3;
const IP_LIMIT_WINDOW_MS = 10 * 60_000;
const GLOBAL_LIMIT_MAX = 200;
const GLOBAL_LIMIT_WINDOW_MS = 60 * 60_000;

const CLAUDE_MAX_TOKENS = 600;
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function rateLimitResponse(retryAfterMs: number): NextResponse {
  const retryAfter = Math.ceil(retryAfterMs / 1000);
  return NextResponse.json(
    { error: "Too many demo requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": retryAfter.toString() } }
  );
}

function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get("host");
  if (!host) return false;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidate = origin || referer;
  if (!candidate) return false;
  try {
    const url = new URL(candidate);
    return url.host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (process.env.DEMO_CONSULT_DISABLED === "true") {
    return NextResponse.json(
      { error: "Demo is temporarily disabled." },
      { status: 503 }
    );
  }

  if (!process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Demo is not configured." },
      { status: 503 }
    );
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const byIp = checkRate(`demo:ip:${ip}`, IP_LIMIT_MAX, IP_LIMIT_WINDOW_MS);
  if (!byIp.allowed) return rateLimitResponse(byIp.retryAfterMs);
  const global = checkRate(
    "demo:global",
    GLOBAL_LIMIT_MAX,
    GLOBAL_LIMIT_WINDOW_MS
  );
  if (!global.allowed) return rateLimitResponse(global.retryAfterMs);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const audio = formData.get("audio");
  const roleRaw = formData.get("role");

  if (!(audio instanceof Blob)) {
    return NextResponse.json(
      { error: "Audio file required" },
      { status: 400 }
    );
  }
  if (audio.size === 0) {
    return NextResponse.json(
      { error: "Audio file is empty" },
      { status: 400 }
    );
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Recording too long. Demo is limited to ~90 seconds." },
      { status: 413 }
    );
  }
  if (audio.type && !audio.type.toLowerCase().startsWith("audio/")) {
    return NextResponse.json(
      { error: "Unsupported audio format" },
      { status: 415 }
    );
  }

  const role = typeof roleRaw === "string" ? roleRaw : "caretaker";
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  let transcript: string;
  try {
    const whisperFormData = new FormData();
    whisperFormData.append("file", audio, "demo.webm");
    whisperFormData.append("model", "whisper-1");
    whisperFormData.append("language", "en");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: whisperFormData,
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 502 }
      );
    }

    const result = (await response.json()) as { text?: string };
    transcript = (result.text ?? "").trim();
  } catch {
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 502 }
    );
  }

  if (!transcript) {
    return NextResponse.json(
      { error: "Could not understand the audio. Try speaking more clearly." },
      { status: 422 }
    );
  }

  const systemPrompt =
    role === "doctor"
      ? DOCTOR_DEMO_SYSTEM_PROMPT
      : CAREGIVER_DEMO_SYSTEM_PROMPT;

  let structured: string;
  try {
    structured = await callClaude({
      model: CLAUDE_MODEL,
      systemPrompt,
      userPrompt: buildDemoUserPrompt(transcript, new Date().toISOString()),
      maxTokens: CLAUDE_MAX_TOKENS,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not generate documentation. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ transcript, structured: structured.trim() });
}
