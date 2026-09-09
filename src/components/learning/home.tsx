"use client";
import {
  ArrowRight,
  Check,
  Circle,
  Layers,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { LESSONS } from "@/lib/learning/catalog";
import { loadLearning, setLearning, useLearning } from "@/lib/learning/client";
import { openDialog } from "@/lib/ui";
import { useSession } from "@/lib/session";
import { LessonPlayer } from "./lesson-player";
export function LearningHome() {
  const l = useLearning(),
    session = useSession();
  if (l.active) return <LessonPlayer key={l.active} id={l.active} />;
  return (
    <div className="mx-auto max-w-4xl px-5 py-7 md:px-10 md:py-12">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-clay">
        Your learning path
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          One useful move at a time.
        </h1>
        <span className="rounded-full border border-line px-3 py-1.5 text-sm">
          {session.practice?.current ?? 0} day streak
        </span>
      </div>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2">
        Practice a piece. Combine it with another. Build something you can use.
        Start anywhere and move at your own pace.
      </p>
      {l.error && (
        <div role="alert" className="mt-5 rounded-xl border border-bad/30 p-4">
          {l.error}
          <button
            onClick={() => void loadLearning()}
            className="ml-3 underline"
          >
            Retry
          </button>
        </div>
      )}
      <div className="relative mt-9 space-y-4">
        {LESSONS.map((lesson, i) => {
          const run = l.runs.find((r) => r.lesson_id === lesson.id);
          return (
            <div key={lesson.id} className="flex gap-3 md:gap-5">
              <div className="flex w-9 shrink-0 flex-col items-center">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${run?.completed_at ? "bg-ok text-white" : "bg-clay/10 text-clay"}`}
                >
                  {run?.completed_at ? <Check size={18} /> : i + 1}
                </span>
                {i === 0 && <span className="mt-2 w-px flex-1 bg-line-2" />}
              </div>
              <button
                disabled={!l.loaded || !!l.error}
                onClick={() => setLearning({ active: lesson.id })}
                className="group flex min-w-0 flex-1 flex-col rounded-2xl border border-line bg-bg p-4 text-left transition hover:border-clay/50 md:p-6"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-ink-2">
                      {i === 0 ? "Foundations" : "Build on the basics"} ·{" "}
                      {lesson.points} points
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">
                      {lesson.title}
                    </h2>
                  </div>
                  <ArrowRight size={19} className="mt-2 shrink-0 text-clay" />
                </div>
                <p className="mt-2 text-sm text-ink-2">{lesson.outcome}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {lesson.techniques.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-line px-2.5 py-1 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="mt-4 text-sm font-medium text-clay">
                  {run?.completed_at
                    ? "View achievement"
                    : run
                      ? `Resume · ${run.step} of 10 complete`
                      : "Start · 10 small exercises"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="ml-12 mt-6 rounded-2xl bg-bg-2 p-5 md:ml-14">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers size={18} />
          Put more pieces together
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Explore existing challenges for files, connectors, projects, and
          repeatable tasks. Guided build lessons are coming next.
        </p>
        <button
          onClick={() => openDialog({ kind: "challenges" })}
          className="mt-3 flex min-h-10 items-center gap-2 text-sm font-medium text-clay"
        >
          Browse challenge library
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="mt-8 flex flex-wrap gap-4 border-t border-line pt-5">
        <button
          onClick={() => openDialog({ kind: "leaderboard" })}
          className="flex min-h-11 items-center gap-2 text-sm"
        >
          <Trophy size={17} />
          Weekly & all-time leaderboard
        </button>
        <button
          onClick={() => {
            setLearning({
              surface: l.surface === "claude" ? "chatgpt" : "claude",
            });
            void fetch("/api/learning-surface", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                product: l.surface === "claude" ? "chatgpt" : "claude",
              }),
            })
              .then((r) => {
                if (!r.ok) void loadLearning();
              })
              .catch(() => void loadLearning());
          }}
          className="flex min-h-11 items-center gap-2 text-sm"
        >
          <RefreshCw size={16} />
          Switch to {l.surface === "claude" ? "ChatGPT" : "Claude"}
        </button>
      </div>
      {!l.loaded && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 text-sm text-ink-2"
        >
          <Circle size={14} />
          Loading your progress…
        </p>
      )}
    </div>
  );
}
