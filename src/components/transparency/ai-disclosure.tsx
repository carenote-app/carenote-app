import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Standardized transparency / disclosure copy for AI-generated content.
// Choosing one of these by surface keeps the regulatory posture consistent
// across the app — every place that renders AI output should display one.
//
// Phrasing follows the FDA's Non-Device CDS exemption framing: outputs
// are presented as observational / documentation aids, not clinical
// assessments or decision support.
export const AI_DISCLOSURE_NOTE =
  "AI-structured from caregiver input. Not a clinical assessment.";
export const AI_DISCLOSURE_SUMMARY =
  "AI-generated from caregiver shift notes. Review before external sharing.";
export const AI_DISCLOSURE_INCIDENT =
  "AI-generated from caregiver documentation. Not a substitute for professional incident review.";
export const AI_DISCLOSURE_TRANSCRIPT =
  "AI-transcribed from voice. Review for accuracy.";
export const AI_DISCLOSURE_FAMILY =
  "Created by AI from caregiver observations. Not a medical diagnosis or clinical assessment.";
export const AI_DISCLOSURE_DEMO =
  "Demo only. AI-structured output is illustrative — not for clinical use.";

export function AIDisclosure({
  message,
  variant = "banner",
  className,
}: {
  message: string;
  variant?: "banner" | "badge" | "inline";
  className?: string;
}) {
  if (variant === "badge") {
    return (
      <span
        role="note"
        aria-label="AI-generated content"
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-50/60 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300",
          className
        )}
      >
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        {message}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <p
        role="note"
        className={cn(
          "flex items-start gap-1.5 text-xs italic text-muted-foreground",
          className
        )}
      >
        <Sparkles className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </p>
    );
  }

  return (
    <div
      role="note"
      aria-label="AI-generated content"
      className={cn(
        "flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-50/40 p-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-300",
        className
      )}
    >
      <Sparkles className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p className="leading-snug">{message}</p>
    </div>
  );
}
