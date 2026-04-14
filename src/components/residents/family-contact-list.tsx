"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import type { FamilyContact } from "@/types/database";

export function FamilyContactList({
  contacts,
  residentId,
  isAdmin,
}: {
  contacts: FamilyContact[];
  residentId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Family Contacts
        </h4>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Plus className="mr-1 h-3 w-3" />
              Add
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Family Contact</DialogTitle>
              </DialogHeader>
              <AddContactForm
                residentId={residentId}
                onSuccess={() => setOpen(false)}
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
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">
                {contact.name}{" "}
                <span className="text-muted-foreground font-normal">
                  ({contact.relationship})
                </span>
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
            </div>
            <div className="flex gap-1">
              {contact.is_primary && (
                <Badge variant="secondary" className="text-xs">
                  Primary
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddContactForm({
  residentId,
  onSuccess,
}: {
  residentId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const { error } = await supabase.from("family_contacts").insert({
      resident_id: residentId,
      name: formData.get("name") as string,
      relationship: formData.get("relationship") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      is_primary: false,
    });

    if (error) {
      toast.error("Failed to add contact");
      setLoading(false);
      return;
    }

    toast.success("Contact added");
    setLoading(false);
    router.refresh();
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" name="name" required placeholder="Sarah Chen" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-relationship">Relationship</Label>
        <Input
          id="contact-relationship"
          name="relationship"
          required
          placeholder="Daughter"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          placeholder="sarah@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-phone">Phone</Label>
        <Input
          id="contact-phone"
          name="phone"
          type="tel"
          placeholder="(555) 123-4567"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adding..." : "Add Contact"}
      </Button>
    </form>
  );
}
