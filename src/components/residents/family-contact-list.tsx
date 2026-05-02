"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Mail, Phone, Pencil, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import type { FamilyContact } from "@/types/database";
import {
  FamilyContactForm,
  EMPTY_FAMILY_CONTACT_VALUES,
  type FamilyContactFormValues,
} from "./family-contact-form";

type AuthState =
  | { kind: "revoked"; reason: string | null }
  | { kind: "expired"; endDate: string }
  | { kind: "authorized" }
  | { kind: "representative" }
  | { kind: "involved" }
  | { kind: "none" };

function classifyAuth(contact: FamilyContact): AuthState {
  if (contact.revoked_at) {
    return { kind: "revoked", reason: contact.revocation_reason };
  }
  if (
    contact.authorization_end_date &&
    new Date(contact.authorization_end_date) < new Date()
  ) {
    return { kind: "expired", endDate: contact.authorization_end_date };
  }
  if (contact.authorization_on_file) return { kind: "authorized" };
  if (contact.personal_representative) return { kind: "representative" };
  if (contact.involved_in_care) return { kind: "involved" };
  return { kind: "none" };
}

function formValuesFromContact(contact: FamilyContact): FamilyContactFormValues {
  return {
    name: contact.name,
    relationship: contact.relationship,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    isPrimary: contact.is_primary,
    involvedInCare: contact.involved_in_care,
    personalRepresentative: contact.personal_representative,
    authorizationOnFile: contact.authorization_on_file,
    authorizationScope: contact.authorization_scope ?? [],
    communicationChannels:
      contact.communication_channels && contact.communication_channels.length > 0
        ? contact.communication_channels
        : ["email"],
    authorizationStartDate: contact.authorization_start_date ?? "",
    authorizationEndDate: contact.authorization_end_date ?? "",
    confidentialCommunicationNotes:
      contact.confidential_communication_notes ?? "",
    preferredCommunicationLanguage:
      contact.preferred_communication_language ?? "",
    countryOfResidence: contact.country_of_residence ?? "",
  };
}

function insertPayloadFromValues(
  values: FamilyContactFormValues,
  residentId: string
) {
  return {
    resident_id: residentId,
    name: values.name,
    relationship: values.relationship,
    email: values.email || null,
    phone: values.phone || null,
    is_primary: values.isPrimary,
    involved_in_care: values.involvedInCare,
    personal_representative: values.personalRepresentative,
    authorization_on_file: values.authorizationOnFile,
    authorization_scope: values.authorizationScope,
    communication_channels: values.communicationChannels,
    authorization_start_date: values.authorizationStartDate || null,
    authorization_end_date: values.authorizationEndDate || null,
    confidential_communication_notes:
      values.confidentialCommunicationNotes || null,
    preferred_communication_language:
      values.preferredCommunicationLanguage || null,
    country_of_residence: values.countryOfResidence || null,
  };
}

function updatePayloadFromValues(values: FamilyContactFormValues) {
  return {
    name: values.name,
    relationship: values.relationship,
    email: values.email || null,
    phone: values.phone || null,
    is_primary: values.isPrimary,
    involved_in_care: values.involvedInCare,
    personal_representative: values.personalRepresentative,
    authorization_on_file: values.authorizationOnFile,
    authorization_scope: values.authorizationScope,
    communication_channels: values.communicationChannels,
    authorization_start_date: values.authorizationStartDate || null,
    authorization_end_date: values.authorizationEndDate || null,
    confidential_communication_notes:
      values.confidentialCommunicationNotes || null,
    preferred_communication_language:
      values.preferredCommunicationLanguage || null,
    country_of_residence: values.countryOfResidence || null,
  };
}

