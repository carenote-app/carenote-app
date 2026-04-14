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
import { FamilyContactList } from "@/components/residents/family-contact-list";
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

  const { data: contactsData } = await supabase
    .from("family_contacts")
    .select("*")
    .eq("resident_id", id)
    .order("is_primary", { ascending: false });

  const familyContacts = (contactsData ?? []) as FamilyContact[];
  const isAdmin = user.role === "admin";

  return (
    <div className="px-4 py-6">
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
          <div className="flex gap-2">
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
        <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm space-y-1">
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
      <div className="mb-4">
        <FamilyContactList
          contacts={familyContacts}
          residentId={id}
          isAdmin={isAdmin}
        />
      </div>

      <Separator className="my-6" />

      {/* Note input */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-medium">Add Note</h3>
        <NoteInputForm
          residentId={id}
          organizationId={user.organization_id}
        />
      </div>

      <Separator className="my-6" />

      {/* Note timeline */}
      <div>
        <h3 className="mb-3 text-lg font-medium">Notes</h3>
        {!notes || notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notes for this resident yet.
          </p>
        ) : (
          <NoteTimeline notes={notes as Parameters<typeof NoteTimeline>[0]["notes"]} />
        )}
      </div>
    </div>
  );
}
