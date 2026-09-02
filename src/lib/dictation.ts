"use client";
/** Dictation on the browser's built-in recognizer (Web Speech API). Chrome, Edge and Safari; no key, no server. */
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

function ctor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useDictation(onFinal: (text: string) => void) {
  const supported = useSyncExternalStore(() => () => {}, () => !!ctor(), () => false);
  const [listening, setListening] = useState(false);
  const rec = useRef<RecognitionLike | null>(null);
  const cb = useRef(onFinal);
  useEffect(() => {
    cb.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    rec.current?.stop();
    rec.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const C = ctor();
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
    r.onerror = () => {
      rec.current = null;
      setListening(false);
    };
    rec.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      rec.current = null;
      setListening(false);
    }
  }, []);

  useEffect(() => () => rec.current?.stop(), []);
  return { supported, listening, start, stop };
}
