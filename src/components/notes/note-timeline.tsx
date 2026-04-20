"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { Note } from "@/types/database";
import {
  parseStructuredOutput,
  type FamilyAuthorization,
} from "@/lib/structured-output";
import type {
  DisclosureClass,
  StructuredNoteSection,
} from "@/lib/prompts/shift-note";

type NoteWithRelations = Note & {
  residents: { first_name: string; last_name: string } | null;
  users: { full_name: string } | null;
};

export function NoteTimeline({
  notes,
  hiddenSensitiveCount = 0,
}: {
  notes: NoteWithRelations[];
  hiddenSensitiveCount?: number;
}) {
  return (
    <div className="space-y-3">
      {hiddenSensitiveCount > 0 && (
        <Card className="border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="py-3 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                {hiddenSensitiveCount} sensitive note
                {hiddenSensitiveCount === 1 ? "" : "s"} hidden
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                These notes contain federally protected content (42 CFR Part
                2 or psychotherapy). Contact an admin if you need access for
                care purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {notes.map((note) => {
        const isSensitive = note.sensitive_flag === true;
        return (
          <Card
            key={note.id}
            className={
              note.flagged_as_incident
                ? "border-destructive/50"
                : isSensitive
                ? "border-amber-500/50"
                : ""
            }
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {note.residents?.first_name} {note.residents?.last_name}
                  </span>
                  {note.flagged_as_incident && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  {isSensitive && (
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {note.shift && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {note.shift}
                    </Badge>
                  )}
                  {!note.is_structured && (
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
              <p
                className="text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {note.users?.full_name} &middot;{" "}
                {formatDistanceToNow(new Date(note.created_at), {
                  addSuffix: true,
                })}
              </p>
              {isSensitive && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Sensitive — restricted from routine sharing
                </p>
              )}
            </CardHeader>
            <CardContent>
              {note.is_structured && note.structured_output ? (
                <StructuredNoteDisplay
                  output={note.edited_output || note.structured_output}
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {note.raw_input}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StructuredNoteDisplay({ output }: { output: string }) {
  const parsed = parseStructuredOutput(output);

  if (!parsed) {
    return <p className="text-sm whitespace-pre-wrap">{output}</p>;
  }

  return (
    <div className="space-y-2">
      {parsed.summary && (
        <p className="text-sm font-medium">{parsed.summary}</p>
      )}

      {parsed.sections.map((section, i) => (
        <SectionDisplay key={`${section.name}-${i}`} section={section} />
      ))}

      {parsed.follow_up && parsed.follow_up.toLowerCase() !== "none noted." && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Follow-up
          </p>
          <p className="text-sm">{parsed.follow_up}</p>
        </div>
      )}

      {parsed.flags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {parsed.flags.map((flag, i) => (
            <Badge key={i} variant="destructive" className="text-xs">
              {flag.type}: {flag.reason}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionDisplay({ section }: { section: StructuredNoteSection }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {section.name}
        </p>
        <DisclosureClassBadge value={section.disclosure_class} />
      </div>
      <p className="text-sm mt-0.5">{section.text}</p>
    </div>
  );
}

export const CLASS_LABELS: Record<DisclosureClass, string> = {
  care_team_only: "Care team",
  family_shareable_by_involvement: "Family (involved)",
  family_shareable_by_authorization: "Family (auth)",
  billing_ops_only: "Ops",
  sensitive_restricted: "Sensitive",
};

const CLASS_VARIANTS: Record<
  DisclosureClass,
  "default" | "secondary" | "outline" | "destructive"
> = {
  care_team_only: "outline",
  family_shareable_by_involvement: "secondary",
  family_shareable_by_authorization: "secondary",
  billing_ops_only: "outline",
  sensitive_restricted: "destructive",
};

function DisclosureClassBadge({ value }: { value: DisclosureClass }) {
  return (
    <Badge variant={CLASS_VARIANTS[value]} className="text-[10px] h-4 px-1">
      {CLASS_LABELS[value]}
    </Badge>
  );
}

// Re-export for callers (e.g., tests or other components) that need to
// reuse the same parse behavior the timeline uses.
export type { FamilyAuthorization };
