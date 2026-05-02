"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailReplyTo, setEmailReplyTo] = useState("");
  const [familyAuthRequired, setFamilyAuthRequired] = useState(false);
  const [retainTranscripts, setRetainTranscripts] = useState(true);
  const [country, setCountry] = useState("");
  const [regulatoryRegion, setRegulatoryRegion] = useState("hipaa_us");
  const [defaultOutputLanguage, setDefaultOutputLanguage] = useState("en");
  const [defaultClinicalLanguage, setDefaultClinicalLanguage] = useState("en");
  const [settingsJson, setSettingsJson] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: appUser } = await supabase
        .from("users")
        .select("organization_id, role")
        .eq("id", user.id)
        .single();

      if (!appUser || (appUser as { role: string }).role !== "admin") {
        router.push("/today");
        return;
      }

      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", (appUser as { organization_id: string }).organization_id)
        .single();

      if (org) {
        const o = org as {
          name: string;
          timezone: string;
          email_from_name: string | null;
          email_reply_to: string | null;
          country: string | null;
          regulatory_region: string;
          default_output_language: string;
          default_clinical_language: string;
          settings: Record<string, unknown> | null;
        };
        setName(o.name);
        setTimezone(o.timezone || "America/Los_Angeles");
        setEmailFromName(o.email_from_name || "");
        setEmailReplyTo(o.email_reply_to || "");
        setCountry(o.country || "");
        setRegulatoryRegion(o.regulatory_region || "hipaa_us");
        setDefaultOutputLanguage(o.default_output_language || "en");
        setDefaultClinicalLanguage(o.default_clinical_language || "en");
        const current = o.settings ?? {};
        setSettingsJson(current);
        setFamilyAuthRequired(current.family_auth_required === true);
        // Default retain_transcripts to true when not explicitly set so
        // legacy behavior is preserved.
        setRetainTranscripts(current.retain_transcripts !== false);
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleSave() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: appUser } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user!.id)
      .single();

    const mergedSettings = {
      ...settingsJson,
      family_auth_required: familyAuthRequired,
      retain_transcripts: retainTranscripts,
    };

    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        timezone,
        email_from_name: emailFromName || null,
        email_reply_to: emailReplyTo || null,
        country: country || null,
        regulatory_region: regulatoryRegion,
        default_output_language: defaultOutputLanguage,
        default_clinical_language: defaultClinicalLanguage,
        settings: mergedSettings,
      })
      .eq("id", (appUser as { organization_id: string }).organization_id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      setSettingsJson(mergedSettings);
      toast.success("Settings saved");
      router.refresh();
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="mb-6 text-xl font-semibold">Settings</h2>

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="facility-name">Facility Name</Label>
          <Input
            id="facility-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
              <SelectItem value="America/Denver">Mountain Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/New_York">Eastern Time</SelectItem>
              <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-from">
            Email From Name
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              (used in family update emails)
            </span>
          </Label>
          <Input
            id="email-from"
            value={emailFromName}
            onChange={(e) => setEmailFromName(e.target.value)}
            placeholder="Sunrise Senior Care"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-reply">Reply-to Email</Label>
          <Input
            id="email-reply"
            type="email"
            value={emailReplyTo}
            onChange={(e) => setEmailReplyTo(e.target.value)}
            placeholder="care@youfacility.com"
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Regulatory & Languages</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drives compliance behavior (HIPAA vs PDPA) and default output language for clinical and family-facing AI generation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United States, Taiwan"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="regulatory-region">Regulatory region</Label>
            <Select value={regulatoryRegion} onValueChange={setRegulatoryRegion}>
              <SelectTrigger id="regulatory-region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hipaa_us">HIPAA (United States)</SelectItem>
                <SelectItem value="pdpa_tw">PDPA (Taiwan)</SelectItem>
                <SelectItem value="gdpr_eu">GDPR (European Union)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Switching to PDPA Taiwan enables phone-OTP login, the cross-border-transfer consent flow, and Long-term Care Services Act note fields.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="default-output-language">Default output language</Label>
              <Select
                value={defaultOutputLanguage}
                onValueChange={setDefaultOutputLanguage}
              >
                <SelectTrigger id="default-output-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh-TW">繁體中文</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-clinical-language">Clinical output language</Label>
              <Select
                value={defaultClinicalLanguage}
                onValueChange={setDefaultClinicalLanguage}
              >
                <SelectTrigger id="default-clinical-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh-TW">繁體中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Compliance</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stricter enforcement of HIPAA-aligned sharing rules.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Switch
              id="family-auth-required"
              checked={familyAuthRequired}
              onCheckedChange={setFamilyAuthRequired}
            />
            <div className="flex-1">
              <Label
                htmlFor="family-auth-required"
                className="text-sm font-medium cursor-pointer"
              >
                Require documented legal basis for family updates
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                When on, family updates can only be sent to contacts with at
                least one legal basis on file (involved in care, personal
                representative, or signed authorization) and a non-expired
                authorization. Off by default to keep legacy flows working
                during migration.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Switch
              id="retain-transcripts"
              checked={retainTranscripts}
              onCheckedChange={setRetainTranscripts}
            />
            <div className="flex-1">
              <Label
                htmlFor="retain-transcripts"
                className="text-sm font-medium cursor-pointer"
              >
                Retain voice call transcripts
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                When off, the Vapi webhook deletes the turn-by-turn
                transcript and nulls the full transcript after the note is
                structured. The raw transcript stays on the note (source of
                truth); the separate voice_transcripts table is cleaned up.
                Existing historical transcripts aren&apos;t touched — this
                only affects new calls. On by default.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
