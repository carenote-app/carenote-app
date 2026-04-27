"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Stethoscope, X } from "lucide-react";
import { toast } from "sonner";
import { ShareWithClinicianDialog } from "@/components/notes/share-with-clinician-dialog";

export type AssignedClinician = {
  assignment_id: string;
  clinician_id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  relationship: string;
  is_primary: boolean;
};

export type DirectoryClinician = {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
};

const RELATIONSHIP_OPTIONS = [
  { value: "primary_care", label: "Primary care" },
  { value: "specialist", label: "Specialist" },
  { value: "hospice", label: "Hospice" },
  { value: "psychiatric", label: "Psychiatric" },
  { value: "other", label: "Other" },
];

export function ResidentClinicianList({
  residentId,
  assigned,
  directory,
  isAdmin,
}: {
  residentId: string;
  assigned: AssignedClinician[];
  directory: DirectoryClinician[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [picked, setPicked] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("primary_care");
  const [saving, setSaving] = useState(false);

  const unassignedDirectory = directory.filter(
    (d) => !assigned.some((a) => a.clinician_id === d.id)
  );

  async function handleAssign() {
    if (!picked) return;
    setSaving(true);
    const { error } = await supabase.from("resident_clinicians").insert({
      resident_id: residentId,
      clinician_id: picked,
      relationship,
      is_primary: assigned.length === 0,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Clinician assigned");
    setPicked("");
    setRelationship("primary_care");
    setAssignOpen(false);
    router.refresh();
  }

  async function handleUnassign(assignmentId: string) {
    const { error } = await supabase
      .from("resident_clinicians")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Clinician unassigned");
    router.refresh();
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Treating Clinicians
        </h4>
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                disabled={unassignedDirectory.length === 0}
              />
            }
          >
            <Plus className="mr-1 h-3 w-3" />
            Assign
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Clinician</DialogTitle>
            </DialogHeader>

            {unassignedDirectory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clinicians available to assign.{" "}
                {isAdmin ? "Add" : "Ask an admin to add"} one in the{" "}
                <a href="/clinicians" className="underline">
                  Clinicians directory
                </a>{" "}
                first.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assign-clinician">Clinician</Label>
                  <Select value={picked} onValueChange={setPicked}>
                    <SelectTrigger id="assign-clinician">
                      <SelectValue placeholder="Select a clinician" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedDirectory.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name}
                          {c.specialty ? ` — ${c.specialty}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assign-relationship">Relationship</Label>
                  <Select
                    value={relationship}
                    onValueChange={setRelationship}
                  >
                    <SelectTrigger id="assign-relationship">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleAssign}
                    disabled={!picked || saving}
                  >
                    {saving ? "Assigning..." : "Assign"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {assigned.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No clinicians assigned yet. Assign a treating physician above.
        </p>
      )}

      <div className="space-y-2">
        {assigned.map((c) => (
          <div
            key={c.assignment_id}
            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Stethoscope className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm font-medium">{c.full_name}</p>
                {c.specialty && (
                  <span className="text-xs text-muted-foreground">
                    {c.specialty}
                  </span>
                )}
                {c.is_primary && (
                  <Badge variant="secondary" className="text-xs">
                    Primary
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {c.relationship.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.email}</p>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <ShareWithClinicianDialog
                  residentId={residentId}
                  clinicianId={c.clinician_id}
                  clinicianName={c.full_name}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnassign(c.assignment_id)}
                aria-label={`Unassign ${c.full_name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
