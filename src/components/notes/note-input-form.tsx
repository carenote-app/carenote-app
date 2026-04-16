"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Check, Pencil } from "lucide-react";

const MAX_CHARS = 2000;

type FlowStep = "input" | "classifying" | "structuring" | "review" | "incident_prompt";

export function NoteInputForm({
  residentId,
  organizationId,
}: {
  residentId: string;
  organizationId: string;
}) {
  const [rawInput, setRawInput] = useState("");
  const [noteType, setNoteType] = useState<string>("shift_note");
  const [shift, setShift] = useState<string>(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "night";
  });
  const [step, setStep] = useState<FlowStep>("input");
  const [structuredOutput, setStructuredOutput] = useState<string | null>(null);
  const [editedOutput, setEditedOutput] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [incidentPromptOpen, setIncidentPromptOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawInput.trim()) return;

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Step 1: Save raw note
    setStep("classifying");
    const { data: savedNote, error } = await supabase
      .from("notes")
      .insert({
        organization_id: organizationId,
        resident_id: residentId,
        author_id: authUser!.id,
        note_type: noteType as "shift_note" | "incident" | "observation",
        raw_input: rawInput.trim(),
        shift: shift as "morning" | "afternoon" | "night",
      })
      .select()
      .single();

    if (error || !savedNote) {
      toast.error("Failed to save note");
      setStep("input");
      return;
    }

    const noteId = (savedNote as { id: string }).id;
    setSavedNoteId(noteId);

    // Step 2: Classify incident (fast, using Haiku)
    try {
      const classifyRes = await fetch("/api/claude/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: rawInput.trim() }),
      });
      const classifyData = await classifyRes.json();
      setClassification(classifyData.classification);

      if (
        classifyData.classification === "POSSIBLE_INCIDENT" ||
        classifyData.classification === "DEFINITE_INCIDENT"
      ) {
        setIncidentPromptOpen(true);
      }
    } catch {
      // Classification failure is non-blocking
    }

    // Step 3: Structure the note (using Sonnet)
    setStep("structuring");
    try {
      const structureRes = await fetch("/api/claude/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });

      if (structureRes.ok) {
        const { structured } = await structureRes.json();
        setStructuredOutput(JSON.stringify(structured, null, 2));
        setStep("review");
      } else {
        toast.error("AI structuring failed. Your raw note was saved.");
        resetForm();
        router.refresh();
      }
    } catch {
      toast.error("AI structuring failed. Your raw note was saved.");
      resetForm();
      router.refresh();
    }
  }

  async function handleApprove() {
    // Save as-is (already saved by the structure API)
    toast.success("Note saved and structured");
    resetForm();
    router.refresh();
  }

  async function handleEdit() {
    setEditedOutput(structuredOutput);
  }

  async function handleSaveEdited() {
    if (!savedNoteId || !editedOutput) return;

    await supabase
      .from("notes")
      .update({
        is_edited: true,
        edited_output: editedOutput,
      })
      .eq("id", savedNoteId);

    toast.success("Edited note saved");
    resetForm();
    router.refresh();
  }

  async function handleCreateIncidentReport() {
    if (!savedNoteId) return;
    setIncidentPromptOpen(false);

    try {
      const res = await fetch("/api/claude/incident-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: savedNoteId }),
      });

      if (res.ok) {
        toast.success("Incident report created");
      } else {
        toast.error("Failed to generate incident report");
      }
    } catch {
      toast.error("Failed to generate incident report");
    }
  }

  function handleDeclineIncident() {
    setIncidentPromptOpen(false);
    // Note is already saved with flagged_as_incident from the structuring step
  }

  function resetForm() {
    setRawInput("");
    setStep("input");
    setStructuredOutput(null);
    setEditedOutput(null);
    setClassification(null);
    setSavedNoteId(null);
  }

  const isProcessing = step === "classifying" || step === "structuring";

  return (
    <>
      {step === "input" || isProcessing ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Select value={noteType} onValueChange={(v) => v && setNoteType(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Note type">
                  {noteType === "shift_note" ? "Shift Note" : "Observation"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shift_note">Shift Note</SelectItem>
                <SelectItem value="observation">Observation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={shift} onValueChange={(v) => v && setShift(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Shift">
                  {shift === "morning"
                    ? "Morning"
                    : shift === "afternoon"
                    ? "Afternoon"
                    : "Night"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Textarea
              placeholder="Describe what you observed..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value.slice(0, MAX_CHARS))}
              rows={3}
              className="resize-none text-sm"
              disabled={isProcessing}
            />
            <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {rawInput.length}/{MAX_CHARS}
            </span>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isProcessing || !rawInput.trim()}
          >
            {step === "classifying" && (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Checking...
              </>
            )}
            {step === "structuring" && (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Structuring...
              </>
            )}
            {step === "input" && "Save Note"}
          </Button>
        </form>
      ) : step === "review" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Check className="h-4 w-4 text-green-600" />
            AI-Structured Note
            {classification && classification !== "ROUTINE" && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {classification === "DEFINITE_INCIDENT"
                  ? "Incident Detected"
                  : "Possible Incident"}
              </Badge>
            )}
          </div>

          {editedOutput !== null ? (
            <>
              <Textarea
                value={editedOutput}
                onChange={(e) => setEditedOutput(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdited} className="flex-1">
                  Save Edited
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditedOutput(null)}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                <StructuredPreview output={structuredOutput!} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApprove} className="flex-1">
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" onClick={handleEdit}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => { resetForm(); router.refresh(); }}>
                  Discard
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Incident prompt dialog */}
      <Dialog open={incidentPromptOpen} onOpenChange={setIncidentPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Potential Incident Detected
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This note may describe an incident that should be formally
            documented. Would you like to generate an incident report?
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleCreateIncidentReport}
              variant="destructive"
              className="flex-1"
            >
              Create Incident Report
            </Button>
            <Button variant="outline" onClick={handleDeclineIncident}>
              No, it&apos;s routine
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function parsePreviewOutput(output: string) {
  try {
    return JSON.parse(output) as {
      summary?: string;
      sections?: Record<string, string>;
      follow_up?: string;
    };
  } catch {
    return null;
  }
}

function StructuredPreview({ output }: { output: string }) {
  const parsed = parsePreviewOutput(output);

  if (!parsed) {
    return <p>{output}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="font-medium">{parsed.summary}</p>
      {parsed.sections &&
        Object.entries(parsed.sections).map(([section, text]) => (
          <div key={section}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {section}
            </p>
            <p>{text}</p>
          </div>
        ))}
      {parsed.follow_up && (
        <p className="text-muted-foreground italic">{parsed.follow_up}</p>
      )}
    </div>
  );
}
