import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockState } = vi.hoisted(() => ({
  mockState: {
    user: { id: "user-1" } as { id: string } | null,
    queryResult: { data: [] as unknown[], error: null as { message: string } | null },
    builder: null as null | ReturnType<() => Record<string, ReturnType<typeof vi.fn>>>,
    fromMock: null as null | ReturnType<typeof vi.fn>,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    // Build a fresh chainable query builder per createClient call so each
    // request can inspect what the route did to it.
    const calls: Array<{ method: string; args: unknown[] }> = [];
    const builder: Record<string, ReturnType<typeof vi.fn>> & {
      then?: unknown;
      _calls?: typeof calls;
    } = {};
    const chainMethods = [
      "select",
      "eq",
      "order",
      "limit",
      "lt",
      "gte",
      "lte",
      "ilike",
      "or",
    ] as const;
    for (const method of chainMethods) {
      builder[method] = vi.fn((...args: unknown[]) => {
        calls.push({ method, args });
        return builder;
      });
    }
    // Make the builder thenable so `await query` resolves to { data, error }.
    builder.then = (
      onFulfilled: (
        v: { data: unknown[]; error: { message: string } | null }
      ) => unknown
    ) => Promise.resolve(mockState.queryResult).then(onFulfilled);
    builder._calls = calls;
    mockState.builder = builder;

    const fromMock = vi.fn().mockReturnValue(builder);
    mockState.fromMock = fromMock;

    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockState.user },
          error: null,
        }),
      },
      from: fromMock,
    };
  }),
}));

import { GET } from "../route";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url));
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mockState.user = { id: "user-1" };
  mockState.queryResult = { data: [], error: null };
  mockState.builder = null;
  mockState.fromMock = null;
});

describe("GET /api/residents/[id]/notes", () => {
  it("returns 401 when no authenticated user", async () => {
    mockState.user = null;

    const res = await GET(
      makeRequest("http://localhost/api/residents/r-1/notes"),
      ctx("r-1")
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("scopes the query to the resident from the route param", async () => {
    mockState.queryResult = { data: [{ id: "n-1" }], error: null };

    await GET(
      makeRequest("http://localhost/api/residents/r-42/notes"),
      ctx("r-42")
    );

    expect(mockState.fromMock).toHaveBeenCalledWith("notes");
    expect(mockState.builder!.eq).toHaveBeenCalledWith("resident_id", "r-42");
  });

  it("orders by created_at descending and applies the default limit of 50", async () => {
    await GET(
      makeRequest("http://localhost/api/residents/r-1/notes"),
      ctx("r-1")
    );

    expect(mockState.builder!.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(mockState.builder!.limit).toHaveBeenCalledWith(50);
  });

  it("clamps limit to the MAX_PAGE_SIZE of 100", async () => {
    await GET(
      makeRequest("http://localhost/api/residents/r-1/notes?limit=500"),
      ctx("r-1")
    );

    expect(mockState.builder!.limit).toHaveBeenCalledWith(100);
  });

  it("clamps a non-positive or non-numeric limit to a minimum of 1", async () => {
    await GET(
      makeRequest("http://localhost/api/residents/r-1/notes?limit=0"),
      ctx("r-1")
    );
    expect(mockState.builder!.limit).toHaveBeenCalledWith(1);

    mockState.builder = null;
    await GET(
      makeRequest("http://localhost/api/residents/r-1/notes?limit=abc"),
      ctx("r-1")
    );
    // Non-numeric falls back to DEFAULT_PAGE_SIZE (50), then clamped.
    expect(mockState.builder!.limit).toHaveBeenCalledWith(50);
  });

  it("translates a `before` cursor into lt('created_at', cursor) for keyset pagination", async () => {
    await GET(
      makeRequest(
        "http://localhost/api/residents/r-1/notes?before=2026-04-15T10:00:00Z"
      ),
      ctx("r-1")
    );

    expect(mockState.builder!.lt).toHaveBeenCalledWith(
      "created_at",
      "2026-04-15T10:00:00Z"
    );
  });

  it("does not call lt when no `before` cursor is provided", async () => {
    await GET(
      makeRequest("http://localhost/api/residents/r-1/notes"),
      ctx("r-1")
    );

    expect(mockState.builder!.lt).not.toHaveBeenCalled();
  });

  it("forwards filters (start, end, search, incidents) into the query chain", async () => {
    await GET(
      makeRequest(
        "http://localhost/api/residents/r-1/notes?start=2026-04-01&end=2026-04-15&search=fall&incidents=1"
      ),
      ctx("r-1")
    );

    expect(mockState.builder!.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-04-01T00:00:00Z"
    );
    expect(mockState.builder!.lte).toHaveBeenCalledWith(
      "created_at",
      "2026-04-15T23:59:59Z"
    );
    expect(mockState.builder!.eq).toHaveBeenCalledWith(
      "flagged_as_incident",
      true
    );
    expect(mockState.builder!.or).toHaveBeenCalledWith(
      'raw_input.ilike."%fall%",structured_output.ilike."%fall%",edited_output.ilike."%fall%"'
    );
  });

  it("returns hasMore: true when the page is full to the requested limit", async () => {
    mockState.queryResult = {
      data: Array.from({ length: 50 }, (_, i) => ({ id: `n-${i}` })),
      error: null,
    };

    const res = await GET(
      makeRequest("http://localhost/api/residents/r-1/notes"),
      ctx("r-1")
    );
    const body = (await res.json()) as { hasMore: boolean; notes: unknown[] };

    expect(body.hasMore).toBe(true);
    expect(body.notes).toHaveLength(50);
  });

  it("returns hasMore: false when fewer rows than the limit come back", async () => {
    mockState.queryResult = {
      data: [{ id: "n-1" }, { id: "n-2" }],
      error: null,
    };

    const res = await GET(
      makeRequest("http://localhost/api/residents/r-1/notes"),
      ctx("r-1")
    );
    const body = (await res.json()) as { hasMore: boolean };

    expect(body.hasMore).toBe(false);
  });

  it("propagates Postgres errors as 500 with the error message", async () => {
    mockState.queryResult = {
      data: [],
      error: { message: "boom" },
    };

    const res = await GET(
      makeRequest("http://localhost/api/residents/r-1/notes"),
      ctx("r-1")
    );

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("boom");
  });

  it("returns notes: [] (not undefined) when the query data is null", async () => {
    mockState.queryResult = {
      data: null as unknown as unknown[],
      error: null,
    };

    const res = await GET(
      makeRequest("http://localhost/api/residents/r-1/notes"),
      ctx("r-1")
    );
    const body = (await res.json()) as { notes: unknown[]; hasMore: boolean };

    expect(body.notes).toEqual([]);
    expect(body.hasMore).toBe(false);
  });
});
