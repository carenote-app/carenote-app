"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

type Grant = {
  id: string;
  user_id: string;
  resident_id: string;
  granted_by: string;
  granted_at: string;
  expires_at: string | null;
  reason: string;
  user_display: string;
  resident_display: string;
  granted_by_display: string;
};

type UserOption = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type ResidentOption = {
  id: string;
  first_name: string;
  last_name: string;
  room_number: string | null;
};

function isExpired(grant: Grant): boolean {
  if (!grant.expires_at) return false;
  return new Date(grant.expires_at) < new Date();
}

export function SensitiveAccessList({
  grants,
  users,
  residents,
}: {
  grants: Grant[];
  users: UserOption[];
  residents: ResidentOption[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [addOpen, setAddOpen] = useState(false);

  async function handleRevoke(id: string) {
    const { error } = await supabase
      .from("notes_sensitive_access")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Access revoked");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button size="sm" disabled={users.length === 0 || residents.length === 0} />
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Grant Access
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant sensitive access</DialogTitle>
            </DialogHeader>
            <GrantForm
              users={users}
              residents={residents}
              onSuccess={() => {
                setAddOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {grants.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No active grants. Admins and note authors already have access to
          sensitive content by default.
        </p>
      )}

      <div className="space-y-3">
        {grants.map((g) => (
          <Card key={g.id} className={isExpired(g) ? "opacity-60" : ""}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium">{g.user_display}</p>
                    <span className="text-xs text-muted-foreground">
                      can view sensitive notes for
                    </span>
                    <p className="text-sm font-medium">{g.resident_display}</p>
                    {isExpired(g) && (
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Granted by {g.granted_by_display} on{" "}
                    {new Date(g.granted_at).toLocaleDateString()}
                    {g.expires_at
                      ? ` · expires ${new Date(g.expires_at).toLocaleDateString()}`
                      : " · no expiration"}
                  </p>
                  <p className="text-xs mt-1.5">
                    <span className="text-muted-foreground">Reason:</span>{" "}
                    {g.reason}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(g.id)}
                  aria-label="Revoke grant"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GrantForm({
  users,
  residents,
  onSuccess,
}: {
  users: UserOption[];
  residents: ResidentOption[];
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [userId, setUserId] = useState("");
  const [residentId, setResidentId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId || !residentId || reason.trim().length === 0) {
      toast.error("User, resident, and reason are required");
      return;
    }

    setSaving(true);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      toast.error("Not authenticated");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("notes_sensitive_access").insert({
      user_id: userId,
      resident_id: residentId,
      granted_by: authUser.id,
      reason: reason.trim(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });

    setSaving(false);

    if (error) {
      toast.error(
        error.code === "23505"
          ? "This user already has access to this resident"
          : error.message
      );
      return;
    }

    toast.success("Access granted");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="grant-user">User</Label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger id="grant-user">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.full_name} — {u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grant-resident">Resident</Label>
        <Select value={residentId} onValueChange={setResidentId}>
          <SelectTrigger id="grant-resident">
            <SelectValue placeholder="Select a resident" />
          </SelectTrigger>
          <SelectContent>
            {residents.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.first_name} {r.last_name}
                {r.room_number ? ` (Rm ${r.room_number})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grant-expires">Expires (optional)</Label>
        <Input
          id="grant-expires"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty for indefinite access. Admins can revoke at any time.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grant-reason">Reason</Label>
        <Textarea
          id="grant-reason"
          rows={3}
          placeholder="e.g. assigned clinical oversight for this resident's substance-use treatment"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? "Granting..." : "Grant access"}
        </Button>
      </DialogFooter>
    </form>
  );
}
