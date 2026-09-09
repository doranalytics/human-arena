import type { LessonId, LessonRun } from "./catalog";

export interface PathStop {
  label: string;
  icon: "length" | "audience" | "format" | "combine" | "context" | "interview" | "refine";
  from: number;
  to: number;
  outcome: string;
}
export interface PathLesson { id: LessonId; title: string; stops: PathStop[] }

/** Stops group existing exercises; they never change their order or grading. */
export const LEARNING_PATH: PathLesson[] = [
  { id: "shape-answers", title: "Shape an answer", stops: [
    { label: "Length", icon: "length", from: 0, to: 2, outcome: "Ask for the amount of detail you need." },
    { label: "Audience", icon: "audience", from: 2, to: 4, outcome: "Adapt an explanation to the person reading it." },
    { label: "Format", icon: "format", from: 4, to: 6, outcome: "Ask for an answer in a useful format." },
    { label: "Combine", icon: "combine", from: 6, to: 10, outcome: "Use length, audience, and format together." },
  ] },
  { id: "better-context", title: "Give AI better context", stops: [
    { label: "Context", icon: "context", from: 0, to: 2, outcome: "Give AI the details it needs to help you." },
    { label: "Interview", icon: "interview", from: 2, to: 6, outcome: "Have AI ask questions, then add relevant details." },
    { label: "Refine", icon: "refine", from: 6, to: 9, outcome: "Guide a recommendation with criteria and feedback." },
    { label: "Combine", icon: "combine", from: 9, to: 10, outcome: "Use an interview, context, and criteria together." },
  ] },
];

export function stopState(stop: PathStop, step: number) {
  return step >= stop.to ? "complete" : step >= stop.from ? "current" : "upcoming";
}

export function recommendedLesson(runs: LessonRun[], preferred: LessonId): LessonId | undefined {
  const ordered = [preferred, ...LEARNING_PATH.map((l) => l.id).filter((id) => id !== preferred)];
  return ordered.find((id) => runs.some((r) => r.lesson_id === id && !r.completed_at))
    ?? ordered.find((id) => !runs.some((r) => r.lesson_id === id && r.completed_at));
}
