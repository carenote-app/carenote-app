"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, ShieldCheck, FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_RANGE_DAYS = 7;

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoDateToday(): string {
  return new Date().toISOString().slice(0, 10);
}

type Step = "scope" | "preview" | "sent";

type SensitiveHit = { id: string; sensitive_category: string | null };

export function ShareWithClinicianDialog({
  residentId,
  clinicianId,
  clinicianName,
}: {
  residentId: string;
  clinicianId: string;
  clinicianName: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("scope");
  const [dateRangeStart, setDateRangeStart] = useState(
    isoDateDaysAgo(DEFAULT_RANGE_DAYS)
  );
  const [dateRangeEnd, setDateRangeEnd] = useState(isoDateToday());
  const [loading, setLoading] = useState(false);
  const [sensitiveHits, setSensitiveHits] = useState<SensitiveHit[]>([]);
  const [scanningSensitive, setScanningSensitive] = useState(false);
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [result, setResult] = useState<{
    expiresAt: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);

  function resetAndClose() {
    setOpen(false);
    setStep("scope");
    setResult(null);
    setDateRangeStart(isoDateDaysAgo(DEFAULT_RANGE_DAYS));
    setDateRangeEnd(isoDateToday());
    setSensitiveHits([]);
    setIncludeSensitive(false);
  }

  // When the user enters the preview step, scan for sensitive notes in the
  // chosen scope. Admins can see sensitive rows via RLS; the scan runs
  // client-side against the same data Claude would receive.
  useEffect(() => {
    if (step !== "preview") return;
    let cancelled = false;
    (async () => {
      setScanningSensitive(true);
      const { data } = await supabase
        .from("notes")
        .select("id, sensitive_category")
        .eq("resident_id", residentId)
        .eq("is_structured", true)
        .eq("sensitive_flag", true)
        .gte("created_at", dateRangeStart)
        .lte("created_at", dateRangeEnd + "T23:59:59Z");
      if (cancelled) return;
      setSensitiveHits(
        (data ?? []) as Array<{ id: string; sensitive_category: string | null }>
      );
      setIncludeSensitive(false);
      setScanningSensitive(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [step, residentId, dateRangeStart, dateRangeEnd, supabase]);

  const sensitiveCategories = [...new Set(
    sensitiveHits.map((h) => h.sensitive_category).filter(Boolean) as string[]
  )];

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch("/api/share/clinician", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId,
          clinicianId,
          dateRangeStart,
          dateRangeEnd,
          includeSensitive: sensitiveHits.length > 0 ? includeSensitive : false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to share");
        setLoading(false);
        return;
      }

      setResult({
        expiresAt: data.expires_at,
        emailSent: data.email_sent,
        emailError: data.email_error,
      });
      setStep("sent");
      router.refresh();
    } catch {
      toast.error("Failed to share");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetAndClose();
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Send className="mr-1 h-3 w-3" />
        Share
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "sent" ? "Share sent" : `Share with ${clinicianName}`}
          </DialogTitle>
        </DialogHeader>

        {step === "scope" && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium mb-1 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                HIPAA disclosure — treatment
              </p>
              <p className="text-muted-foreground text-xs">
                This share is logged as a treatment disclosure to a treating
                provider. The clinician receives a secure magic link; the
                summary content never appears in email.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Date range</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  max={dateRangeEnd}
                />
                <Input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  min={dateRangeStart}
                  max={isoDateToday()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only structured notes in this range will be included.
              </p>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={!dateRangeStart || !dateRangeEnd}
              >
                Preview
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
              <p className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                What {clinicianName} will receive
              </p>
              <ul className="text-xs text-muted-foreground list-disc ml-5 space-y-1">
                <li>
                  An email with a secure link (no clinical content in email
                  body)
                </li>
                <li>
                  A portal page showing a clinician-formatted summary of
                  structured notes from {dateRangeStart} to {dateRangeEnd}
                </li>
                <li>
                  Includes: key observations, medication adherence, safety
                  events, cognitive changes, follow-up items flagged by the
                  care team
                </li>
                <li>Link expires after 14 days; every open is logged</li>
              </ul>
            </div>

            {scanningSensitive && (
              <p className="text-xs text-muted-foreground">
                Checking for sensitive content…
              </p>
            )}

            {!scanningSensitive && sensitiveHits.length > 0 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Sensitive content detected
                </p>
                <p className="text-xs">
                  {sensitiveHits.length} note
                  {sensitiveHits.length === 1 ? "" : "s"} in this range
                  {sensitiveHits.length === 1 ? " is" : " are"} flagged
                  sensitive (
                  {sensitiveCategories.length > 0 ? (
                    <span className="inline-flex gap-1 flex-wrap items-baseline">
                      {sensitiveCategories.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="text-[10px] h-4 px-1"
                        >
                          {c.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    "category unknown"
                  )}
                  ). By default these sections are excluded from the share.
                </p>
                <label className="flex items-start gap-2 text-xs pt-1 cursor-pointer">
                  <Checkbox
                    checked={includeSensitive}
                    onCheckedChange={(c) =>
                      setIncludeSensitive(c === true)
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">
                      Include sensitive sections in this share (explicit override)
                    </span>
                    <span className="block text-muted-foreground mt-0.5">
                      Only check this if the disclosure is both clinically
                      necessary and permitted under the applicable rules
                      (e.g. 42 CFR Part 2 re-disclosure requirements). The
                      override is recorded on the disclosure audit row.
                    </span>
                  </span>
                </label>
              </div>
            )}

            <div className="rounded-md bg-muted/30 p-3 text-xs">
              <p className="text-muted-foreground">
                The summary is generated by Claude from the structured notes
                and is a snapshot — if notes change later, this share still
                reflects what was sent today.
              </p>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("scope")}>
                Back
              </Button>
              <Button onClick={handleSend} disabled={loading}>
                {loading ? "Sending..." : "Confirm and send"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "sent" && result && (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-3 text-sm space-y-1">
              <p className="font-medium">
                {result.emailSent
                  ? "Secure link sent"
                  : "Share created (email failed)"}
              </p>
              <p className="text-xs text-muted-foreground">
                Link expires{" "}
                {new Date(result.expiresAt).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
                . Disclosure logged.
              </p>
              {!result.emailSent && result.emailError && (
                <p className="text-xs text-destructive mt-2">
                  Email error: {result.emailError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button onClick={resetAndClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
