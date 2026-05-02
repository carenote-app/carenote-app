import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cultural register tag used to drive prompt phrasing across Workstreams A and C.
 * - "indirect": soften bad-news framing, lead with positive observations,
 *   address elders with full honorific. Default for residents from
 *   Taiwan / Vietnam / Indonesia / Philippines / Thailand and unknown origin.
 * - "direct": efficient, plainspoken. For residents from US / EU / Australia / NZ.
 */
export type CulturalRegister = "indirect" | "direct";

/**
 * Per-resident locale + cultural context. Returned by {@link getResidentContext}
 * and consumed by:
 *   - Workstream A: src/lib/vapi.ts buildAssistantOverrides → Vapi variableValues
 *   - Workstream C: src/lib/prompts/_shared.ts cultural-register block builder
 *
 * `output_language` is the language clinical/family output should be rendered in
 * for THIS resident's audience matrix. The clinician summary uses the org's
 * `default_clinical_language`; the family update uses each family contact's
 * `preferred_communication_language`. This field is the resident-level fallback.
 */
export interface ResidentLocaleContext {
  preferred_language: string | null;
  output_language: string;
  cultural_register: CulturalRegister;
  honorific_preference: string | null;
  family_name: string | null;
  given_name: string | null;
  religion: string | null;
  dietary_restrictions: string[];
  country_of_origin: string | null;
  years_in_taiwan: number | null;
}

const INDIRECT_REGISTER_COUNTRIES = new Set([
  "TW", "Taiwan", "台灣",
  "VN", "Vietnam", "Việt Nam", "越南",
  "ID", "Indonesia",
  "PH", "Philippines", "Pilipinas",
  "TH", "Thailand", "ไทย",
  "JP", "Japan", "日本",
  "KR", "South Korea", "Korea", "대한민국",
  "CN", "China", "中國", "中国",
  "HK", "Hong Kong", "香港",
  "MY", "Malaysia",
  "SG", "Singapore",
]);

function deriveCulturalRegister(country: string | null | undefined): CulturalRegister {
  if (!country) return "indirect";
  return INDIRECT_REGISTER_COUNTRIES.has(country) ? "indirect" : "direct";
}

/**
 * Resolve the BCP-47 locale for a caregiver. Falls back through:
 *   user.preferred_language → org.default_output_language → "en"
 */
export async function getCaregiverLocale(userId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("preferred_language, organization_id")
    .eq("id", userId)
    .single();

  if (!user) return "en";
  if (user.preferred_language) return user.preferred_language;

  const { data: org } = await supabase
    .from("organizations")
    .select("default_output_language")
    .eq("id", user.organization_id)
    .single();

  return org?.default_output_language || "en";
}

/**
 * Assemble the cultural + linguistic context for a resident. Used by every
 * Vapi call start and every Claude prompt that addresses or references the
 * resident.
 *
 * The contract is intentionally narrow: this function only assembles fields
 * that affect language and cultural register. Clinical context (conditions,
 * care_notes_context) is fetched separately by the existing call sites so
 * we don't entangle locale with PHI loading.
 */
export async function getResidentContext(
  residentId: string
): Promise<ResidentLocaleContext> {
  const supabase = createAdminClient();
  const { data: resident } = await supabase
    .from("residents")
    .select(
      "preferred_language, country_of_origin, years_in_taiwan, religion, dietary_restrictions, family_name, given_name, honorific_preference, organization_id"
    )
    .eq("id", residentId)
    .single();

  if (!resident) {
    return {
      preferred_language: null,
      output_language: "en",
      cultural_register: "indirect",
      honorific_preference: null,
      family_name: null,
      given_name: null,
      religion: null,
      dietary_restrictions: [],
      country_of_origin: null,
      years_in_taiwan: null,
    };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("default_output_language")
    .eq("id", resident.organization_id)
    .single();

  const output_language =
    resident.preferred_language || org?.default_output_language || "en";

  return {
    preferred_language: resident.preferred_language,
    output_language,
    cultural_register: deriveCulturalRegister(resident.country_of_origin),
    honorific_preference: resident.honorific_preference,
    family_name: resident.family_name,
    given_name: resident.given_name,
    religion: resident.religion,
    dietary_restrictions: resident.dietary_restrictions || [],
    country_of_origin: resident.country_of_origin,
    years_in_taiwan: resident.years_in_taiwan,
  };
}
