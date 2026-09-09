"use client";
import { useSyncExternalStore } from "react";
import type { LessonRun, Surface, LessonId } from "./catalog";
interface LearningState {
  loaded: boolean;
  error: string;
  runs: LessonRun[];
  surface: Surface;
  active: LessonId | null;
  preferredStart: LessonId;
}
let state: LearningState = {
  loaded: false,
  error: "",
  runs: [],
  surface: "claude",
  active: null,
  preferredStart: "shape-answers",
};
const initial = state;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function useLearning() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
}
export function setLearning(p: Partial<LearningState>) {
  state = { ...state, ...p };
  listeners.forEach((fn) => fn());
}
export async function loadLearning() {
  try {
    const r = await fetch("/api/learning", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error);
    setLearning({
      loaded: true,
      runs: j.runs,
      surface: j.onboarding?.product ?? "claude",
      preferredStart: j.onboarding?.start === "better-context" ? "better-context" : "shape-answers",
      error: "",
    });
  } catch (e) {
    setLearning({
      loaded: true,
      error: e instanceof Error ? e.message : "Could not load lessons.",
    });
  }
}
export function saveRun(run: LessonRun) {
  setLearning({
    runs: [...state.runs.filter((r) => r.lesson_id !== run.lesson_id), run],
  });
}
