import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Clock } from "lucide-react";
import type { ClinicianSummaryOutput } from "@/lib/prompts/clinician-summary";
import { AIDisclosure } from "@/components/transparency/ai-disclosure";

export function ClinicianPortalView({
  facility_name,
  resident,
  clinician,
  summary,
  expires_at,
}: {
  facility_name: string;
  resident: {
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
  } | null;
  clinician: {
    full_name: string;
    specialty: string | null;
  } | null;
  summary: ClinicianSummaryOutput;
  expires_at: string;
}) {
  const expiresDisplay = new Date(expires_at).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const residentDisplay = resident
    ? `${resident.first_name} ${resident.last_name}`
    : "Patient";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {facility_name}
            </p>
            <h1 className="text-lg font-semibold mt-0.5">
              Clinical summary: {residentDisplay}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Confidential — HIPAA protected
            </Badge>
            <AIDisclosure
              variant="badge"
              message="AI-generated summary"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="rounded-md border bg-card p-4 space-y-1 text-sm">
          <div className="flex justify-between flex-wrap gap-x-6 gap-y-1">
            <div>
              <span className="text-muted-foreground">Patient:</span>{" "}
              <span className="font-medium">{residentDisplay}</span>
              {resident?.date_of_birth && (
                <span className="text-muted-foreground">
                  {" "}
                  (DOB {resident.date_of_birth})
                </span>
              )}
            </div>
            {clinician && (
              <div>
                <span className="text-muted-foreground">Prepared for:</span>{" "}
                <span className="font-medium">{clinician.full_name}</span>
                {clinician.specialty && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {clinician.specialty}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
            <Clock className="h-3 w-3" />
            Link expires {expiresDisplay}. Opens are logged.
          </div>
        </div>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Summary
          </h2>
          <div className="space-y-4 text-sm leading-relaxed">
            {summary.body.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {summary.key_observations.length > 0 && (
          <>
            <Separator />
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Key observations
              </h2>
              <ul className="text-sm space-y-1 list-disc ml-5">
                {summary.key_observations.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        {summary.medication_adherence && (
          <>
            <Separator />
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Medication adherence
              </h2>
              <p className="text-sm">{summary.medication_adherence}</p>
            </section>
          </>
        )}

        {summary.safety_events.length > 0 && (
          <>
            <Separator />
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Safety events
              </h2>
              <ul className="text-sm space-y-1 list-disc ml-5">
                {summary.safety_events.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        {summary.cognitive_changes && (
          <>
            <Separator />
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Cognitive changes
              </h2>
              <p className="text-sm">{summary.cognitive_changes}</p>
            </section>
          </>
        )}

        {summary.follow_up_recommended.length > 0 && (
          <>
            <Separator />
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Follow-up flagged by care team
              </h2>
              <ul className="text-sm space-y-1 list-disc ml-5">
                {summary.follow_up_recommended.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        <Separator />
        <footer className="text-xs text-muted-foreground pt-2">
          <p>
            This summary is generated by an AI assistant from caregiver shift
            notes and is intended for clinical review. It is not a substitute
            for direct clinical assessment.
          </p>
          <p className="mt-1">Sent by {facility_name} via Kinroster.</p>
        </footer>
      </main>
    </div>
  );
}
