"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SCOPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "visit_notifications", label: "Visit completion notifications" },
  { value: "appointment_logistics", label: "Appointment logistics" },
  {
    value: "medication_adherence_summary",
    label: "Medication adherence summary",
  },
  { value: "safety_alerts", label: "Safety alerts" },
  { value: "wellbeing_summary", label: "High-level wellbeing summary" },
  { value: "task_completion", label: "Care plan task completion" },
  { value: "incident_notifications", label: "Incident notifications" },
];

const CHANNEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone call" },
];

export type FamilyContactFormValues = {
  name: string;
  relationship: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  involvedInCare: boolean;
  personalRepresentative: boolean;
  authorizationOnFile: boolean;
  authorizationScope: string[];
  communicationChannels: string[];
  authorizationStartDate: string;
  authorizationEndDate: string;
  confidentialCommunicationNotes: string;
  preferredCommunicationLanguage: string;
  countryOfResidence: string;
};

export const EMPTY_FAMILY_CONTACT_VALUES: FamilyContactFormValues = {
  name: "",
  relationship: "",
  email: "",
  phone: "",
  isPrimary: false,
  involvedInCare: false,
  personalRepresentative: false,
  authorizationOnFile: false,
  authorizationScope: [],
  communicationChannels: ["email"],
  authorizationStartDate: "",
  authorizationEndDate: "",
  confidentialCommunicationNotes: "",
  preferredCommunicationLanguage: "",
  countryOfResidence: "",
};

export function FamilyContactForm({
  initialValues,
  submitLabel = "Add Contact",
  onSubmit,
}: {
  initialValues?: FamilyContactFormValues;
  submitLabel?: string;
  onSubmit: (values: FamilyContactFormValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<FamilyContactFormValues>(
    initialValues ?? EMPTY_FAMILY_CONTACT_VALUES
  );
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FamilyContactFormValues>(
    key: K,
    value: FamilyContactFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleInArray(key: "authorizationScope" | "communicationChannels", value: string) {
    setValues((v) => {
      const current = v[key];
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      return { ...v, [key]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  }

  const hasLegalBasis =
    values.involvedInCare ||
    values.personalRepresentative ||
    values.authorizationOnFile;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          required
          placeholder="Sarah Chen"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="contact-relationship">Relationship</Label>
          <Input
            id="contact-relationship"
            required
            placeholder="Daughter"
            value={values.relationship}
            onChange={(e) => update("relationship", e.target.value)}
          />
        </div>
        <div className="space-y-2 flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.isPrimary}
              onCheckedChange={(c) => update("isPrimary", c === true)}
            />
            Primary contact
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="sarah@example.com"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Legal basis for sharing (select at least one)
        </Label>
        <p className="text-xs text-muted-foreground">
          HIPAA requires a documented basis for every family disclosure. This
          contact will only receive updates where at least one basis applies.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={values.involvedInCare}
            onCheckedChange={(c) => update("involvedInCare", c === true)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Involved in care</span>
            <span className="block text-xs text-muted-foreground">
              Patient identified this person as involved in their care, or did
              not object when given the opportunity.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={values.personalRepresentative}
            onCheckedChange={(c) => update("personalRepresentative", c === true)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Personal representative</span>
            <span className="block text-xs text-muted-foreground">
              Legal authority (POA, conservator, parent of a minor). Verify
              documentation before checking.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={values.authorizationOnFile}
            onCheckedChange={(c) => update("authorizationOnFile", c === true)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Signed HIPAA authorization on file</span>
            <span className="block text-xs text-muted-foreground">
              Patient signed a written authorization permitting this contact to
              receive protected health information.
            </span>
          </span>
        </label>
      </div>

      {values.authorizationOnFile && (
        <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-muted">
          <div className="space-y-2">
            <Label htmlFor="contact-auth-start">Authorization start</Label>
            <Input
              id="contact-auth-start"
              type="date"
              value={values.authorizationStartDate}
              onChange={(e) =>
                update("authorizationStartDate", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-auth-end">Authorization end</Label>
            <Input
              id="contact-auth-end"
              type="date"
              value={values.authorizationEndDate}
              onChange={(e) => update("authorizationEndDate", e.target.value)}
            />
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Approved scope</Label>
        <p className="text-xs text-muted-foreground">
          Categories this contact may receive. Leave empty to send general
          updates only during the legacy window; Phase 3 will enforce
          content-level filtering.
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {SCOPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.authorizationScope.includes(opt.value)}
                onCheckedChange={() =>
                  toggleInArray("authorizationScope", opt.value)
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Communication channels</Label>
        <div className="flex gap-4">
          {CHANNEL_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.communicationChannels.includes(opt.value)}
                onCheckedChange={() =>
                  toggleInArray("communicationChannels", opt.value)
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="contact-language">Preferred language</Label>
          <Select
            value={values.preferredCommunicationLanguage || "none"}
            onValueChange={(v) =>
              update("preferredCommunicationLanguage", v === "none" ? "" : v)
            }
          >
            <SelectTrigger id="contact-language">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh-TW">繁體中文</SelectItem>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Family update emails to this contact will be generated in this language.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-country">Country of residence</Label>
          <Input
            id="contact-country"
            placeholder="e.g. Taiwan, Vietnam"
            value={values.countryOfResidence}
            onChange={(e) => update("countryOfResidence", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-notes">Special instructions</Label>
        <Textarea
          id="contact-notes"
          rows={2}
          placeholder="e.g. only contact by email, do not call before 9am"
          value={values.confidentialCommunicationNotes}
          onChange={(e) =>
            update("confidentialCommunicationNotes", e.target.value)
          }
        />
      </div>

      {!hasLegalBasis && (
        <p className="text-xs text-destructive">
          At least one legal basis must be selected before this contact can
          receive updates.
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
