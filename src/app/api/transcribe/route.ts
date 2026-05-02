import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCaregiverLocale } from "@/lib/i18n/locale";

// Whisper accepts ISO-639-1 codes. We pass the language portion of the
// caregiver's BCP-47 locale as a hint; `zh-TW` becomes `zh`, `vi` stays `vi`.
// If the client explicitly sends `caregiverLanguage`, it wins over the
// stored preference (caregivers may ad-hoc switch language for one note).
function languageHintFromBcp47(bcp47: string | null | undefined): string | null {
  if (!bcp47) return null;
  const code = bcp47.split("-")[0]?.toLowerCase();
  if (!code) return null;
  // Whisper auto-detects when omitted; only pass codes Whisper accepts.
  const ALLOWED = new Set([
    "en", "zh", "vi", "id", "tl", "th", "ja", "ko", "es", "fr", "de", "pt",
  ]);
  return ALLOWED.has(code) ? code : null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio") as Blob | null;
  const explicitLanguage = formData.get("caregiverLanguage");

  if (!audio) {
    return NextResponse.json({ error: "Audio file required" }, { status: 400 });
  }

  // Validate audio size (max 25MB for Whisper)
  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Audio file too large (max 25MB)" },
      { status: 400 }
    );
  }

  // Resolve the language hint: form override → caregiver preference → omit.
  const explicitHint =
    typeof explicitLanguage === "string"
      ? languageHintFromBcp47(explicitLanguage)
      : null;
  const fallbackLocale = await getCaregiverLocale(user.id);
  const languageHint = explicitHint ?? languageHintFromBcp47(fallbackLocale);

  try {
    const whisperFormData = new FormData();
    whisperFormData.append("file", audio, "recording.webm");
    whisperFormData.append("model", "whisper-1");
    if (languageHint) {
      whisperFormData.append("language", languageHint);
    }

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
      const error = await response.text();
      return NextResponse.json(
        { error: "Transcription failed", details: error },
        { status: 502 }
      );
    }

    const result = await response.json();

    // Audio is never stored — only the transcript is returned
    return NextResponse.json({ transcript: result.text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Transcription failed", details: message },
      { status: 500 }
    );
  }
}
