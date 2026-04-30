// Shared filter helper used by both the resident detail server component
// (initial render) and /api/residents/[id]/notes (Load older). Keeping the
// filter shape and application logic in one place ensures the two stay in
// lockstep.
//
// Expects a Supabase PostgrestFilterBuilder for the notes table; returns it
// with all applicable filters chained on. Caller still adds .order() and
// .limit() / .range().

export interface NotesQueryFilters {
  start?: string;       // ISO date "YYYY-MM-DD" — inclusive
  end?: string;         // ISO date "YYYY-MM-DD" — inclusive (interpreted as end-of-day)
  search?: string;      // free text matched against raw_input
  incidents?: boolean;  // when true, restrict to flagged_as_incident = true
}

export function parseNotesFiltersFromSearchParams(
  params: Record<string, string | string[] | undefined>
): NotesQueryFilters {
  const get = (key: string): string | undefined => {
    const value = params[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const start = get("start");
  const end = get("end");
  const search = get("search")?.trim();
  const incidents = get("incidents") === "1";

  return {
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    ...(search ? { search } : {}),
    ...(incidents ? { incidents: true } : {}),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotesQuery = any;

export function applyNotesFilters(
  query: NotesQuery,
  filters: NotesQueryFilters
): NotesQuery {
  let q = query;
  if (filters.start) {
    q = q.gte("created_at", `${filters.start}T00:00:00Z`);
  }
  if (filters.end) {
    q = q.lte("created_at", `${filters.end}T23:59:59Z`);
  }
  if (filters.incidents) {
    q = q.eq("flagged_as_incident", true);
  }
  if (filters.search) {
    // Match against the caregiver's raw input (the canonical source of
    // truth) AND the AI-structured / edited outputs (what the user
    // actually sees on screen). Without the structured columns, a search
    // for a phrase only present in the AI tidy-up — e.g. "short-tempered
    // behavior" — silently returns nothing because the original raw note
    // used different words. Postgres ilike is index-free here; the
    // resident_id filter and LIMIT bound the rows scanned.
    //
    // structured_output and edited_output are stored as JSON-encoded
    // strings on the notes table, so a substring match works without
    // casting.
    const escaped = filters.search.replace(/[%_]/g, (c) => `\\${c}`);
    // PostgREST `or()` separates predicates with commas. Any comma /
    // parenthesis in the user's search would corrupt the parser, so wrap
    // the value in double quotes — PostgREST treats quoted values as
    // opaque.
    const escapedForOr = escaped.replace(/"/g, '\\"');
    q = q.or(
      [
        `raw_input.ilike."%${escapedForOr}%"`,
        `structured_output.ilike."%${escapedForOr}%"`,
        `edited_output.ilike."%${escapedForOr}%"`,
      ].join(",")
    );
  }
  return q;
}

// Used by the Load older fetch on the client to forward the current URL
// filters back to the API route. Returns an empty string if no filters
// are active.
export function notesFiltersToQueryString(filters: NotesQueryFilters): string {
  const params = new URLSearchParams();
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  if (filters.search) params.set("search", filters.search);
  if (filters.incidents) params.set("incidents", "1");
  const qs = params.toString();
  return qs ? `&${qs}` : "";
}
