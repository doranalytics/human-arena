"use client";
/**
 * Dictation. Preferred path: record a clip with MediaRecorder and transcribe it on the
 * server (OpenAI gpt-4o-transcribe) so it works in every browser. Fallback when the
 * server has no key: the browser's own recognizer (Web Speech API; Chrome, Edge, Safari).
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface RecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
}
type Ctor = new () => RecognitionLike;

function speechCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
const hasRecorder = () => typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

let serverSTT: boolean | null = null;
const sttListeners = new Set<() => void>();
function probeServer() {
  if (serverSTT !== null || typeof window === "undefined") return;
  serverSTT = false;
  fetch("/api/transcribe")
    .then((r) => r.json())
    .then((j: { enabled?: boolean }) => {
      serverSTT = !!j.enabled;
      sttListeners.forEach((l) => l());
    })
    .catch(() => null);
}

export function useDictation(onFinal: (text: string) => void) {
  const server = useSyncExternalStore(
    (l) => {
      sttListeners.add(l);
      probeServer();
      return () => void sttListeners.delete(l);
    },
    () => serverSTT === true,
    () => false,
  );
  const browser = useSyncExternalStore(() => () => {}, () => !!speechCtor(), () => false);
  const canRecord = useSyncExternalStore(() => () => {}, hasRecorder, () => false);
  const supported = (server && canRecord) || browser;
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const rec = useRef<RecognitionLike | null>(null);
  const media = useRef<MediaRecorder | null>(null);
  const cb = useRef(onFinal);
  useEffect(() => {
    cb.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    if (media.current && media.current.state !== "inactive") media.current.stop();
    rec.current?.stop();
    rec.current = null;
    setListening(false);
  }, []);

  const startRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        media.current = null;
        setListening(false);
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        if (blob.size < 1000) return;
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, `clip.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
          const r = await fetch("/api/transcribe", { method: "POST", body: fd });
          const j = (await r.json()) as { text?: string };
          if (j.text?.trim()) cb.current(j.text.trim());
        } catch {
          /* leave the box as it was */
        } finally {
          setTranscribing(false);
        }
      };
      media.current = mr;
      mr.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const startBrowser = useCallback(() => {
    const C = speechCtor();
    if (!C || rec.current) return;
    const r = new C();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) cb.current(res[0].transcript.trim());
      }
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
    };
    r.onerror = r.onend;
    rec.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      rec.current = null;
      setListening(false);
    }
  }, []);

  const start = useCallback(() => {
    if (server && canRecord) void startRecorder();
    else startBrowser();
  }, [server, canRecord, startRecorder, startBrowser]);

  useEffect(
    () => () => {
      rec.current?.stop();
      if (media.current && media.current.state !== "inactive") media.current.stop();
    },
    [],
  );
  return { supported, listening, transcribing, start, stop, mode: server && canRecord ? ("server" as const) : ("browser" as const) };
}
