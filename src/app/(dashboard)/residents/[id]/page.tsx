import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Mail } from "lucide-react";
import { NoteTimeline } from "@/components/notes/note-timeline";
import { NoteInputForm } from "@/components/notes/note-input-form";
import { VoiceCallButton } from "@/components/notes/voice-call-button";
import { FamilyContactList } from "@/components/residents/family-contact-list";
import {
  ResidentClinicianList,
  type AssignedClinician,
  type DirectoryClinician,
} from "@/components/clinicians/resident-clinician-list";
import type { Resident, FamilyContact } from "@/types/database";

export default async function ResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data: residentData } = await supabase
    .from("residents")
    .select("*")
    .eq("id", id)
    .eq("organization_id", user.organization_id)
    .single();

  const resident = residentData as Resident | null;
  if (!resident) notFound();

  const { data: notes } = await supabase
    .from("notes")
    .select(
      `
      *,
      residents (first_name, last_name),
      users:author_id (full_name)
    `
    )
    .eq("resident_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Phase 4: count sensitive notes the caller can't see (admins and authors
  // see them directly; everyone else gets a placeholder count).
  const { data: hiddenCountData } = await supabase.rpc(
    "count_hidden_sensitive_notes",
    { p_resident_id: id }
  );
  const hiddenSensitiveCount =
    typeof hiddenCountData === "number" ? hiddenCountData : 0;

  const { data: contactsData } = await supabase
    .from("family_contacts")
    .select("*")
    .eq("resident_id", id)
    .order("is_primary", { ascending: false });

  const familyContacts = (contactsData ?? []) as FamilyContact[];
  const isAdmin = user.role === "admin";

  const { data: assignedData } = await supabase
    .from("resident_clinicians")
    .select(
      "id, clinician_id, relationship, is_primary, clinicians(full_name, email, specialty)"
    )
    .eq("resident_id", id);

  const assignedClinicians: AssignedClinician[] = (
    (assignedData ?? []) as Array<{
      id: string;
      clinician_id: string;
      relationship: string;
      is_primary: boolean;
      clinicians: {
        full_name: string;
        email: string;
        specialty: string | null;
      } | null;
    }>
  )
    .filter((row) => row.clinicians !== null)
    .map((row) => ({
      assignment_id: row.id,
      clinician_id: row.clinician_id,
      full_name: row.clinicians!.full_name,
      email: row.clinicians!.email,
      specialty: row.clinicians!.specialty,
      relationship: row.relationship,
      is_primary: row.is_primary,
    }));

  const { data: directoryData } = await supabase
    .from("clinicians")
    .select("id, full_name, email, specialty")
    .eq("organization_id", user.organization_id)
    .eq("is_active", true)
    .order("full_name");

  const clinicianDirectory = (directoryData ?? []) as DirectoryClinician[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      {/* Resident header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {resident.first_name} {resident.last_name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {resident.room_number && (
              <span className="text-sm text-muted-foreground">
                Room {resident.room_number}
              </span>
            )}
            <Badge variant="secondary" className="capitalize">
              {resident.status}
            </Badge>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1.5">
            <Link href={`/family/${id}/new`}>
              <Button variant="outline" size="sm">
                <Mail className="mr-1 h-3 w-3" />
                Family Update
              </Button>
            </Link>
            <Link href={`/residents/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Conditions & Preferences */}
      {(resident.conditions || resident.preferences) && (
        <div className="mb-4 rounded-xl border bg-card p-3 text-sm space-y-1">
          {resident.conditions && (
            <p>
              <span className="font-medium">Conditions:</span>{" "}
              {resident.conditions}
            </p>
          )}
          {resident.preferences && (
            <p>
              <span className="font-medium">Preferences:</span>{" "}
              {resident.preferences}
            </p>
          )}
        </div>
      )}

      {/* Family contacts */}
      <FamilyContactList
        contacts={familyContacts}
        residentId={id}
        isAdmin={isAdmin}
      />

      {/* Treating clinicians */}
      <ResidentClinicianList
        residentId={id}
        assigned={assignedClinicians}
        directory={clinicianDirectory}
        isAdmin={isAdmin}
      />

      {/* Note input */}
      <div className="mt-6 mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-medium">Add Note</h3>
          <VoiceCallButton residentId={id} />
        </div>
        <NoteInputForm
          residentId={id}
          organizationId={user.organization_id}
        />
      </div>

      <Separator />

      {/* Note timeline */}
      <div className="mt-5">
        <h3 className="mb-3 text-base font-medium">Notes</h3>
        {(!notes || notes.length === 0) && hiddenSensitiveCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notes for this resident yet.
          </p>
        ) : (
          <NoteTimeline
            notes={(notes ?? []) as Parameters<typeof NoteTimeline>[0]["notes"]}
            hiddenSensitiveCount={hiddenSensitiveCount}
          />
        )}
      </div>
    </div>
  );
}
