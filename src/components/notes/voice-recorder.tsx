"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type RecordingState = "idle" | "recording" | "transcribing";

export function VoiceRecorder({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const t = useTranslations("voiceRecorder");
  const [state, setState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

        if (audioBlob.size < 5000) {
          toast.error(t("recordingTooShort"));
          setState("idle");
          return;
        }

        setState("transcribing");

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob);

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Transcription failed");
          }

          const { transcript } = await response.json();
          onTranscript(transcript);
        } catch {
          toast.error(t("couldNotTranscribe"));
        }

        setState("idle");
      };

      mediaRecorder.start(250);
      setState("recording");

      timerRef.current = setTimeout(() => stopRecording(), 120000);
    } catch {
      toast.error(t("microphoneDenied"));
    }
  }, [onTranscript, stopRecording, t]);

  return (
    <Button
      type="button"
      variant={state === "recording" ? "destructive" : "outline"}
      size="sm"
      className="gap-1.5"
      disabled={state === "transcribing"}
      onPointerDown={(e) => {
        if (state === "idle") {
          e.preventDefault();
          startRecording();
        }
      }}
      onPointerUp={state === "recording" ? stopRecording : undefined}
      onPointerLeave={state === "recording" ? stopRecording : undefined}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: "none", WebkitTouchCallout: "none", userSelect: "none" }}
    >
      {state === "idle" && (
        <>
          <Mic className="h-4 w-4" />
          {t("holdToSpeak")}
        </>
      )}
      {state === "recording" && (
        <>
          <MicOff className="h-4 w-4 animate-pulse" />
          {t("recording")}
        </>
      )}
      {state === "transcribing" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("transcribing")}
        </>
      )}
    </Button>
  );
}
