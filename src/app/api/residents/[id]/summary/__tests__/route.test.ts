import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockState } = vi.hoisted(() => ({
  mockState: {
    user: { id: "user-1", email: "caregiver@kinroster.com" } as
      | { id: string; email: string }
      | null,
    tableData: new Map<string, unknown[]>(),
    tableSingle: new Map<string, unknown>(),
    tableCount: new Map<string, number>(),
    builders: [] as Array<Record<string, unknown>>,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    const fromMock = vi.fn((table: string) => {
      const callLog: Array<{ method: string; args: unknown[] }> = [];
      const builder: Record<string, unknown> = {
        _table: table,
        _calls: callLog,
      };
      const chain = (method: string) =>
        vi.fn((...args: unknown[]) => {
          callLog.push({ method, args });
          return builder;
        });
      for (const m of ["select", "eq", "gte", "lte", "order"]) {
        builder[m] = chain(m);
      }
      builder.single = vi.fn(async () => ({
        data: mockState.tableSingle.get(table) ?? null,
        error: null,
      }));
      builder.then = (
        onFulfilled: (v: {
          data: unknown[];
          error: null;
          count?: number | null;
        }) => unknown
      ) =>
        Promise.resolve({
          data: mockState.tableData.get(table) ?? [],
          error: null,
          count: mockState.tableCount.get(table) ?? null,
        }).then(onFulfilled);
      mockState.builders.push(builder);
      return builder;
    });

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

const callClaudeMock = vi.fn(
  (args: { systemPrompt: string; userPrompt: string; model?: string }): Promise<string> => {
    void args;
    return Promise.resolve("Across today, two notes were logged for Dorothy. Calm morning, quiet evening.");
  }
);
vi.mock("@/lib/claude", () => ({
  callClaude: (args: { systemPrompt: string; userPrompt: string; model?: string }) =>
    callClaudeMock(args),
}));

import { POST } from "../route";

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/residents/r-1/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mockState.user = { id: "user-1", email: "caregiver@kinroster.com" };
  mockState.tableData = new Map();
  mockState.tableSingle = new Map();
  mockState.tableCount = new Map();
  mockState.builders = [];
  callClaudeMock.mockClear();
  callClaudeMock.mockResolvedValue(
    "Across today, two notes were logged for Dorothy. Calm morning, quiet evening."
  );

  mockState.tableSingle.set("residents", {
    id: "r-1",
    organization_id: "org-1",
    first_name: "Dorothy",
    last_name: "Chen",
    organizations: { timezone: "America/Los_Angeles" },
  });

  mockState.tableData.set("notes", [
    {
      id: "n-1",
      created_at: "2026-04-30T09:00:00Z",
      shift: "morning",
      structured_output: JSON.stringify({
        summary: "Calm morning.",
        sections: [],
      }),
      edited_output: null,
      sensitive_flag: false,
      users: { full_name: "James Wilson" },
    },
    {
      id: "n-2",
      created_at: "2026-04-30T18:00:00Z",
      shift: "evening",
      structured_output: JSON.stringify({
        summary: "Quiet evening.",
        sections: [],
      }),
      edited_output: null,
      sensitive_flag: false,
      users: { full_name: "Maria Santos" },
    },
  ]);
  mockState.tableCount.set("notes", 0);
});

describe("POST /api/residents/[id]/summary", () => {
  it("returns 401 when no authenticated user", async () => {
    mockState.user = null;
    const res = await POST(
      makeRequest({ preset: "today" }),
      ctx("r-1")
    );
    expect(res.status).toBe(401);
  });

  it("rejects an invalid preset with 400", async () => {
    const res = await POST(
      makeRequest({ preset: "yesterday" }),
      ctx("r-1")
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/preset must be one of/);
  });

  it("rejects a missing range and missing preset with 400", async () => {
    const res = await POST(makeRequest({}), ctx("r-1"));
    expect(res.status).toBe(400);
  });

  it("rejects an inverted custom date range with 400", async () => {
    const res = await POST(
      makeRequest({
        dateRangeStart: "2026-05-01",
        dateRangeEnd: "2026-04-01",
      }),
      ctx("r-1")
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the resident isn't visible", async () => {
    mockState.tableSingle.set("residents", null);
    const res = await POST(makeRequest({ preset: "today" }), ctx("r-1"));
    expect(res.status).toBe(404);
  });

  it("filters out sensitive notes via SQL eq filter", async () => {
    await POST(makeRequest({ preset: "today" }), ctx("r-1"));

    const notesBuilders = mockState.builders.filter(
      (b) => (b as { _table: string })._table === "notes"
    );
    // First "notes" builder is the data fetch with the eq sensitive_flag false
    const calls = (notesBuilders[0] as {
      _calls: Array<{ method: string; args: unknown[] }>;
    })._calls;
    const sensitiveEq = calls.find(
      (c) => c.method === "eq" && c.args[0] === "sensitive_flag"
    );
    expect(sensitiveEq).toBeDefined();
    expect(sensitiveEq!.args[1]).toBe(false);
  });

  it("calls Claude with the caregiver system prompt and Haiku model on the happy path", async () => {
    const res = await POST(makeRequest({ preset: "today" }), ctx("r-1"));
    expect(res.status).toBe(200);

    expect(callClaudeMock).toHaveBeenCalledTimes(1);
    const args = callClaudeMock.mock.calls[0][0];
    expect(args.model).toBe("claude-haiku-4-5-20251001");
    expect(args.systemPrompt).toMatch(/plain text only/i);
    expect(args.userPrompt).toContain("Resident first name: Dorothy");
    expect(args.userPrompt).toContain("Period being summarised: today");

    const body = (await res.json()) as {
      summary: string;
      noteCount: number;
      excludedSensitiveCount: number;
      rangeLabel: string;
    };
    expect(body.noteCount).toBe(2);
    expect(body.rangeLabel).toBe("today");
    expect(body.summary).toContain("Dorothy");
  });

  it("short-circuits with a no-notes message when the range is empty", async () => {
    mockState.tableData.set("notes", []);
    const res = await POST(makeRequest({ preset: "today" }), ctx("r-1"));
    expect(res.status).toBe(200);
    expect(callClaudeMock).not.toHaveBeenCalled();
    const body = (await res.json()) as { summary: string; noteCount: number };
    expect(body.summary).toBe("No notes were logged for Dorothy in today.");
    expect(body.noteCount).toBe(0);
  });

  it("surfaces the count of sensitive notes excluded from the summary", async () => {
    mockState.tableCount.set("notes", 3);
    const res = await POST(makeRequest({ preset: "today" }), ctx("r-1"));
    const body = (await res.json()) as { excludedSensitiveCount: number };
    // The count is taken from the second `from('notes')` query (head: true with sensitive_flag = true)
    expect(body.excludedSensitiveCount).toBe(3);
  });

  it("returns 502 when Claude fails", async () => {
    callClaudeMock.mockRejectedValueOnce(new Error("Anthropic 503"));
    const res = await POST(makeRequest({ preset: "today" }), ctx("r-1"));
    expect(res.status).toBe(502);
  });

  it("accepts a custom date range when no preset is given", async () => {
    const res = await POST(
      makeRequest({
        dateRangeStart: "2026-04-23T00:00:00Z",
        dateRangeEnd: "2026-04-30T23:59:59Z",
      }),
      ctx("r-1")
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rangeLabel: string };
    expect(body.rangeLabel).toBe("2026-04-23 – 2026-04-30");
  });
});
