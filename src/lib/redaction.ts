/**
 * Pre-LLM PHI redaction layer for Taiwan PDPA + general defense-in-depth.
 *
 * Strips identifiers that have no clinical value before any caregiver
 * transcript or note text leaves the platform for an LLM (Claude / Whisper /
 * Vapi). Resident given names are PRESERVED — clinical context requires
 * being able to address the resident — but exact addresses, government
 * IDs, and full DOBs are redacted in favor of district / age band.
 *
 * Designed to be cheap (regex only) and conservative: prefer over-redaction
 * to under-redaction, and never modify text in a way that could change the
 * clinical meaning. The replacement tokens are kept short and obvious so
 * downstream prompts can still parse intent.
 *
 * USAGE: wrap any string heading to a third-party LLM with redactPhi(text)
 * BEFORE the API call. Do NOT wrap text written back to the database —
 * `notes.raw_input` and `voice_sessions.full_transcript` remain authoritative
 * sources of truth.
 *
 * Limitations of v1:
 *   - regex-only, no NER. A free-text full address that doesn't match the
 *     postal-format regexes will still slip through.
 *   - We do not redact phone numbers because care notes legitimately reference
 *     contact patterns ("daughter called at 11am").
 *   - We do not redact medical record numbers / NHI IDs yet — that's a
 *     follow-up once we have real samples to calibrate against.
 */

export interface RedactionStats {
  rocId: number;
  cccd: number;
  nik: number;
  dob: number;
  street: number;
  ssn: number;
}

const PATTERNS = {
  // Taiwan ROC ID: one letter (region) + 1 or 2 (gender) + 8 digits.
  rocId: /\b[A-Z][12]\d{8}\b/g,
  // Vietnamese CCCD (Citizen ID): 12 digits, often spaced as 3-3-3-3 or solid.
  // Conservative: only solid 12-digit runs to avoid stripping medication
  // dosages or year-mass-counts that happen to be 12 digits.
  cccd: /\b\d{12}\b/g,
  // Indonesian NIK: 16 digits.
  nik: /\b\d{16}\b/g,
  // Full DOB in ISO or US/EU forms. We replace with the year only (then a
  // separate post-step rounds the year to a 5-year band). Captures:
  //   2015-03-22, 1942-12-01, 03/22/2015, 22/03/2015, March 22, 1942
  dobIso: /\b(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g,
  dobSlash:
    /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/((19|20)\d{2})\b/g,
  // US Social Security Number (defense in depth even though we don't
  // expect SSNs in care notes; they sometimes appear in pasted forms).
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  // US-style street address line: number + street name + street type
  // (St / Ave / Rd / Blvd / Ln / Dr / Way). Permissive on street name
  // (any word characters and spaces).
  street:
    /\b\d{1,6}\s+[A-Za-z0-9.\-' ]{2,40}\s+(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Ln|Lane|Dr|Drive|Way|Ct|Court|Pl|Place)\b/g,
};

/**
 * Round a year to a 5-year band so the resulting "age" is fuzzy enough to
 * not be uniquely identifying. 1942 → "early 1940s", 1985 → "mid 1980s".
 */
function yearToBand(yearStr: string): string {
  const y = parseInt(yearStr, 10);
  if (Number.isNaN(y)) return "[YEAR]";
  const decadeStart = Math.floor(y / 10) * 10;
  const offset = y - decadeStart;
  let part: string;
  if (offset <= 3) part = "early";
  else if (offset <= 6) part = "mid";
  else part = "late";
  return `${part} ${decadeStart}s`;
}

/**
 * Strip identifiable PHI from a string. Pure function; never mutates input.
 * Returns the redacted text alongside per-category counts (useful for
 * logging "redacted N items before sending to Claude" without logging the
 * sensitive text itself).
 */
export function redactPhi(text: string): { text: string; stats: RedactionStats } {
  if (!text) {
    return {
      text,
      stats: { rocId: 0, cccd: 0, nik: 0, dob: 0, street: 0, ssn: 0 },
    };
  }

  const stats: RedactionStats = {
    rocId: 0,
    cccd: 0,
    nik: 0,
    dob: 0,
    street: 0,
    ssn: 0,
  };

  let out = text;

  out = out.replace(PATTERNS.rocId, () => {
    stats.rocId += 1;
    return "[ROC_ID_REDACTED]";
  });

  out = out.replace(PATTERNS.ssn, () => {
    stats.ssn += 1;
    return "[SSN_REDACTED]";
  });

  // Indonesian NIK BEFORE Vietnamese CCCD because NIK is longer (16 vs 12)
  // and we want the longer match to win.
  out = out.replace(PATTERNS.nik, () => {
    stats.nik += 1;
    return "[NIK_REDACTED]";
  });

  out = out.replace(PATTERNS.cccd, () => {
    stats.cccd += 1;
    return "[CCCD_REDACTED]";
  });

  out = out.replace(PATTERNS.dobIso, (match) => {
    stats.dob += 1;
    const yearMatch = match.match(/^\d{4}/);
    return yearMatch ? yearToBand(yearMatch[0]) : "[DOB_REDACTED]";
  });

  out = out.replace(PATTERNS.dobSlash, (_match, _m, _d, year) => {
    stats.dob += 1;
    return yearToBand(year);
  });

  out = out.replace(PATTERNS.street, () => {
    stats.street += 1;
    return "[ADDRESS_REDACTED]";
  });

  return { text: out, stats };
}

/**
 * Convenience wrapper that returns just the redacted text. Use when you
 * don't need the stats and want a single-line call site.
 */
export function redactPhiText(text: string): string {
  return redactPhi(text).text;
}

/**
 * Did the redactor change anything? Useful for log-level decisions
 * ("redaction occurred — log info" vs "no PHI detected — log debug").
 */
export function hasRedactions(stats: RedactionStats): boolean {
  return (
    stats.rocId > 0 ||
    stats.cccd > 0 ||
    stats.nik > 0 ||
    stats.dob > 0 ||
    stats.street > 0 ||
    stats.ssn > 0
  );
}
