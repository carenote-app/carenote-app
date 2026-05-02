"use client";

import { useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamic-import the modal so the ~30KB MediaRecorder/Whisper plumbing
// only ships when a visitor actually opens the demo. ssr: false because
// the modal touches `navigator.mediaDevices` and other browser-only APIs
// during render setup.
const ConsultModal = dynamic(
  () =>
    import("./consult-modal").then(
      (m): { default: ComponentType<ConsultModalLazyProps> } => ({
        default: m.ConsultModal,
      })
    ),
  { ssr: false }
);

type ConsultModalLazyProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: "caretaker" | "doctor" | null;
};

interface Props {
  variant?: "hero" | "role";
  role?: "caretaker" | "doctor" | null;
  label?: string;
}

// Self-contained launcher: renders a CTA button and the modal it opens.
// Replaces the old pattern of hoisting modal state into the landing page,
// which forced the entire page tree to be a client component.
export function ConsultLauncher({
  variant = "hero",
  role = null,
  label,
}: Props) {
  const [open, setOpen] = useState(false);

  if (variant === "role") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
        >
          {label ?? "Continue"}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
        {open && (
          <ConsultModal
            isOpen={open}
            onClose={() => setOpen(false)}
            selectedRole={role}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="group h-14 gap-3 rounded-2xl bg-primary px-8 text-lg font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
      >
        <Mic className="h-5 w-5" />
        {label ?? "Start AI Consult"}
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Button>
      {open && (
        <ConsultModal
          isOpen={open}
          onClose={() => setOpen(false)}
          selectedRole={role}
        />
      )}
    </>
  );
}
