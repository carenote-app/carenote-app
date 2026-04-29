import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryActions } from "@/components/summaries/summary-actions";
import {
  AIDisclosure,
  AI_DISCLOSURE_SUMMARY,
} from "@/components/transparency/ai-disclosure";
import { format } from "date-fns";

export default async function SummariesPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("weekly_summaries")
    .select("*, residents(first_name, last_name)")
    .eq("organization_id", user.organization_id)
    .order("created_at", { ascending: false })
    .limit(50);

  const summaries = (data ?? []) as Array<{
    id: string;
    week_start: string;
    week_end: string;
    summary_text: string;
    key_trends: string[];
    concerns: string[];
    incidents_count: number;
    status: string;
    created_at: string;
    residents: { first_name: string; last_name: string } | null;
  }>;

  const pending = summaries.filter((s) => s.status === "pending_review");
  const approved = summaries.filter((s) => s.status === "approved");

  return (
    <div className="px-4 py-6">
      <h2 className="mb-2 text-xl font-semibold">Weekly Summaries</h2>
      <div className="mb-6">
        <AIDisclosure message={AI_DISCLOSURE_SUMMARY} />
      </div>

      {summaries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No weekly summaries yet. They auto-generate every Sunday at 6 PM.
          </p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-medium">
                Pending Review ({pending.length})
              </h3>
              <div className="space-y-4">
                {pending.map((summary) => (
                  <SummaryCard key={summary.id} summary={summary} />
                ))}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-medium">Approved</h3>
              <div className="space-y-4">
                {approved.map((summary) => (
                  <SummaryCard key={summary.id} summary={summary} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  summary,
}: {
  summary: {
    id: string;
    week_start: string;
    week_end: string;
    summary_text: string;
    key_trends: string[];
    concerns: string[];
    incidents_count: number;
    status: string;
    residents: { first_name: string; last_name: string } | null;
  };
}) {
  return (
    <Card className={summary.status === "pending_review" ? "border-primary/30" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {summary.residents?.first_name} {summary.residents?.last_name}
          </CardTitle>
          <Badge
            variant={summary.status === "pending_review" ? "default" : "secondary"}
            className="capitalize"
          >
            {summary.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Week of {format(new Date(summary.week_start + "T00:00:00"), "MMM d")} —{" "}
          {format(new Date(summary.week_end + "T00:00:00"), "MMM d, yyyy")}
          {summary.incidents_count > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {summary.incidents_count} incident{summary.incidents_count > 1 ? "s" : ""}
            </Badge>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{summary.summary_text}</p>

        {summary.key_trends.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Key Trends
            </p>
            <ul className="text-sm list-disc list-inside">
              {summary.key_trends.map((trend, i) => (
                <li key={i}>{trend}</li>
              ))}
            </ul>
          </div>
        )}

        {summary.concerns.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Items for review
            </p>
            <ul className="text-sm list-disc list-inside">
              {summary.concerns.map((concern, i) => (
                <li key={i}>{concern}</li>
              ))}
            </ul>
          </div>
        )}

        {summary.status === "pending_review" && (
          <SummaryActions summaryId={summary.id} />
        )}
      </CardContent>
    </Card>
  );
}
