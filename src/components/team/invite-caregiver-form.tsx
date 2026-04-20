"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const ROLES: Array<{ value: string; label: string; description: string }> = [
  {
    value: "caregiver",
    label: "Caregiver",
    description: "Writes notes, full clinical read for assigned residents",
  },
  {
    value: "nurse_reviewer",
    label: "Nurse reviewer",
    description: "Reads all notes, reviews incidents, creates clinician shares",
  },
  {
    value: "ops_staff",
    label: "Operations",
    description: "Demographics and scheduling — no clinical content",
  },
  {
    value: "billing_staff",
    label: "Billing",
    description: "Demographics and billing — no clinical content",
  },
];

export function InviteCaregiverForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("caregiver");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !fullName) return;
    setLoading(true);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, role, organizationId }),
      });

      if (res.ok) {
        toast.success(`Invitation sent to ${email}`);
        setEmail("");
        setFullName("");
        setRole("caregiver");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send invitation");
      }
    } catch {
      toast.error("Failed to send invitation");
    }

    setLoading(false);
  }

  const selectedRoleDescription = ROLES.find((r) => r.value === role)
    ?.description;

  return (
    <form onSubmit={handleInvite} className="space-y-3">
      <h3 className="text-lg font-medium">Invite Team Member</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="invite-name">Full Name</Label>
          <Input
            id="invite-name"
            placeholder="James Wilson"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="james@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="invite-role">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRoleDescription && (
          <p className="text-xs text-muted-foreground">
            {selectedRoleDescription}
          </p>
        )}
      </div>
      <Button type="submit" disabled={loading} size="sm">
        <UserPlus className="mr-1 h-4 w-4" />
        {loading ? "Sending..." : "Send Invitation"}
      </Button>
    </form>
  );
}
