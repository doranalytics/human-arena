"use client";
import { useState, type CSSProperties } from "react";
import { AlignLeft, ArrowRight, Check, ChevronRight, Compass, Flame, ListChecks, MessageCircleQuestion, Paperclip, Play, Puzzle, RefreshCw, SlidersHorizontal, Users, X, type LucideIcon } from "lucide-react";
import { lessonById, type LessonId } from "@/lib/learning/catalog";
import { LEARNING_PATH, recommendedLesson, stopState, type PathStop } from "@/lib/learning/path";
import { loadLearning, setLearning, useLearning } from "@/lib/learning/client";
import { openDialog } from "@/lib/ui";
import { useSession } from "@/lib/session";
import { Dialog, Button } from "../dialog";
import { LessonPlayer } from "./lesson-player";

const ICONS: Record<PathStop["icon"], LucideIcon> = {
  length: AlignLeft, audience: Users, format: ListChecks, combine: Puzzle,
  context: Paperclip, interview: MessageCircleQuestion, refine: SlidersHorizontal,
};
const positions = [
  { x: "50%", y: "48px", dx: "12.5%", dy: "66px" },
  { x: "29%", y: "156px", dx: "37.5%", dy: "96px" },
  { x: "68%", y: "264px", dx: "62.5%", dy: "66px" },
  { x: "45%", y: "372px", dx: "87.5%", dy: "96px" },
];
const connections = [
  { mobile: "M200 48 C200 115 116 89 116 156", desktop: "M100 66 C190 66 210 96 300 96" },
  { mobile: "M116 156 C116 227 272 193 272 264", desktop: "M300 96 C390 96 410 66 500 66" },
  { mobile: "M272 264 C272 333 180 303 180 372", desktop: "M500 66 C590 66 610 96 700 96" },
];

