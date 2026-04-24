"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface IncidentData {
  id: string;
  status: string;
  severity: string;
  manager_notes: string | null;
  family_notified: boolean;
  follow_up_date: string | null;
}

export function IncidentActions({ incident }: { incident: IncidentData }) {
  const [status, setStatus] = useState(incident.status);
  const [severity, setSeverity] = useState(incident.severity);
  const [managerNotes, setManagerNotes] = useState(incident.manager_notes || "");
  const [familyNotified, setFamilyNotified] = useState(incident.family_notified);
  const [followUpDate, setFollowUpDate] = useState(incident.follow_up_date || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updates: Database["public"]["Tables"]["incident_reports"]["Update"] = {
      status,
      severity,
      manager_notes: managerNotes || null,
      family_notified: familyNotified,
      follow_up_date: followUpDate || null,
    };

    // Set reviewed_by and reviewed_at when status changes from open
    if (status !== "open" && incident.status === "open") {
      updates.reviewed_by = user!.id;
      updates.reviewed_at = new Date().toISOString();
    }

    if (familyNotified && !incident.family_notified) {
      updates.family_notified_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("incident_reports")
      .update(updates)
      .eq("id", incident.id);

    if (error) {
      toast.error("Failed to update incident");
    } else {
      toast.success("Incident updated");
      router.refresh();
    }

    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Admin Review</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Severity</Label>
          <Select value={severity} onValueChange={(v) => v && setSeverity(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Manager Notes</Label>
        <Textarea
          value={managerNotes}
          onChange={(e) => setManagerNotes(e.target.value)}
          placeholder="Add your notes about this incident..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="follow-up-date">Follow-up Date</Label>
        <input
          id="follow-up-date"
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="family-notified"
          checked={familyNotified}
          onCheckedChange={(checked) => setFamilyNotified(checked === true)}
        />
        <Label htmlFor="family-notified">Family has been notified</Label>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
