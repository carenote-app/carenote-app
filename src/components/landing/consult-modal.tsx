"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { X, Mic, Square, Loader2, FileText, Copy, Check, Volume2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ConsultModalProps {
  isOpen: boolean
  onClose: () => void
  selectedRole: "caretaker" | "doctor" | null
}

type RecordingState = "idle" | "recording" | "processing" | "complete"

export function ConsultModal({ isOpen, onClose, selectedRole }: ConsultModalProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [transcript, setTranscript] = useState("")
  const [generatedNote, setGeneratedNote] = useState("")
  const [copied, setCopied] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const resetState = useCallback(() => {
    setRecordingState("idle")
    setTranscript("")
    setGeneratedNote("")
    setRecordingTime(0)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  useEffect(() => {
    if (recordingState === "recording") {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recordingState])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startRecording = () => {
    setRecordingState("recording")
    setRecordingTime(0)
    setTranscript("")
    setGeneratedNote("")
  }

  const stopRecording = () => {
    setRecordingState("processing")
    // Simulate processing
    setTimeout(() => {
      setTranscript(
        selectedRole === "doctor" 
          ? "Patient presents with persistent cough for 5 days, mild fever of 100.2°F. No difficulty breathing. History of seasonal allergies. Currently taking no medications. Recommend chest X-ray and complete blood count. Prescribing amoxicillin 500mg three times daily for 7 days."
          : "Mrs. Johnson had a good day today. She ate about 75% of her breakfast and all of her lunch. Her mobility seems improved—she walked to the garden with assistance. Blood pressure reading was 128/82. She mentioned some mild discomfort in her left hip but said it was manageable. Mood was positive, enjoyed visiting with family in the afternoon."
      )
      setGeneratedNote(
        selectedRole === "doctor"
          ? `CLINICAL NOTE

Date: ${new Date().toLocaleDateString()}
Provider: Attending Physician

CHIEF COMPLAINT:
Persistent cough × 5 days with low-grade fever

HISTORY OF PRESENT ILLNESS:
Patient presents with a productive cough that began 5 days ago. Associated with mild fever (100.2°F). Denies shortness of breath, chest pain, or hemoptysis. No recent travel or sick contacts.

PAST MEDICAL HISTORY:
- Seasonal allergies

CURRENT MEDICATIONS:
- None

ASSESSMENT:
1. Acute bronchitis, likely bacterial superinfection

PLAN:
1. Chest X-ray (PA and lateral)
2. CBC with differential
3. Amoxicillin 500mg TID × 7 days
4. Return if symptoms worsen or no improvement in 48-72 hours

_________________________________
Electronic Signature`
          : `DAILY CARE REPORT

Resident: Mrs. Johnson
Date: ${new Date().toLocaleDateString()}
Caregiver: [Name]

NUTRITION:
- Breakfast: 75% consumed
- Lunch: 100% consumed
- Dinner: Pending
- Hydration: Adequate

MOBILITY:
- Activity Level: Improved
- Ambulation: Walked to garden with assistance
- Falls: None reported

VITAL SIGNS:
- Blood Pressure: 128/82 mmHg

PAIN ASSESSMENT:
- Location: Left hip
- Severity: Mild, manageable
- Intervention: Monitoring

MOOD & BEHAVIOR:
- Overall Mood: Positive
- Social Activity: Family visit in afternoon
- Sleep Quality: To be documented

NOTES:
Resident had a good day with improved mobility and positive social engagement.

_________________________________
Caregiver Signature`
      )
      setRecordingState("complete")
    }, 2000)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedNote)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Consultation</h2>
            <p className="text-sm text-muted-foreground">
              {selectedRole === "doctor" ? "Clinical Documentation" : "Care Documentation"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recording Section */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Volume2 className="h-4 w-4 text-primary" />
                Voice Recording
              </h3>
              
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/30 p-8">
                {/* Recording Button */}
                <button
                  onClick={recordingState === "recording" ? stopRecording : startRecording}
                  disabled={recordingState === "processing"}
                  className={cn(
                    "relative flex h-24 w-24 items-center justify-center rounded-full transition-all",
                    recordingState === "recording" 
                      ? "bg-destructive text-destructive-foreground animate-pulse" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                    recordingState === "processing" && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {recordingState === "processing" ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : recordingState === "recording" ? (
                    <Square className="h-8 w-8" />
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                  
                  {/* Recording ring animation */}
                  {recordingState === "recording" && (
                    <>
                      <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" />
                      <span className="absolute inset-[-8px] animate-pulse rounded-full border-2 border-destructive/50" />
                    </>
                  )}
                </button>

                {/* Status text */}
                <div className="mt-4 text-center">
                  {recordingState === "idle" && (
                    <p className="text-sm text-muted-foreground">
                      Tap to start recording
                    </p>
                  )}
                  {recordingState === "recording" && (
                    <div className="space-y-1">
                      <p className="text-2xl font-mono font-medium text-destructive">
                        {formatTime(recordingTime)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Recording... Tap to stop
                      </p>
                    </div>
                  )}
                  {recordingState === "processing" && (
                    <p className="text-sm text-muted-foreground">
                      Processing your recording...
                    </p>
                  )}
                  {recordingState === "complete" && (
                    <p className="text-sm text-primary">
                      Recording complete
                    </p>
                  )}
                </div>
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Transcript</h4>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <p className="text-sm leading-relaxed text-foreground">
                      {transcript}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Note Section */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Generated Documentation
              </h3>

              <div className={cn(
                "min-h-[300px] rounded-xl border bg-secondary/30 p-4",
                generatedNote ? "border-primary/50" : "border-border"
              )}>
                {!generatedNote ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">
                      {recordingState === "processing" 
                        ? "Generating documentation..." 
                        : "Start a recording to generate documentation"}
                    </p>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
                    {generatedNote}
                  </pre>
                )}
              </div>

              {generatedNote && (
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-6 py-4">
          {recordingState === "complete" ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Ready to try CareNote with your own residents?
              </p>
              <Link href="/signup">
                <Button className="gap-2">
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              This is a demo showing how CareNote structures clinical documentation from voice input.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
