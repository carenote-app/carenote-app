"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SUMMARY_PRESETS,
  type SummaryPreset,
} from "@/lib/summary/preset-range";

const PRESET_LABELS: Record<SummaryPreset, string> = {
  this_shift: "This shift",
  today: "Today",
  last_24h: "Last 24h",
  this_week: "This week",
};

interface SummaryResponse {
  summary: string;
  noteCount: number;
  excludedSensitiveCount: number;
  rangeLabel: string;
}

export function QuickSummaryButton({
  residentId,
  residentDisplay,
}: {
  residentId: string;
  residentDisplay: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="mr-1 h-3 w-3" />
        Summarise
      </Button>
      <QuickSummaryDialog
        residentId={residentId}
        residentDisplay={residentDisplay}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

interface DialogProps {
  residentId: string;
  residentDisplay: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function QuickSummaryDialog({
  residentId,
  residentDisplay,
  open,
  onOpenChange,
}: DialogProps) {
  const [preset, setPreset] = useState<SummaryPreset>("today");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SummaryResponse | null>(null);

  function reset() {
    setPreset("today");
    setSubmitting(false);
    setResult(null);
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  async function generate() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/residents/${residentId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Could not generate the summary.");
        return;
      }

      const data = (await res.json()) as SummaryResponse;
      setResult(data);
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Summarise — {residentDisplay}</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Time window
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUMMARY_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm transition",
                      preset === p
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {PRESET_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-medium flex items-center gap-1.5 text-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Caregiver readback
              </p>
              <p className="text-muted-foreground">
                AI-summarised from caregiver shift notes for your own scan.
                Sensitive-flagged content is excluded. Not a clinical
                assessment.
              </p>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={generate} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {result.noteCount === 0
                ? "No notes in this period."
                : `${result.noteCount} note${
                    result.noteCount === 1 ? "" : "s"
                  } in ${result.rangeLabel}.`}
            </p>
            <div className="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3 text-sm whitespace-pre-wrap leading-relaxed">
              {result.summary}
            </div>
            {result.excludedSensitiveCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {result.excludedSensitiveCount} sensitive-flagged note
                {result.excludedSensitiveCount === 1 ? "" : "s"} excluded
                from this summary.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              AI-summarised from caregiver shift notes. Not a clinical
              assessment.
            </p>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setResult(null)}
                disabled={submitting}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Try a different range
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
