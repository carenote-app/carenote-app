// Server-side audit event helper. Writes to the append-only audit_events
// table via the service-role client — the table has no user-facing INSERT
// policy, so this is the only path in.
//
// Call from API routes at the moment of a compliance-relevant action.
// Fire-and-forget: the helper swallows errors so audit logging never
// breaks the user-facing flow. Failures still log to console for ops.
//
// DB triggers on notes and notes_sensitive_access cover those tables
// automatically — don't double-log those events from here.

import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type AuditEventType =
  | "login_success"
  | "login_failure"
  | "logout"
  | "session_expired"
  | "share_create"
  | "share_open"
  | "share_revoke"
  | "family_send"
  | "authorization_create"
  | "authorization_update"
  | "authorization_revoke"
  | "sensitive_access_grant"
  | "sensitive_access_revoke"
  | "permission_change"
  | "export"
  | "failed_access";

export type AuditResult = "success" | "denied" | "error";

export type AuditObjectType =
  | "note"
  | "share_link"
  | "family_contact"
  | "clinician"
  | "resident"
  | "user"
  | "notes_sensitive_access"
  | "authorization";

interface LogAuditParams {
  organizationId: string;
  userId?: string | null;
  eventType: AuditEventType;
  objectType?: AuditObjectType;
  objectId?: string | null;
  result?: AuditResult;
  metadata?: Record<string, unknown>;
  request?: NextRequest | Request;
}

// x-forwarded-for may contain a comma-separated list of hops; the first
// entry is the original client. Most deployments behind Vercel / a CDN
// will populate this header correctly.
function extractIp(request: Request | NextRequest | undefined): string | null {
  if (!request) return null;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

function extractUserAgent(request: Request | NextRequest | undefined): string | null {
  if (!request) return null;
  return request.headers.get("user-agent");
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_events").insert({
      organization_id: params.organizationId,
      user_id: params.userId ?? null,
      event_type: params.eventType,
      object_type: params.objectType ?? null,
      object_id: params.objectId ?? null,
      result: params.result ?? "success",
      ip_address: extractIp(params.request),
      user_agent: extractUserAgent(params.request),
      metadata: (params.metadata ?? {}) as Json,
    });
  } catch (error) {
    // Never block the user-facing flow on audit failure. Surface to ops
    // via server logs; if audit becomes critical for compliance we can
    // tighten this later (e.g., persist failed audits to a retry queue).
    console.error("audit_event insert failed", {
      eventType: params.eventType,
      objectId: params.objectId,
      error: error instanceof Error ? error.message : error,
    });
  }
}
