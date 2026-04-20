"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EVENT_TYPES: Array<{ value: string; label: string }> = [
  { value: "all", label: "All event types" },
  { value: "login_success", label: "Login success" },
  { value: "logout", label: "Logout" },
  { value: "note_create", label: "Note created" },
  { value: "note_update", label: "Note updated" },
  { value: "note_delete", label: "Note deleted" },
  { value: "share_create", label: "Share created" },
  { value: "share_open", label: "Share opened" },
  { value: "share_revoke", label: "Share revoked" },
  { value: "family_send", label: "Family update sent" },
  { value: "sensitive_access_grant", label: "Sensitive access granted" },
  { value: "sensitive_access_revoke", label: "Sensitive access revoked" },
  { value: "failed_access", label: "Failed access" },
];

export function AuditLogFilters({
  users,
  initialEventType,
  initialUserId,
  initialStart,
  initialEnd,
}: {
  users: Array<{ id: string; full_name: string; email: string }>;
  initialEventType: string;
  initialUserId: string;
  initialStart: string;
  initialEnd: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.push(`/audit-log${next.toString() ? "?" + next.toString() : ""}`);
  }

  function clear() {
    router.push("/audit-log");
  }

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-event-type" className="text-xs">
            Event type
          </Label>
          <Select
            value={initialEventType}
            onValueChange={(v) => apply("event_type", v)}
          >
            <SelectTrigger id="filter-event-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-user" className="text-xs">
            User
          </Label>
          <Select
            value={initialUserId}
            onValueChange={(v) => apply("user_id", v)}
          >
            <SelectTrigger id="filter-user">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-start" className="text-xs">
            From
          </Label>
          <Input
            id="filter-start"
            type="date"
            defaultValue={initialStart}
            onBlur={(e) => apply("start", e.currentTarget.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-end" className="text-xs">
            To
          </Label>
          <Input
            id="filter-end"
            type="date"
            defaultValue={initialEnd}
            onBlur={(e) => apply("end", e.currentTarget.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
