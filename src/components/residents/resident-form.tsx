"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import type { Resident } from "@/types/database";

function parseCommaSeparated(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function ResidentForm({ resident }: { resident?: Resident }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const isEditing = !!resident;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Get current user's organization
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const { data: appUser } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", authUser!.id)
      .single();

    const yearsInTaiwanRaw = formData.get("years_in_taiwan") as string;
    const data = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      date_of_birth: (formData.get("date_of_birth") as string) || null,
      move_in_date: (formData.get("move_in_date") as string) || null,
      room_number: (formData.get("room_number") as string) || null,
      conditions: (formData.get("conditions") as string) || null,
      preferences: (formData.get("preferences") as string) || null,
      care_notes_context: (formData.get("care_notes_context") as string) || null,
      preferred_language: (formData.get("preferred_language") as string) || null,
      country_of_origin: (formData.get("country_of_origin") as string) || null,
      years_in_taiwan: yearsInTaiwanRaw ? parseInt(yearsInTaiwanRaw, 10) : null,
      religion: (formData.get("religion") as string) || null,
      dietary_restrictions: parseCommaSeparated(formData.get("dietary_restrictions")),
      family_name: (formData.get("family_name") as string) || null,
      given_name: (formData.get("given_name") as string) || null,
      name_pronunciation: (formData.get("name_pronunciation") as string) || null,
      honorific_preference: (formData.get("honorific_preference") as string) || null,
      lunar_calendar_dob: (formData.get("lunar_calendar_dob") as string) || null,
      cultural_taboos: parseCommaSeparated(formData.get("cultural_taboos")),
    };

    if (isEditing) {
      const { error } = await supabase
        .from("residents")
        .update(data)
        .eq("id", resident.id);

      if (error) {
        toast.error("Failed to update resident");
        setLoading(false);
        return;
      }
      toast.success("Resident updated");
      router.push(`/residents/${resident.id}`);
    } else {
      const { error } = await supabase.from("residents").insert({
        ...data,
        organization_id: appUser!.organization_id,
      });

      if (error) {
        toast.error("Failed to add resident");
        setLoading(false);
        return;
      }
      toast.success("Resident added");
      router.push("/residents");
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            defaultValue={resident?.first_name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            defaultValue={resident?.last_name}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={resident?.date_of_birth ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="move_in_date">Move-in Date</Label>
          <Input
            id="move_in_date"
            name="move_in_date"
            type="date"
            defaultValue={resident?.move_in_date ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="room_number">Room Number</Label>
        <Input
          id="room_number"
          name="room_number"
          placeholder="e.g., 3A"
          defaultValue={resident?.room_number ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="conditions">Conditions</Label>
        <Textarea
          id="conditions"
          name="conditions"
          placeholder="e.g., dementia, diabetes, limited mobility"
          defaultValue={resident?.conditions ?? ""}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferences">Preferences</Label>
        <Textarea
          id="preferences"
          name="preferences"
          placeholder="e.g., likes morning walks, prefers tea"
          defaultValue={resident?.preferences ?? ""}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="care_notes_context">
          Care Notes Context
          <span className="ml-1 text-xs text-muted-foreground font-normal">
            (sent to AI with every note for personalized output)
          </span>
        </Label>
        <Textarea
          id="care_notes_context"
          name="care_notes_context"
          placeholder="e.g., Dorothy responds well to outdoor activities. Her daughter Sarah calls daily around 11 AM."
          defaultValue={resident?.care_notes_context ?? ""}
          rows={3}
        />
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Cultural & Language</h3>
          <p className="text-xs text-muted-foreground">
            Used by AI to address the resident correctly and adapt clinical and family communication. All optional.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="family_name">
              Family name
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                (e.g. 陳, Nguyễn)
              </span>
            </Label>
            <Input
              id="family_name"
              name="family_name"
              defaultValue={resident?.family_name ?? ""}
              placeholder="Family/surname"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="given_name">
              Given name
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                (Indonesian residents may use a single legal name as both)
              </span>
            </Label>
            <Input
              id="given_name"
              name="given_name"
              defaultValue={resident?.given_name ?? ""}
              placeholder="Given name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="honorific_preference">Honorific</Label>
            <Input
              id="honorific_preference"
              name="honorific_preference"
              defaultValue={resident?.honorific_preference ?? ""}
              placeholder="e.g. 阿嬤, Bác, Ibu, Mr."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name_pronunciation">Name pronunciation</Label>
            <Input
              id="name_pronunciation"
              name="name_pronunciation"
              defaultValue={resident?.name_pronunciation ?? ""}
              placeholder="Free text or IPA"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preferred_language">Preferred language</Label>
            <Select
              name="preferred_language"
              defaultValue={resident?.preferred_language ?? "none"}
            >
              <SelectTrigger id="preferred_language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh-TW">繁體中文 (Traditional Chinese)</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="tl">Tagalog</SelectItem>
                <SelectItem value="th">ไทย (Thai)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country_of_origin">Country of origin</Label>
            <Input
              id="country_of_origin"
              name="country_of_origin"
              defaultValue={resident?.country_of_origin ?? ""}
              placeholder="e.g. Taiwan, Vietnam, Indonesia"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="years_in_taiwan">Years in Taiwan</Label>
            <Input
              id="years_in_taiwan"
              name="years_in_taiwan"
              type="number"
              min={0}
              defaultValue={resident?.years_in_taiwan ?? ""}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lunar_calendar_dob">
              Lunar calendar DOB
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="lunar_calendar_dob"
              name="lunar_calendar_dob"
              type="date"
              defaultValue={resident?.lunar_calendar_dob ?? ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="religion">Religion</Label>
          <Input
            id="religion"
            name="religion"
            defaultValue={resident?.religion ?? ""}
            placeholder="e.g. Buddhist, Catholic, Muslim, Cao Đài"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dietary_restrictions">
            Dietary restrictions
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              (comma-separated)
            </span>
          </Label>
          <Input
            id="dietary_restrictions"
            name="dietary_restrictions"
            defaultValue={(resident?.dietary_restrictions ?? []).join(", ")}
            placeholder="e.g. vegetarian on lunar 1/15, halal, no pork"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cultural_taboos">
            Cultural taboos / sensitivities
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              (comma-separated; surfaces in AI prompts)
            </span>
          </Label>
          <Textarea
            id="cultural_taboos"
            name="cultural_taboos"
            defaultValue={(resident?.cultural_taboos ?? []).join(", ")}
            placeholder="e.g. avoid death-adjacent phrasing, no Ghost Month references"
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? isEditing
              ? "Updating..."
              : "Adding..."
            : isEditing
            ? "Update Resident"
            : "Add Resident"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
