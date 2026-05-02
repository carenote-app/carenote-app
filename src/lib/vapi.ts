import type { NextRequest } from "next/server";

export interface VapiEndOfCallReport {
  type: "end-of-call-report";
  call: {
    id: string;
    metadata?: Record<string, string>;
    assistantOverrides?: { metadata?: Record<string, string> };
  };
  endedReason?: string;
  transcript?: string;
  messages?: Array<{
    role: "assistant" | "user" | "system" | "tool";
    message?: string;
    time?: number;
    secondsFromStart?: number;
  }>;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  summary?: string;
}

export interface VapiStatusUpdate {
  type: "status-update";
  call: {
    id: string;
    metadata?: Record<string, string>;
    assistantOverrides?: { metadata?: Record<string, string> };
  };
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
}

export type VapiWebhookEvent = VapiEndOfCallReport | VapiStatusUpdate;

// Vapi posts webhooks with a shared secret in the x-vapi-secret header.
// That secret is set in the Vapi dashboard's Server URL config.
export function verifyVapiWebhook(request: NextRequest): boolean {
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  if (!expected) return false;
  const received = request.headers.get("x-vapi-secret");
  return received === expected;
}

// Build the resident-specific overrides Vapi accepts when starting a call.
// These get merged into the assistant's configured system prompt at runtime.
//
// The variable set must match `prompts/vapi-intake-assistant.md` exactly —
// adding a variable here without updating the spec creates dashboard drift.
export function buildAssistantOverrides(params: {
  caregiverName: string;
  caregiverLanguage: string;
  residentFirstName: string;
  residentLastName: string;
  residentLanguage: string;
  outputLanguage: string;
  honorificPreference: string | null;
  culturalRegister: "indirect" | "direct";
  conditions: string | null;
  careNotesContext: string | null;
  recentNotesSummary: string;
  recentIncidents: string;
  keyterms?: string[];
}) {
  const {
    caregiverName,
    caregiverLanguage,
    residentFirstName,
    residentLastName,
    residentLanguage,
    outputLanguage,
    honorificPreference,
    culturalRegister,
    conditions,
    careNotesContext,
    recentNotesSummary,
    recentIncidents,
    keyterms,
  } = params;

  const overrides: {
    variableValues: Record<string, string>;
    transcriber?: { keyterms: string[] };
  } = {
    variableValues: {
      caregiver_name: caregiverName,
      caregiver_language: caregiverLanguage,
      resident_first_name: residentFirstName,
      resident_last_name: residentLastName,
      resident_language: residentLanguage,
      output_language: outputLanguage,
      honorific_preference: honorificPreference || "",
      cultural_register: culturalRegister,
      conditions: conditions || "none on file",
      care_context: careNotesContext || "none on file",
      recent_notes_summary: recentNotesSummary || "no recent notes",
      recent_incidents: recentIncidents || "no recent incidents",
    },
  };

  // Per-call keyterms boost recognition for resident name + current meds.
  // Applies only when the Vapi assistant uses Deepgram Nova 3 (current).
  const cleaned = (keyterms || []).filter((k) => k && k.trim().length > 0);
  if (cleaned.length > 0) {
    overrides.transcriber = { keyterms: cleaned };
  }

  return overrides;
}
