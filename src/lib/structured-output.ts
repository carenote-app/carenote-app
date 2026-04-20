// Shared parser + filter for structured note output. Phase 3 introduced a
// v2 shape with per-section disclosure_class + scope_category; legacy v1
// rows (sections as a plain object) still exist. Everything in this file
// treats v1 as "normalize to v2 with permissive defaults" so downstream
// code only ever deals with the v2 shape.

import type {
  StructuredNoteOutput,
  StructuredNoteOutputV1,
  StructuredNoteSection,
  DisclosureClass,
  ScopeCategory,
} from "@/lib/prompts/shift-note";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeV1(v1: StructuredNoteOutputV1): StructuredNoteOutput {
  // Legacy rows have no classification. Treat every section as baseline
  // family-shareable-by-involvement with no topic category. The send flows
  // will still honor the contact's legal basis; they just lose topic-level
  // filtering until the note gets re-structured.
  const sections: StructuredNoteSection[] = Object.entries(
    v1.sections ?? {}
  ).map(([name, text]) => ({
    name,
    text: typeof text === "string" ? text : String(text),
    disclosure_class: "family_shareable_by_involvement" as DisclosureClass,
    scope_category: null,
  }));

  return {
    summary: v1.summary,
    sections,
    follow_up: v1.follow_up,
    flags: v1.flags ?? [],
    sensitive_flag: false,
    sensitive_category: null,
  };
}

// Parses a structured_output string (stored as JSON in notes.structured_output)
// and normalizes it to the v2 shape. Returns null if the string can't be
// parsed — callers should fall back to raw_input in that case.
export function parseStructuredOutput(
  raw: string | null | undefined
): StructuredNoteOutput | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;

  if (Array.isArray(parsed.sections)) {
    const sections = (parsed.sections as unknown[]).filter(isRecord).map(
      (s): StructuredNoteSection => ({
        name: typeof s.name === "string" ? s.name : "",
        text: typeof s.text === "string" ? s.text : "",
        disclosure_class: (typeof s.disclosure_class === "string"
          ? s.disclosure_class
          : "family_shareable_by_involvement") as DisclosureClass,
        scope_category:
          typeof s.scope_category === "string"
            ? (s.scope_category as ScopeCategory)
            : null,
      })
    );

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      sections,
      follow_up: typeof parsed.follow_up === "string" ? parsed.follow_up : "",
      flags: Array.isArray(parsed.flags)
        ? (parsed.flags as Array<{ type: string; reason: string }>)
        : [],
      sensitive_flag: parsed.sensitive_flag === true,
      sensitive_category:
        typeof parsed.sensitive_category === "string"
          ? (parsed.sensitive_category as StructuredNoteOutput["sensitive_category"])
          : null,
    };
  }

  // Treat anything else as a v1 candidate — sections is a Record<string,string>.
  const v1 = parsed as unknown as StructuredNoteOutputV1;
  return normalizeV1(v1);
}

// Filter for clinician sharing. By default excludes billing_ops_only and
// sensitive_restricted. When { includeSensitive: true } is passed, keeps
// sensitive_restricted — this is the Phase 4 explicit-override path and
// must be paired with a sensitive_override=true disclosure_event row.
export function filterSectionsForClinician(
  sections: StructuredNoteSection[],
  options: { includeSensitive?: boolean } = {}
): StructuredNoteSection[] {
  return sections.filter((s) => {
    if (s.disclosure_class === "billing_ops_only") return false;
    if (s.disclosure_class === "sensitive_restricted") {
      return options.includeSensitive === true;
    }
    return true;
  });
}

export type FamilyAuthorization = {
  involved_in_care: boolean;
  personal_representative: boolean;
  authorization_on_file: boolean;
  authorization_scope: string[];
};

// Filter for family sharing: a section is allowed when BOTH
//  (a) the contact's legal basis permits the disclosure_class, AND
//  (b) the section's scope_category is in the contact's authorization_scope
//      — OR the authorization_scope is empty, which is the legacy "general
//      wellbeing update" mode carried over from Phase 2.
// Sensitive content is always blocked — Phase 4 will add an unlock path.
export function filterSectionsForFamily(
  sections: StructuredNoteSection[],
  auth: FamilyAuthorization
): StructuredNoteSection[] {
  const allowedClasses = new Set<DisclosureClass>();
  if (auth.involved_in_care) {
    allowedClasses.add("family_shareable_by_involvement");
  }
  if (auth.authorization_on_file || auth.personal_representative) {
    allowedClasses.add("family_shareable_by_involvement");
    allowedClasses.add("family_shareable_by_authorization");
  }

  const scopeEmpty = auth.authorization_scope.length === 0;

  return sections.filter((s) => {
    if (s.disclosure_class === "sensitive_restricted") return false;
    if (!allowedClasses.has(s.disclosure_class)) return false;
    if (scopeEmpty) return true;
    if (s.scope_category === null) return false;
    return auth.authorization_scope.includes(s.scope_category);
  });
}

// Serializes a section array back into a plain text block the existing
// summarizer prompts can ingest. Preserves section names and separators.
export function serializeSectionsForPrompt(
  sections: StructuredNoteSection[],
  followUp: string | null
): string {
  if (sections.length === 0 && !followUp) return "(no shareable content)";

  const body = sections
    .map((s) => `## ${s.name}\n${s.text}`)
    .join("\n\n");
  const tail =
    followUp && followUp.toLowerCase() !== "none noted."
      ? `\n\nFollow-up: ${followUp}`
      : "";
  return body + tail;
}