export function LearningHome() {
  const l = useLearning(), session = useSession();
  const [selected, setSelected] = useState<{ lesson: LessonId; index: number } | null>(null);
  const recommended = recommendedLesson(l.runs, l.preferredStart);
  const ready = l.loaded && !l.error;
  const selectedLesson = selected ? lessonById(selected.lesson)! : null;
  const selectedPath = selected ? LEARNING_PATH.find((p) => p.id === selected.lesson)! : null;
  const selectedStop = selected && selectedPath ? selectedPath.stops[selected.index] : null;
  const selectedRun = selected ? l.runs.find((r) => r.lesson_id === selected.lesson) : undefined;
  const selectedStep = selectedRun?.step ?? 0;
  const selectedStatus = selectedStop ? stopState(selectedStop, selectedStep) : null;
  const currentStop = selectedPath?.stops.find((s) => selectedStep < s.to);
  function openLesson(id: LessonId) {
    setSelected(null);
    setLearning({ active: id, preferredStart: id });
  }
  if (l.active) return <LessonPlayer key={l.active} id={l.active} />;
  return (
    <div className="learning-map mx-auto w-full max-w-4xl px-5 py-6 md:px-10 md:py-9">
      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Your path</h1>
        <span className="flex shrink-0 items-center gap-1.5 text-sm" title="Consecutive days with a completed lesson or challenge">
          <Flame size={19} className="text-clay" />
          {session.practice ? `${session.practice.current} day streak` : "Streak —"}
        </span>
      </header>
      {l.error && <div role="alert" className="mb-5 rounded-xl border border-bad/30 p-4 text-sm">{l.error} <button onClick={() => void loadLearning()} className="ml-2 underline">Retry</button></div>}
      {!l.loaded && <p role="status" className="mb-4 text-sm text-ink-2">Loading your path…</p>}
      <div className="map-lessons">
        {LEARNING_PATH.map((lesson, lessonIndex) => {
          const run = l.runs.find((r) => r.lesson_id === lesson.id);
          const step = run?.step ?? 0;
          return (
            <section className={`map-lesson ${lessonIndex === 1 ? "map-lesson-teal" : ""}`} key={lesson.id} aria-labelledby={`path-${lesson.id}`}>
              <div className="map-lesson-heading">
                <span className="map-lesson-number" aria-hidden="true">0{lessonIndex + 1}</span>
                <h2 id={`path-${lesson.id}`} className="min-w-0 flex-1 text-base font-semibold md:text-lg">{lesson.title}</h2>
                <span className="shrink-0 text-xs tabular-nums text-ink-3" aria-label={`${step} of 10 exercises completed`}>{ready ? `${step} / 10` : "— / 10"}</span>
              </div>
              <div className="map-trail">
                <svg className="map-lines map-lines-mobile" viewBox="0 0 400 440" preserveAspectRatio="none" aria-hidden="true">
                  {connections.map((line, i) => <path key={i} d={line.mobile} className={step >= lesson.stops[i].to ? "map-line-done" : ""} />)}
                </svg>
                <svg className="map-lines map-lines-desktop" viewBox="0 0 800 194" preserveAspectRatio="none" aria-hidden="true">
                  {connections.map((line, i) => <path key={i} d={line.desktop} className={step >= lesson.stops[i].to ? "map-line-done" : ""} />)}
                </svg>
                {lesson.stops.map((stop, i) => {
                  const status = stopState(stop, step), Icon = ICONS[stop.icon], pos = positions[i];
                  const next = ready && recommended === lesson.id && status === "current";
                  const fraction = Math.max(0, Math.min(1, (step - stop.from) / (stop.to - stop.from)));
                  return (
                    <div key={stop.label} className={`map-stop map-stop-${status} ${next ? "map-stop-next" : ""}`} style={{ "--stop-x": pos.x, "--stop-y": pos.y, "--stop-dx": pos.dx, "--stop-dy": pos.dy } as CSSProperties}>
                      {next && <span className="map-next-label">{run ? "Continue" : "Start here"}</span>}
                      <button type="button" className="map-node" disabled={!ready} onClick={() => setSelected({ lesson: lesson.id, index: i })} aria-label={`${lesson.title}: ${stop.label}. ${status === "complete" ? "Completed" : next ? "Your next step" : status === "upcoming" ? "Preview" : "Available"}`} aria-haspopup="dialog">
                        <svg className="map-node-ring" viewBox="0 0 84 84" aria-hidden="true">
                          <circle cx="42" cy="42" r="38" className="map-ring-track" />
                          {fraction > 0 && <circle cx="42" cy="42" r="38" pathLength="100" strokeDasharray={`${fraction * 100} 100`} className="map-ring-progress" />}
                        </svg>
                        <Icon size={27} strokeWidth={1.8} aria-hidden="true" />
                        {status === "complete" && <span className="map-done-mark" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}
                      </button>
                      <span className="map-node-label">{stop.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-line pt-3">
        <button className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink-2 hover:text-clay" onClick={() => openDialog({ kind: "challenges" })}><Compass size={18} /> Explore more challenges <ChevronRight size={15} /></button>
        <button className="flex min-h-11 items-center gap-2 text-xs text-ink-3 hover:text-ink" onClick={() => {
          const product = l.surface === "claude" ? "chatgpt" : "claude";
          setLearning({ surface: product });
          void fetch("/api/learning-surface", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product }) }).then((r) => { if (!r.ok) void loadLearning(); }).catch(() => void loadLearning());
        }}><RefreshCw size={14} /> Switch to {l.surface === "claude" ? "ChatGPT" : "Claude"}</button>
      </footer>
      {selected && selectedLesson && selectedStop && <Dialog open onClose={() => setSelected(null)} title={<span className="text-sm text-ink-2">{selectedPath?.title}</span>} footer={<>
        <Button variant="ghost" onClick={() => setSelected(null)}><X size={14} /> Close</Button>
        <Button onClick={() => openLesson(selected.lesson)}><Play size={14} />{selectedRun?.completed_at ? "View achievement" : selectedStatus === "upcoming" ? `${selectedRun ? "Continue from" : "Start with"} ${currentStop?.label.toLowerCase()}` : selectedRun ? "Continue lesson" : "Start lesson"}<ArrowRight size={14} /></Button>
      </>}>
        <div className="py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-clay">{selectedStatus === "complete" ? "Completed" : selectedStatus === "upcoming" ? "Coming up in this lesson" : "Your next step"}</p>
          <h3 className="mt-2 text-2xl font-semibold">{selectedStop.label}</h3>
          <p className="mt-3 text-base text-ink-2">{selectedStop.outcome}</p>
          {selectedStatus === "upcoming" && <p className="mt-3 text-sm text-ink-3">You’ll reach this after the earlier exercises. {selectedRun ? "Your progress is saved." : "Start this lesson whenever you’re ready."}</p>}
          <p className="mt-5 text-xs text-ink-3">{selectedStop.to - selectedStop.from} exercises in this section · {selectedLesson.points} points for the full lesson</p>
        </div>
      </Dialog>}
    </div>
  );
}