export function FamilyContactList({
  contacts,
  residentId,
  isAdmin,
}: {
  contacts: FamilyContact[];
  residentId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyContact | null>(null);
  const [revoking, setRevoking] = useState<FamilyContact | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeSaving, setRevokeSaving] = useState(false);

  async function handleAdd(values: FamilyContactFormValues) {
    const { error } = await supabase
      .from("family_contacts")
      .insert(insertPayloadFromValues(values, residentId));

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Contact added");
    setAddOpen(false);
    router.refresh();
  }

  async function handleUpdate(id: string, values: FamilyContactFormValues) {
    const { error } = await supabase
      .from("family_contacts")
      .update(updatePayloadFromValues(values))
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Contact updated");
    setEditing(null);
    router.refresh();
  }

  async function handleRevoke() {
    if (!revoking) return;
    const reason = revokeReason.trim();
    if (!reason) {
      toast.error("A revocation reason is required");
      return;
    }

    setRevokeSaving(true);
    const { error } = await supabase
      .from("family_contacts")
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq("id", revoking.id);
    setRevokeSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Sharing revoked");
    setRevoking(null);
    setRevokeReason("");
    router.refresh();
  }

  async function handleUnrevoke(id: string) {
    const { error } = await supabase
      .from("family_contacts")
      .update({ revoked_at: null, revocation_reason: null })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Sharing restored");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Family Contacts
        </h4>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Plus className="mr-1 h-3 w-3" />
              Add
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Family Contact</DialogTitle>
              </DialogHeader>
              <FamilyContactForm
                initialValues={EMPTY_FAMILY_CONTACT_VALUES}
                onSubmit={handleAdd}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {contacts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No family contacts yet.{isAdmin ? " Add one above." : ""}
        </p>
      )}

      <div className="space-y-2">
        {contacts.map((contact) => {
          const auth = classifyAuth(contact);
          const isRevoked = auth.kind === "revoked";

          return (
            <div
              key={contact.id}
              className={`rounded-md bg-muted/50 px-3 py-2 ${
                isRevoked ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {contact.name}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({contact.relationship})
                    </span>
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {contact.is_primary && (
                      <Badge variant="secondary" className="text-xs">
                        Primary
                      </Badge>
                    )}
                    <AuthBadge state={auth} />
                    {contact.authorization_scope.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {contact.authorization_scope.length} categor
                        {contact.authorization_scope.length === 1 ? "y" : "ies"}
                      </Badge>
                    )}
                  </div>
                  {isRevoked && auth.reason && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Revoked: {auth.reason}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(contact)}
                      aria-label={`Edit ${contact.name}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {isRevoked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnrevoke(contact.id)}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRevoking(contact);
                          setRevokeReason("");
                        }}
                        aria-label={`Revoke sharing with ${contact.name}`}
                      >
                        <ShieldOff className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Family Contact</DialogTitle>
          </DialogHeader>
          {editing && (
            <FamilyContactForm
              initialValues={formValuesFromContact(editing)}
              submitLabel="Save"
              onSubmit={(values) => handleUpdate(editing.id, values)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={revoking !== null}
        onOpenChange={(o) => {
          if (!o) {
            setRevoking(null);
            setRevokeReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke sharing with {revoking?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This contact will immediately stop receiving family updates. The
              reason is stored on the record for compliance purposes.
            </p>
            <textarea
              className="w-full rounded-md border bg-background p-2 text-sm min-h-[80px]"
              placeholder="e.g. patient withdrew agreement, relationship ended"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setRevoking(null);
                  setRevokeReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={revokeSaving || revokeReason.trim().length === 0}
              >
                {revokeSaving ? "Revoking..." : "Revoke"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuthBadge({ state }: { state: AuthState }) {
  switch (state.kind) {
    case "revoked":
      return (
        <Badge variant="destructive" className="text-xs">
          Revoked
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="destructive" className="text-xs">
          Expired
        </Badge>
      );
    case "authorized":
      return (
        <Badge variant="secondary" className="text-xs">
          Authorization signed
        </Badge>
      );
    case "representative":
      return (
        <Badge variant="secondary" className="text-xs">
          Personal rep
        </Badge>
      );
    case "involved":
      return (
        <Badge variant="outline" className="text-xs">
          Involved in care
        </Badge>
      );
    case "none":
      return (
        <Badge variant="destructive" className="text-xs">
          No legal basis
        </Badge>
      );
  }
}
