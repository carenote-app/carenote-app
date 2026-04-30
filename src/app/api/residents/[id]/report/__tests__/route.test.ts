import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const PDF_FIXTURE = Buffer.from("%PDF-1.4 stub");

const { mockState } = vi.hoisted(() => ({
  mockState: {
    user: { id: "user-1", email: "caregiver@kinroster.com" } as
      | { id: string; email: string }
      | null,
    // Per-table data the chainable mock returns when awaited.
    tableData: new Map<string, unknown[]>(),
    // Per-table single-row data (used for .single()).
    tableSingle: new Map<string, unknown>(),
    inserts: [] as Array<{ table: string; row: unknown }>,
    fromCalls: [] as string[],
    builders: [] as Array<Record<string, unknown>>,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    const fromMock = vi.fn((table: string) => {
      mockState.fromCalls.push(table);
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
      for (const m of ["select", "eq", "gte", "lte", "or", "order", "limit"]) {
        builder[m] = chain(m);
      }
      builder.single = vi.fn(async () => ({
        data: mockState.tableSingle.get(table) ?? null,
        error: null,
      }));
      builder.insert = vi.fn(async (row: unknown) => {
        mockState.inserts.push({ table, row });
        return { data: null, error: null };
      });
      builder.then = (
        onFulfilled: (v: { data: unknown[]; error: null }) => unknown
      ) =>
        Promise.resolve({
          data: mockState.tableData.get(table) ?? [],
          error: null,
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

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(async (row: unknown) => {
        mockState.inserts.push({ table: "audit_events", row });
        return { data: null, error: null };
      }),
    })),
  })),
}));

vi.mock("@/lib/pdf/report-document", () => ({
  renderReport: vi.fn(async () => PDF_FIXTURE),
}));

const sendExportEmailMock = vi.fn(
  (args: Record<string, unknown>): Promise<{ id: string }> => {
    void args;
    return Promise.resolve({ id: "resend-msg-1" });
  }
);
vi.mock("@/lib/resend", () => ({
  sendExportEmail: (args: Record<string, unknown>) =>
    sendExportEmailMock(args),
}));

import { POST } from "../route";

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/residents/r-1/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mockState.user = { id: "user-1", email: "caregiver@kinroster.com" };
  mockState.tableData = new Map<string, unknown[]>();
  mockState.tableSingle = new Map<string, unknown>();
  mockState.inserts = [];
  mockState.fromCalls = [];
  mockState.builders = [];
  sendExportEmailMock.mockClear();

  // Default fixtures wired for a successful run.
  mockState.tableSingle.set("users", {
    organization_id: "org-1",
    full_name: "Maria Santos",
    email: "caregiver@kinroster.com",
  });
  mockState.tableSingle.set("residents", {
    id: "r-1",
    organization_id: "org-1",
    first_name: "Dorothy",
    last_name: "Chen",
    room_number: "3A",
    date_of_birth: "1940-03-15",
    conditions: "dementia",
    preferences: "morning walks",
    status: "active",
  });
  mockState.tableSingle.set("organizations", { name: "Sunrise Senior Care" });

  mockState.tableData.set("notes", [
    {
      id: "n-1",
      created_at: "2026-04-25T09:00:00Z",
      shift: "morning",
      raw_input: "raw",
      structured_output: JSON.stringify({
        summary: "Calm day.",
        sections: [],
        follow_up: "None noted.",
        flags: [],
        sensitive_flag: false,
        sensitive_category: null,
      }),
      edited_output: null,
      is_structured: true,
      flagged_as_incident: false,
      sensitive_flag: false,
      users: { full_name: "James Wilson" },
    },
  ]);
  mockState.tableData.set("incident_reports", []);
  mockState.tableData.set("weekly_summaries", []);
  mockState.tableData.set("resident_clinicians", []);
  mockState.tableData.set("family_contacts", []);
});

const validBody = {
  dateRangeStart: "2026-04-23T00:00:00Z",
  dateRangeEnd: "2026-04-30T23:59:59Z",
};

