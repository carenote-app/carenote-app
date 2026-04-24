"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { X, Mic, Square, Loader2, FileText, Copy, Check, Volume2, ArrowRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ConsultModalProps {
  isOpen: boolean
  onClose: () => void
  selectedRole: "caretaker" | "doctor" | null
}

type RecordingState = "idle" | "recording" | "processing" | "complete" | "error"

const MAX_RECORDING_SECONDS = 90

export function ConsultModal({ isOpen, onClose, selectedRole }: ConsultModalProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [transcript, setTranscript] = useState("")
  const [generatedNote, setGeneratedNote] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetState = useCallback(() => {
    setRecordingState("idle")
    setTranscript("")
    setGeneratedNote("")
    setErrorMessage("")
    setRecordingTime(0)
  }, [])

  const cleanupRecorder = useCallback(() => {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current)
      autoStopRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
  }, [])

  const handleClose = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    cleanupRecorder()
    resetState()
    onClose()
  }, [cleanupRecorder, resetState, onClose])

  useEffect(() => {
    if (recordingState === "recording") {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [recordingState])

  useEffect(() => {
    return () => {
      cleanupRecorder()
    }
  }, [cleanupRecorder])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const sendToServer = useCallback(
    async (audioBlob: Blob) => {
      setRecordingState("processing")
      try {
        const formData = new FormData()
        formData.append("audio", audioBlob)
        formData.append("role", selectedRole ?? "caretaker")

        const response = await fetch("/api/demo/consult", {
          method: "POST",
          body: formData,
        })

        const data = (await response.json().catch(() => ({}))) as {
          transcript?: string
          structured?: string
          error?: string
        }

        if (!response.ok) {
          setErrorMessage(
            data.error ?? "Something went wrong. Please try again."
          )
          setRecordingState("error")
          return
        }

        setTranscript(data.transcript ?? "")
        setGeneratedNote(data.structured ?? "")
        setRecordingState("complete")
      } catch {
        setErrorMessage("Network error. Please try again.")
        setRecordingState("error")
      }
    },
    [selectedRole]
  )

  const stopRecording = useCallback(() => {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current)
      autoStopRef.current = null
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    setErrorMessage("")
    setTranscript("")
    setGeneratedNote("")
    setRecordingTime(0)

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Microphone is not available in this browser.")
      setRecordingState("error")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        cleanupRecorder()

        if (blob.size < 5000) {
          setErrorMessage("Recording too short. Try again and speak for a few seconds.")
          setRecordingState("error")
          return
        }
        void sendToServer(blob)
      }

      recorder.start(250)
      setRecordingState("recording")

      autoStopRef.current = setTimeout(() => {
        stopRecording()
      }, MAX_RECORDING_SECONDS * 1000)
    } catch {
      cleanupRecorder()
      setErrorMessage(
        "Microphone access denied. Allow microphone access and try again."
      )
      setRecordingState("error")
    }
  }, [cleanupRecorder, sendToServer, stopRecording])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedNote)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  const buttonAction =
    recordingState === "recording" ? stopRecording : startRecording

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Consultation</h2>
            <p className="text-sm text-muted-foreground">
              {selectedRole === "doctor" ? "Clinical Documentation" : "Care Documentation"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Volume2 className="h-4 w-4 text-primary" />
                Voice Recording
              </h3>

              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/30 p-8">
                <button
                  onClick={buttonAction}
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

                  {recordingState === "recording" && (
                    <>
                      <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" />
                      <span className="absolute inset-[-8px] animate-pulse rounded-full border-2 border-destructive/50" />
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  {recordingState === "idle" && (
                    <p className="text-sm text-muted-foreground">
                      Tap to start recording (up to {MAX_RECORDING_SECONDS}s)
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
                      Transcribing and structuring...
                    </p>
                  )}
                  {recordingState === "complete" && (
                    <p className="text-sm text-primary">
                      Recording complete · tap mic to try again
                    </p>
                  )}
                  {recordingState === "error" && (
                    <p className="text-sm text-destructive">
                      Tap mic to try again
                    </p>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

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

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Generated Documentation
              </h3>

              <div
                className={cn(
                  "min-h-[300px] rounded-xl border bg-secondary/30 p-4",
                  generatedNote ? "border-primary/50" : "border-border"
                )}
              >
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

        <div className="border-t border-border bg-secondary/30 px-6 py-4">
          {recordingState === "complete" ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Ready to try Kinroster with your own residents?
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
              Live demo: your voice is transcribed and structured by AI. Audio is not stored.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
