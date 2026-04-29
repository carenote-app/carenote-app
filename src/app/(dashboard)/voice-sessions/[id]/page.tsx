import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Mic, FileText, User, Bot } from "lucide-react";
import {
  AIDisclosure,
  AI_DISCLOSURE_TRANSCRIPT,
} from "@/components/transparency/ai-disclosure";
import { format } from "date-fns";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default async function VoiceSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data: sessionData } = await supabase
    .from("voice_sessions")
    .select(
      `
      *,
      residents (first_name, last_name),
      users:caregiver_id (full_name),
      notes:note_id (id, is_structured, structured_output, flagged_as_incident, raw_input)
    `
    )
    .eq("id", id)
    .single();

  if (!sessionData) notFound();

  const session = sessionData as {
    id: string;
    organization_id: string;
    status: string;
    call_type: string;
    duration_seconds: number | null;
    created_at: string;
    started_at: string | null;
    ended_at: string | null;
    full_transcript: string | null;
    vapi_call_id: string | null;
    note_id: string | null;
    residents: { first_name: string; last_name: string } | null;
    users: { full_name: string } | null;
    notes: {
      id: string;
      is_structured: boolean;
      structured_output: string | null;
      flagged_as_incident: boolean;
      raw_input: string;
    } | null;
  };

  if (session.organization_id !== user.organization_id) notFound();

  const { data: transcriptData } = await supabase
    .from("voice_transcripts")
    .select("id, role, text, offset_ms, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  const transcripts = (transcriptData ?? []) as Array<{
    id: string;
    role: string;
    text: string;
    offset_ms: number | null;
    created_at: string;
  }>;

  const structured = session.notes?.structured_output
    ? (JSON.parse(session.notes.structured_output) as {
        summary?: string;
        sections?: Record<string, string>;
        follow_up?: string;
        flags?: Array<{ type: string; reason: string }>;
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      {/* Back link */}
      <Link href="/voice-sessions">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voice Sessions
        </Button>
      </Link>

      {/* Session header */}
      <div className="mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {session.residents
                ? `${session.residents.first_name} ${session.residents.last_name}`
                : "Unknown Resident"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {session.users?.full_name ?? "Unknown caregiver"} &middot;{" "}
              <span suppressHydrationWarning>
                {format(new Date(session.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </p>
          </div>
          <Badge
            variant={
              session.status === "completed"
                ? "secondary"
                : session.status === "failed"
                ? "destructive"
                : "default"
            }
            className="capitalize"
          >
            {session.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {session.duration_seconds && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(session.duration_seconds)}
            </span>
          )}
          <span className="flex items-center gap-1 capitalize">
            <Mic className="h-3.5 w-3.5" />
            {session.call_type.replace("_", " ")}
          </span>
          {session.note_id && (
            <Link
              href={`/residents/${session.residents ? (sessionData as { resident_id: string }).resident_id : ""}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              View Note
            </Link>
          )}
        </div>
      </div>

      <Separator />

      {/* Transcript */}
      <div className="mt-5 mb-5">
        <h3 className="text-base font-medium mb-3">Conversation</h3>
        <div className="mb-3">
          <AIDisclosure message={AI_DISCLOSURE_TRANSCRIPT} />
        </div>
        {transcripts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {session.full_transcript
              ? "Turn-by-turn breakdown not available."
              : "No transcript recorded."}
          </p>
        ) : (
          <div className="space-y-2">
            {transcripts
              .filter((t) => t.role !== "system")
              .map((turn) => (
                <div
                  key={turn.id}
                  className={`flex gap-2.5 ${
                    turn.role === "user" ? "" : "flex-row-reverse text-right"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      turn.role === "user"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {turn.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2 text-sm max-w-[80%] ${
                      turn.role === "user"
                        ? "bg-primary/10 text-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {turn.text}
                    {turn.offset_ms != null && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {Math.floor(turn.offset_ms / 1000)}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Fallback: full transcript if no turns */}
        {transcripts.length === 0 && session.full_transcript && (
          <Card className="mt-3">
            <CardContent className="py-3">
              <p className="text-sm whitespace-pre-wrap">{session.full_transcript}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Structured output */}
      {structured && (
        <>
          <Separator />
          <div className="mt-5">
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Structured Note
              {session.notes?.flagged_as_incident && (
                <Badge variant="destructive" className="text-xs">
                  Flagged
                </Badge>
              )}
            </h3>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-medium">{structured.summary}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {structured.sections &&
                  Object.entries(structured.sections).map(([section, text]) => (
                    <div key={section}>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {section}
                      </p>
                      <p className="text-sm mt-0.5">{text}</p>
                    </div>
                  ))}
                {structured.follow_up && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Follow-up
                    </p>
                    <p className="text-sm mt-0.5 italic">{structured.follow_up}</p>
                  </div>
                )}
                {structured.flags && structured.flags.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    {structured.flags.map((flag, i) => (
                      <p key={i} className="text-xs text-destructive">
                        <span className="font-medium">{flag.type}:</span> {flag.reason}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