describe("POST /api/residents/[id]/report", () => {
  it("rejects unauthenticated callers with 401", async () => {
    mockState.user = null;
    const res = await POST(
      makeRequest({ ...validBody, delivery: { mode: "download" } }),
      ctx("r-1")
    );
    expect(res.status).toBe(401);
  });

  it("rejects an invalid date range with 400", async () => {
    const res = await POST(
      makeRequest({
        dateRangeStart: "2026-04-30",
        dateRangeEnd: "2026-04-01",
        delivery: { mode: "download" },
      }),
      ctx("r-1")
    );
    expect(res.status).toBe(400);
  });

  it("rejects a malformed email recipient with 400", async () => {
    const res = await POST(
      makeRequest({
        ...validBody,
        delivery: { mode: "email", to: "not-an-email" },
      }),
      ctx("r-1")
    );
    expect(res.status).toBe(400);
  });

  it("returns the PDF on download mode and writes both ledger rows", async () => {
    const res = await POST(
      makeRequest({ ...validBody, delivery: { mode: "download" } }),
      ctx("r-1")
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /attachment; filename="kinroster-report-chen-dorothy-2026-04-23-to-2026-04-30\.pdf"/
    );

    const disclosure = mockState.inserts.find(
      (i) => i.table === "disclosure_events"
    );
    expect(disclosure).toBeDefined();
    const dRow = disclosure!.row as Record<string, unknown>;
    expect(dRow.recipient_type).toBe("agency_internal");
    expect(dRow.legal_basis).toBe("operations");
    expect(dRow.delivery_method).toBe("pdf_export");
    expect(dRow.source_note_ids).toEqual(["n-1"]);

    const audit = mockState.inserts.find((i) => i.table === "audit_events");
    expect(audit).toBeDefined();
    const aRow = audit!.row as Record<string, unknown>;
    expect(aRow.event_type).toBe("export");
    const meta = aRow.metadata as Record<string, unknown>;
    expect(meta.format).toBe("pdf");
    expect(meta.delivery_mode).toBe("download");
    expect(meta.note_count).toBe(1);
  });

  it("filters sensitive notes at the SQL layer (eq sensitive_flag false)", async () => {
    await POST(
      makeRequest({ ...validBody, delivery: { mode: "download" } }),
      ctx("r-1")
    );

    const notesBuilder = mockState.builders.find(
      (b) => (b as { _table: string })._table === "notes"
    ) as { _calls: Array<{ method: string; args: unknown[] }> };
    const eqCalls = notesBuilder._calls.filter((c) => c.method === "eq");
    const sensitiveEq = eqCalls.find(
      (c) => c.args[0] === "sensitive_flag"
    );
    expect(sensitiveEq).toBeDefined();
    expect(sensitiveEq!.args[1]).toBe(false);
  });

  it("emails the PDF and records delivery_method='email' on the disclosure ledger", async () => {
    const res = await POST(
      makeRequest({
        ...validBody,
        delivery: {
          mode: "email",
          to: "manager@sunrise.com",
          message: "FYI for tomorrow's review.",
        },
      }),
      ctx("r-1")
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(sendExportEmailMock).toHaveBeenCalledTimes(1);
    const callArg = sendExportEmailMock.mock.calls[0][0];
    expect(callArg.to).toBe("manager@sunrise.com");
    expect(callArg.message).toBe("FYI for tomorrow's review.");
    expect(callArg.pdfBuffer).toBe(PDF_FIXTURE);
    expect(callArg.pdfFilename).toMatch(
      /^kinroster-report-chen-dorothy-2026-04-23-to-2026-04-30\.pdf$/
    );

    const disclosure = mockState.inserts.find(
      (i) => i.table === "disclosure_events"
    )!.row as Record<string, unknown>;
    expect(disclosure.delivery_method).toBe("email");

    const audit = mockState.inserts.find(
      (i) => i.table === "audit_events"
    )!.row as Record<string, unknown>;
    const meta = audit.metadata as Record<string, unknown>;
    expect(meta.delivery_mode).toBe("email");
    expect(meta.recipient_email_domain).toBe("sunrise.com");
  });

  it("returns 502 if email send fails and does NOT write the ledger", async () => {
    sendExportEmailMock.mockRejectedValueOnce(new Error("Resend down"));

    const res = await POST(
      makeRequest({
        ...validBody,
        delivery: { mode: "email", to: "manager@sunrise.com" },
      }),
      ctx("r-1")
    );
    expect(res.status).toBe(502);

    expect(
      mockState.inserts.find((i) => i.table === "disclosure_events")
    ).toBeUndefined();
  });

  it("returns 404 when the resident isn't found", async () => {
    mockState.tableSingle.set("residents", null);

    const res = await POST(
      makeRequest({ ...validBody, delivery: { mode: "download" } }),
      ctx("r-1")
    );
    expect(res.status).toBe(404);
  });
});
