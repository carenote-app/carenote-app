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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Download, Mail, FileDown } from "lucide-react";
import { toast } from "sonner";

// Trigger button that owns the open state. Mount this directly in a server
// component (resident detail page); the dialog itself is below.
export function ExportReportButton({
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
        <FileDown className="mr-1 h-3 w-3" />
        Export PDF
      </Button>
      <ExportReportDialog
        residentId={residentId}
        residentDisplay={residentDisplay}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

function isoDateToday(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DeliveryMode = "download" | "email";

interface Props {
  residentId: string;
  residentDisplay: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportReportDialog({
  residentId,
  residentDisplay,
  open,
  onOpenChange,
}: Props) {
  const [dateRangeStart, setDateRangeStart] = useState(isoDateDaysAgo(7));
  const [dateRangeEnd, setDateRangeEnd] = useState(isoDateToday());
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("download");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setDateRangeStart(isoDateDaysAgo(7));
    setDateRangeEnd(isoDateToday());
    setDeliveryMode("download");
    setEmail("");
    setMessage("");
  }

  function handleClose() {
    onOpenChange(false);
    // Reset on close so the next open is fresh.
    setTimeout(reset, 200);
  }

  async function handleSubmit() {
    if (!dateRangeStart || !dateRangeEnd) {
      toast.error("Choose a date range.");
      return;
    }
    if (deliveryMode === "email" && !EMAIL_RE.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const startISO = new Date(`${dateRangeStart}T00:00:00`).toISOString();
      const endISO = new Date(`${dateRangeEnd}T23:59:59.999`).toISOString();

      const body = {
        dateRangeStart: startISO,
        dateRangeEnd: endISO,
        delivery:
          deliveryMode === "download"
            ? { mode: "download" }
            : { mode: "email", to: email, message: message || undefined },
      };

      const res = await fetch(`/api/residents/${residentId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(data.error ?? "Could not generate the report.");
        return;
      }

      if (deliveryMode === "download") {
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition") ?? "";
        const filenameMatch = disposition.match(/filename="([^"]+)"/);
        const filename = filenameMatch?.[1] ?? "kinroster-report.pdf";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Report downloaded.");
      } else {
        toast.success(`Report emailed to ${email}.`);
      }

      handleClose();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export PDF report — {residentDisplay}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
            <p className="font-medium flex items-center gap-1.5 text-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Confidential — contains PHI
            </p>
            <p className="text-muted-foreground">
              Sensitive-flagged content (42 CFR Part 2 / psychotherapy) is
              excluded. The export is logged on the audit and disclosure
              ledgers.
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
          </div>

          <div className="space-y-2">
            <Label>Delivery</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMode("download")}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition ${
                  deliveryMode === "download"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Download className="h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">Download</div>
                  <div className="text-xs text-muted-foreground">
                    Save to this device
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode("email")}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition ${
                  deliveryMode === "email"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Mail className="h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">Email to manager</div>
                  <div className="text-xs text-muted-foreground">
                    Send as PDF attachment
                  </div>
                </div>
              </button>
            </div>
          </div>

          {deliveryMode === "email" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="report-email">Recipient email</Label>
                <Input
                  id="report-email"
                  type="email"
                  placeholder="manager@your-facility.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-message">
                  Message <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="report-message"
                  placeholder="Anything you want the recipient to know."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? deliveryMode === "download"
                ? "Generating…"
                : "Sending…"
              : deliveryMode === "download"
              ? "Download PDF"
              : "Send email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
