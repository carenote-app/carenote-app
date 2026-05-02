/**
 * Shared prompt-fragment builders. Used by every prompt in `src/lib/prompts/`
 * to inject consistent cultural-register and language guidance into Claude
 * system prompts.
 *
 * The canonical specs live in `prompts/*.md`. When you change the wording
 * here, bump the corresponding spec's version + log it in the spec's Version
 * history section AND in `prompts/CHANGELOG.md`.
 */

import type { ResidentLocaleContext } from "@/lib/i18n/locale";

/**
 * Religion-specific phrasing rules. Kept here rather than in the prompts so
 * adding a new religion only touches one place. Empty string when religion
 * is unset or unrecognized — the prompt should still be valid without this.
 */
function religionRules(religion: string | null): string {
  if (!religion) return "";
  const r = religion.toLowerCase();

  if (
    r.includes("buddh") ||
    r.includes("taoist") ||
    r.includes("daoist") ||
    r.includes("佛") ||
    r.includes("道")
  ) {
    return "Buddhist/Taoist: avoid death-adjacent phrasing on lunar 1st and 15th and during Ghost Month (七月). Vegetarian on certain lunar dates is common.";
  }
  if (r.includes("catholic") || r.includes("công giáo") || r.includes("天主")) {
    return "Catholic: respect mourning periods; saint's day references are appropriate. Many Vietnamese residents are Catholic.";
  }
  if (r.includes("muslim") || r.includes("islam")) {
    return "Muslim: pork and alcohol avoidance; awareness of prayer times; Ramadan fasting considerations for elderly with medical exemptions.";
  }
  if (
    r.includes("cao đài") ||
    r.includes("cao dai") ||
    r.includes("hòa hảo") ||
    r.includes("hoa hao")
  ) {
    return "Cao Đài / Hòa Hảo: vegetarian on lunar 1, 8, 14, 15, 18, 23, 24, 28, 29, and 30.";
  }
  if (r.includes("protestant") || r.includes("christian")) {
    return "Protestant/Christian: respect mourning periods; sabbath-day awareness for some denominations.";
  }
  return "";
}

/**
 * Build the cultural-register block appended to system prompts. Returns
 * empty string when context is null/undefined so prompts can render without
 * cultural context for backwards compatibility (US-only orgs, demo).
 *
 * Variable interpolation is done in the renderer, not here — this function
 * returns ready-to-include text that can be appended verbatim to a system
 * prompt. Keep the wording aligned with `prompts/vapi-intake-assistant.md`
 * cultural-register section so caregivers and clinicians experience the
 * same register across surfaces.
 */
export function buildCulturalRegisterBlock(
  context: ResidentLocaleContext | null | undefined
): string {
  if (!context) return "";

  const lines: string[] = ["", "## Patient cultural context"];
  if (context.country_of_origin) {
    const yearsClause =
      context.years_in_taiwan !== null
        ? ` (years in Taiwan: ${context.years_in_taiwan})`
        : "";
    lines.push(`- Country of origin: ${context.country_of_origin}${yearsClause}`);
  }
  if (context.preferred_language) {
    lines.push(`- Preferred language: ${context.preferred_language}`);
  }
  if (context.family_name || context.given_name) {
    const fn = context.family_name || "(unknown)";
    const gn = context.given_name || "(unknown)";
    lines.push(`- Family name / given name: ${fn} / ${gn}`);
    lines.push(
      "- Use the given name with the honorific. Never use the family name as a first name. For Vietnamese names the family name comes first; for Indonesian mononyms the legal name may be used in both fields."
    );
  }
  if (context.honorific_preference) {
    lines.push(`- Honorific: ${context.honorific_preference}`);
  }
  const religion = religionRules(context.religion);
  if (context.religion) {
    lines.push(`- Religion: ${context.religion}`);
    if (religion) lines.push(`  ${religion}`);
  }
  if (context.dietary_restrictions.length > 0) {
    lines.push(`- Dietary: ${context.dietary_restrictions.join(", ")}`);
  }
  lines.push(
    `- Communication register: ${context.cultural_register}.${
      context.cultural_register === "indirect"
        ? " Soften bad-news framing; lead with positive observations before concerns; address elders with full honorific every time."
        : " Plainspoken, efficient, still warm."
    }`
  );

  return lines.join("\n");
}

/**
 * Append a "respond in {language}" instruction. Use when the prompt's output
 * language differs from the prompt's instruction language. Returns the
 * empty string for English (the default model output language).
 */
export function buildOutputLanguageInstruction(outputLanguage: string): string {
  if (!outputLanguage || outputLanguage === "en") return "";
  const labels: Record<string, string> = {
    "zh-TW": "Traditional Chinese (繁體中文)",
    vi: "Vietnamese",
    id: "Indonesian (Bahasa Indonesia)",
    tl: "Tagalog",
    th: "Thai",
  };
  const label = labels[outputLanguage] || outputLanguage;
  return `\n\n## Output language\nWrite the entire response in ${label}. Do not mix languages.`;
}
