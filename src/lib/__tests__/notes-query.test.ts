import { describe, it, expect, vi } from "vitest";
import {
  parseNotesFiltersFromSearchParams,
  applyNotesFilters,
  notesFiltersToQueryString,
  type NotesQueryFilters,
} from "../notes-query";

describe("parseNotesFiltersFromSearchParams", () => {
  it("returns an empty object when no filter params are present", () => {
    expect(parseNotesFiltersFromSearchParams({})).toEqual({});
  });

  it("extracts start, end, search, and incidents=1", () => {
    const result = parseNotesFiltersFromSearchParams({
      start: "2026-04-01",
      end: "2026-04-15",
      search: "fall",
      incidents: "1",
    });
    expect(result).toEqual({
      start: "2026-04-01",
      end: "2026-04-15",
      search: "fall",
      incidents: true,
    });
  });

  it("trims whitespace from search and drops it when empty", () => {
    expect(parseNotesFiltersFromSearchParams({ search: "  hip  " })).toEqual({
      search: "hip",
    });
    expect(parseNotesFiltersFromSearchParams({ search: "   " })).toEqual({});
  });

  it("treats incidents values other than '1' as false (omitted)", () => {
    expect(parseNotesFiltersFromSearchParams({ incidents: "0" })).toEqual({});
    expect(parseNotesFiltersFromSearchParams({ incidents: "true" })).toEqual({});
    expect(parseNotesFiltersFromSearchParams({ incidents: "" })).toEqual({});
  });

  it("takes the first value when a param is repeated as an array", () => {
    expect(
      parseNotesFiltersFromSearchParams({
        start: ["2026-04-01", "2026-05-01"],
      })
    ).toEqual({ start: "2026-04-01" });
  });

  it("ignores undefined param values without throwing", () => {
    expect(
      parseNotesFiltersFromSearchParams({
        start: undefined,
        end: undefined,
        search: undefined,
        incidents: undefined,
      })
    ).toEqual({});
  });

  it("does not include keys for absent filters (no undefined values in the output)", () => {
    const result = parseNotesFiltersFromSearchParams({ start: "2026-04-01" });
    expect(Object.keys(result)).toEqual(["start"]);
  });
});

// Builds a chainable spy mock that mirrors the Supabase PostgrestFilterBuilder
// surface used by applyNotesFilters: gte / lte / eq / ilike / or all
// returning the same builder so calls can be chained and inspected.
function makeQueryBuilder() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder = {
    gte: vi.fn((...args: unknown[]) => {
      calls.push({ method: "gte", args });
      return builder;
    }),
    lte: vi.fn((...args: unknown[]) => {
      calls.push({ method: "lte", args });
      return builder;
    }),
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ method: "eq", args });
      return builder;
    }),
    ilike: vi.fn((...args: unknown[]) => {
      calls.push({ method: "ilike", args });
      return builder;
    }),
    or: vi.fn((...args: unknown[]) => {
      calls.push({ method: "or", args });
      return builder;
    }),
    calls,
  };
  return builder;
}

