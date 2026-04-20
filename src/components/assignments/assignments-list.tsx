"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, X, ClipboardList } from "lucide-react";
import { toast } from "sonner";

type Assignment = {
  id: string;
  caregiver_id: string;
  resident_id: string;
  start_date: string;
  end_date: string | null;
  caregiver_display: string;
  resident_display: string;
};

type Caregiver = { id: string; full_name: string; email: string; role: string };
type Resident = {
  id: string;
  first_name: string;
  last_name: string;
  room_number: string | null;
};

function isActive(a: Assignment): boolean {
  if (!a.end_date) return true;
  return new Date(a.end_date) >= new Date();
}

export function AssignmentsList({
  assignments,
  caregivers,
  residents,
}: {
  assignments: Assignment[];
  caregivers: Caregiver[];
  residents: Resident[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [addOpen, setAddOpen] = useState(false);

  async function handleEnd(id: string) {
    const { error } = await supabase
      .from("caregiver_assignments")
      .update({ end_date: new Date().toISOString().slice(0, 10) })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Assignment ended");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button
                size="sm"
                disabled={caregivers.length === 0 || residents.length === 0}
              />
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            New assignment
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign caregiver</DialogTitle>
            </DialogHeader>
            <AssignmentForm
              caregivers={caregivers}
              residents={residents}
              onSuccess={() => {
                setAddOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No assignments yet. Assignments are optional today — populate them
          now to prepare for future enforcement.
        </p>
      )}

      <div className="space-y-3">
        {assignments.map((a) => (
          <Card key={a.id} className={isActive(a) ? "" : "opacity-60"}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{a.caregiver_display}</p>
                    <span className="text-xs text-muted-foreground">
                      assigned to
                    </span>
                    <p className="text-sm font-medium">{a.resident_display}</p>
                    {!isActive(a) && (
                      <Badge variant="outline" className="text-xs">
                        Ended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.start_date}
                    {a.end_date ? ` → ${a.end_date}` : " → ongoing"}
                  </p>
                </div>
                {isActive(a) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEnd(a.id)}
                    aria-label="End assignment"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AssignmentForm({
  caregivers,
  residents,
  onSuccess,
}: {
  caregivers: Caregiver[];
  residents: Resident[];
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [caregiverId, setCaregiverId] = useState("");
  const [residentId, setResidentId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!caregiverId || !residentId) {
      toast.error("Caregiver and resident required");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("caregiver_assignments").insert({
      caregiver_id: caregiverId,
      resident_id: residentId,
      start_date: startDate,
      created_by: user.id,
    });
    setSaving(false);

    if (error) {
      toast.error(
        error.code === "23505"
          ? "This caregiver is already assigned to this resident"
          : error.message
      );
      return;
    }

    toast.success("Assignment created");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="asn-caregiver">Caregiver</Label>
        <Select value={caregiverId} onValueChange={setCaregiverId}>
          <SelectTrigger id="asn-caregiver">
            <SelectValue placeholder="Select a caregiver" />
          </SelectTrigger>
          <SelectContent>
            {caregivers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.full_name} — {c.role === "nurse_reviewer" ? "Nurse" : "Caregiver"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="asn-resident">Resident</Label>
        <Select value={residentId} onValueChange={setResidentId}>
          <SelectTrigger id="asn-resident">
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
        <Label htmlFor="asn-start">Start date</Label>
        <Input
          id="asn-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
