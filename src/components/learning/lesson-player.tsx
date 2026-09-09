"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Pause,
  Play,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  lessonById,
  type LessonId,
  type LessonRun,
} from "@/lib/learning/catalog";
import { saveRun, setLearning, useLearning } from "@/lib/learning/client";
import { refreshSession, useSession } from "@/lib/session";
import { LessonFinish } from "./lesson-finish";
import { endAttempt } from "@/lib/store";
export function LessonPlayer({ id }: { id: LessonId }) {
  // A guided lesson has its own saved run; legacy challenge events must not leak into it.
  useEffect(() => { endAttempt(); }, []);
  const session = useSession();
  const learning = useLearning();
  const lesson = lessonById(id)!;
  const run = learning.runs.find((r) => r.lesson_id === id);
  const [started, setStarted] = useState(!!run),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [feedback, setFeedback] = useState(""),
    [accepted, setAccepted] = useState(false),
    [paused, setPaused] = useState(false),
    [expanded, setExpanded] = useState(true);
  const [text, setText] = useState(() => {
    try {
      return (
        localStorage.getItem(
          `lesson-draft:${session.me?.id}:${id}:${run?.step ?? 0}`,
        ) ?? ""
      );
    } catch {
      return "";
    }
  });
  const end = useRef<HTMLDivElement>(null);
  const pending = useRef<{
    revision: number;
    requestId: string;
    text?: string;
    choice?: number;
  } | null>(null);
  const step = run?.step ?? 0;
  const exercise = lesson.exercises[Math.min(step, 9)];
  const shownStep = accepted ? Math.max(0, step - 1) : step;
  const shown = lesson.exercises[Math.min(shownStep, 9)];
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [run?.revision, feedback]);
  async function start() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lesson: id, action: "start", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      saveRun(j.run);
      setStarted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start.");
    } finally {
      setBusy(false);
    }
  }
  async function answer(choice?: number) {
    if (!run || busy) return;
    setBusy(true);
    setError("");
    setFeedback("");
    const attempt =
      pending.current?.revision === run.revision
        ? pending.current
        : {
            revision: run.revision,
            requestId: crypto.randomUUID(),
            ...(choice !== undefined ? { choice } : { text }),
          };
    pending.current = attempt;
    try {
      const r = await fetch("/api/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lesson: id, action: "answer", ...attempt }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      const next = j.run as LessonRun;
      saveRun(next);
      pending.current = null;
      setFeedback(next.feedback);
      setAccepted(next.last_pass);
      setText("");
      localStorage.removeItem(`lesson-draft:${session.me?.id}:${id}:${step}`);
      if (next.completed_at) void refreshSession();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not send. Your progress is saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (run?.completed_at) return <LessonFinish lesson={lesson} />;
  if (!started)
    return (
      <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-5 py-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-clay">
          {id === "shape-answers"
            ? "Your first useful moves"
            : "Build on what you know"}
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-2">
          {lesson.outcome.replace("You can", "Learn to")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {lesson.techniques.map((t) => (
            <span
              className="rounded-full border border-line px-3 py-1.5 text-sm"
              key={t}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-2">
          10 small exercises · {lesson.points} points · Pause anytime
        </p>
        <button
          onClick={() => void start()}
          disabled={busy}
          className="learn-primary mt-7 self-start"
        >
          {busy ? "Opening…" : "Start lesson"}
          <Play size={17} />
        </button>
        {error && (
          <p role="alert" className="mt-4 text-bad">
            {error}
          </p>
        )}
        <button
          onClick={() => setLearning({ active: null })}
          className="mt-5 self-start py-2 text-sm text-ink-2"
        >
          Back to learning path
        </button>
      </div>
    );
  const messages = (run?.turns ?? []).filter((t) => t.group === shown.group);
  return (
    <div className="lesson-player flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line px-4 py-3 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium">{lesson.title}</span>
            <button
              onClick={() => setPaused(true)}
              disabled={busy}
              className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm hover:bg-bg-3"
            >
              <Pause size={15} />
              Pause
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Lesson progress"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={step}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-3"
            >
              <div
                className="h-full bg-clay transition-all"
                style={{ width: `${step * 10}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-ink-2">
              {step} of 10
            </span>
          </div>
        </div>
      </div>
      {paused ? (
        <div className="m-auto max-w-md p-6 text-center">
          <Pause size={32} className="mx-auto text-clay" />
          <h2 className="mt-5 text-2xl font-semibold">Take your time.</h2>
          <p className="mt-3 text-ink-2">
            Your completed steps and conversation are saved. There’s no running
            timer in these lessons.
          </p>
          <button
            onClick={() => setPaused(false)}
            className="learn-primary mx-auto mt-6"
          >
            Resume lesson
            <Play size={17} />
          </button>
          <button
            className="mt-4 min-h-11 px-4 text-sm text-ink-2"
            onClick={() => setLearning({ active: null })}
          >
            Save & exit
          </button>
        </div>
      ) : (
        <>
          <div className="lesson-stage shrink-0 border-b border-line bg-bg-2 px-4 py-3 md:px-8">
            <div className="mx-auto max-w-3xl">
              <button
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
                className="flex min-h-10 w-full items-center justify-between gap-2 text-left"
              >
                <span className="text-base font-semibold">{shown.title}</span>
                <ChevronDown
                  size={17}
                  className={expanded ? "rotate-180" : ""}
                />
              </button>
              {expanded && (
                <div className="lesson-instructions pb-2">
                  <span className="mb-2 inline-block rounded-full border border-line-2 px-2 py-0.5 text-xs text-ink-2">
                    {shown.concept}
                  </span>
                  <p className="text-[15px] leading-relaxed">
                    {shown.instruction}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-2">
                    Done when: {shown.criterion}
                  </p>
                  {shown.source && (
                    <details className="mt-3 rounded-xl border border-line bg-bg p-3">
                      <summary className="cursor-pointer text-sm font-medium">
                        Supplied material · AI can read this
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
                        {shown.source}
                      </p>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 md:px-8">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[90%] rounded-2xl bg-user px-4 py-3"
                      : "prose-chat max-w-full"
                  }
                >
                  <div className="mb-1 text-xs font-medium text-ink-2">
                    {m.role === "user"
                      ? "You"
                      : learning.surface === "chatgpt"
                        ? "ChatGPT"
                        : "Claude"}
                  </div>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ))}
              {!accepted && exercise.choices && (
                <div className="space-y-3">
                  {exercise.choices.map((c, i) => (
                    <button
                      className="learn-option"
                      disabled={busy}
                      onClick={() => void answer(i)}
                      key={c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {!messages.length && !exercise.choices && (
                <p className="py-4 text-sm text-ink-2">
                  Use the chat below. There’s more than one good way to ask.
                </p>
              )}
              {busy && (
                <p
                  role="status"
                  className="flex items-center gap-2 text-sm text-ink-2"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-clay" />
                  {exercise.choices
                    ? "Checking…"
                    : "Responding and checking your progress…"}
                </p>
              )}
              {feedback && (
                <div
                  role="status"
                  className={`rounded-xl border p-4 ${accepted ? "border-ok/30 bg-ok/5" : "border-line bg-bg-2"}`}
                >
                  <div className="flex items-start gap-2">
                    {accepted ? (
                      <Check className="shrink-0 text-ok" size={20} />
                    ) : (
                      <Sparkles className="shrink-0 text-clay" size={20} />
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {feedback}
                    </p>
                  </div>
                  {accepted && (
                    <button
                      onClick={() => {
                        setAccepted(false);
                        setFeedback("");
                        setExpanded(true);
                      }}
                      className="learn-primary mt-4"
                    >
                      Continue
                      <ArrowRight size={17} />
                    </button>
                  )}
                </div>
              )}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-bad/30 p-4 text-sm text-bad"
                >
                  {error}
                  <button
                    onClick={() => void answer(pending.current?.choice)}
                    className="ml-3 underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              <div ref={end} />
            </div>
          </div>
          {!exercise.choices && !accepted && (
            <form
              className="mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 pt-2 md:px-8 md:pb-5"
              onSubmit={(e) => {
                e.preventDefault();
                void answer();
              }}
            >
              <div className="rounded-3xl border border-line-2 bg-bg p-3 shadow-sm">
                <label className="sr-only" htmlFor="lesson-message">
                  Message{" "}
                  {learning.surface === "chatgpt" ? "ChatGPT" : "Claude"}
                </label>
                <textarea
                  id="lesson-message"
                  onFocus={() => { if (window.matchMedia("(max-width: 767px)").matches) setExpanded(false); }}
                  rows={2}
                  value={text}
                  disabled={busy}
                  maxLength={3000}
                  onChange={(e) => {
                    setText(e.target.value);
                    pending.current = null;
                    try {
                      localStorage.setItem(
                        `lesson-draft:${session.me?.id}:${id}:${step}`,
                        e.target.value,
                      );
                    } catch {}
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing &&
                      text.trim()
                    ) {
                      e.preventDefault();
                      void answer();
                    }
                  }}
                  placeholder="Ask in your own words…"
                  className="max-h-32 min-h-14 w-full resize-none bg-transparent text-base outline-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-3">
                    Practice chat · supplied context only
                  </span>
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={busy || !text.trim()}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-clay text-white disabled:opacity-40"
                  >
                    <ArrowUp size={20} />
                  </button>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