describe("applyNotesFilters", () => {
  it("returns the query unchanged when no filters are set", () => {
    const q = makeQueryBuilder();
    applyNotesFilters(q, {});
    expect(q.calls).toHaveLength(0);
  });

  it("applies gte('created_at', startDate + T00:00:00Z) for start", () => {
    const q = makeQueryBuilder();
    applyNotesFilters(q, { start: "2026-04-01" });
    expect(q.calls).toEqual([
      { method: "gte", args: ["created_at", "2026-04-01T00:00:00Z"] },
    ]);
  });

  it("applies lte('created_at', endDate + T23:59:59Z) for end (inclusive end-of-day)", () => {
    const q = makeQueryBuilder();
    applyNotesFilters(q, { end: "2026-04-15" });
    expect(q.calls).toEqual([
      { method: "lte", args: ["created_at", "2026-04-15T23:59:59Z"] },
    ]);
  });

  it("applies eq('flagged_as_incident', true) when incidents is true", () => {
    const q = makeQueryBuilder();
    applyNotesFilters(q, { incidents: true });
    expect(q.calls).toEqual([
      { method: "eq", args: ["flagged_as_incident", true] },
    ]);
  });

  it("searches raw_input AND structured_output AND edited_output via .or()", () => {
    // Searching only raw_input misses notes whose AI-structured text
    // (the part the user actually sees on screen) contains the term —
    // e.g. searching "short-tempered behavior" when the original raw
    // note said "acting up". Cover all three columns.
    const q = makeQueryBuilder();
    applyNotesFilters(q, { search: "fall" });
    expect(q.calls).toEqual([
      {
        method: "or",
        args: [
          'raw_input.ilike."%fall%",structured_output.ilike."%fall%",edited_output.ilike."%fall%"',
        ],
      },
    ]);
  });

  it("escapes ilike wildcards in the search term to prevent injection of % and _", () => {
    const q = makeQueryBuilder();
    applyNotesFilters(q, { search: "100% certain_yes" });
    expect(q.calls).toEqual([
      {
        method: "or",
        args: [
          'raw_input.ilike."%100\\% certain\\_yes%",structured_output.ilike."%100\\% certain\\_yes%",edited_output.ilike."%100\\% certain\\_yes%"',
        ],
      },
    ]);
  });

  it("escapes embedded double quotes in the search term so the PostgREST or() parser stays sane", () => {
    const q = makeQueryBuilder();
    applyNotesFilters(q, { search: 'said "ouch"' });
    const orCall = q.calls.find((c) => c.method === "or");
    expect(orCall).toBeDefined();
    // Each predicate's value is wrapped in double quotes; embedded
    // quotes are backslash-escaped so the wrapping stays balanced.
    expect(orCall!.args[0]).toContain('raw_input.ilike."%said \\"ouch\\"%"');
  });

  it("chains all filters when all are set", () => {
    const q = makeQueryBuilder();
    applyNotesFilters(q, {
      start: "2026-04-01",
      end: "2026-04-15",
      incidents: true,
      search: "hip pain",
    });
    expect(q.gte).toHaveBeenCalledWith("created_at", "2026-04-01T00:00:00Z");
    expect(q.lte).toHaveBeenCalledWith("created_at", "2026-04-15T23:59:59Z");
    expect(q.eq).toHaveBeenCalledWith("flagged_as_incident", true);
    expect(q.or).toHaveBeenCalledWith(
      'raw_input.ilike."%hip pain%",structured_output.ilike."%hip pain%",edited_output.ilike."%hip pain%"'
    );
  });

  it("returns the chainable builder back so callers can keep adding .order() / .limit()", () => {
    const q = makeQueryBuilder();
    const result = applyNotesFilters(q, { incidents: true });
    expect(result).toBe(q);
  });
});

describe("notesFiltersToQueryString", () => {
  it("returns an empty string when no filters are set", () => {
    expect(notesFiltersToQueryString({})).toBe("");
  });

  it("prefixes the result with '&' so it can be appended to an existing query string", () => {
    const result = notesFiltersToQueryString({ start: "2026-04-01" });
    expect(result.startsWith("&")).toBe(true);
  });

  it("serializes start, end, search, and incidents=1", () => {
    const result = notesFiltersToQueryString({
      start: "2026-04-01",
      end: "2026-04-15",
      search: "fall",
      incidents: true,
    });
    const qs = new URLSearchParams(result.slice(1));
    expect(qs.get("start")).toBe("2026-04-01");
    expect(qs.get("end")).toBe("2026-04-15");
    expect(qs.get("search")).toBe("fall");
    expect(qs.get("incidents")).toBe("1");
  });

  it("omits keys for absent filters", () => {
    const result = notesFiltersToQueryString({ search: "fall" });
    const qs = new URLSearchParams(result.slice(1));
    expect(qs.has("start")).toBe(false);
    expect(qs.has("end")).toBe(false);
    expect(qs.has("incidents")).toBe(false);
    expect(qs.get("search")).toBe("fall");
  });

  it("omits incidents=false (the helper only encodes truthy incidents)", () => {
    const filters: NotesQueryFilters = { incidents: false as unknown as true };
    const result = notesFiltersToQueryString(filters);
    expect(result).toBe("");
  });
});
