"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageSquare,
  Layers,
  Target,
  Flame,
  Sparkles,
} from "lucide-react";
import {
  EXPERIENCE,
  INTERESTS,
  MOTIVATIONS,
  learningPromise,
  type LessonId,
  type Surface,
} from "@/lib/learning/catalog";
import { refreshSession, useSession } from "@/lib/session";
import { setLearning } from "@/lib/learning/client";
import { setPage } from "@/lib/ui";
interface Draft {
  step: number;
  product: Surface;
  interests: string[];
  experience: number;
  motivation: string;
  commitment: "daily" | "own-pace";
  start: LessonId;
}
const fresh: Draft = {
  step: 0,
  product: "claude",
  interests: [],
  experience: 0,
  motivation: "",
  commitment: "daily",
  start: "shape-answers",
};
export function LearningOnboarding() {
  const session = useSession();
  const key = `learning-welcome-v1:${session.me?.id}`;
  const [d, setD] = useState<Draft>(() => {
    try {
      return { ...fresh, ...JSON.parse(localStorage.getItem(key) ?? "{}") };
    } catch {
      return fresh;
    }
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function change(p: Partial<Draft>) {
    const next = { ...d, ...p };
    setD(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }
  const titles = [
    "Get better at using AI.",
    "Where do you use AI?",
    "What would you like to do?",
    "How do you use AI today?",
    d.experience < 2
      ? "We’ll start with a few useful moves."
      : "We’ll build on what you know.",
    "What would better AI skills help you do?",
    "One useful win a day.",
    "Here’s what you’ll work toward.",
    "Small moves. Useful combinations.",
    "Where would you like to begin?",
  ];
  const canContinue =
    d.step === 2
      ? d.interests.length > 0
      : d.step === 5
        ? !!d.motivation
        : true;
  async function finish() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: d.product,
          interests: d.interests,
          level: ["starting", "casual", "daily", "connected", "native"][
            d.experience
          ],
          goal: d.interests.includes("Automation") ? "automations" : "everyday",
          motivation: d.motivation,
          commitment: d.commitment,
          start: d.start,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setLearning({ surface: d.product, active: d.start });
      setPage("learning");
      await refreshSession();
      localStorage.removeItem(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save setup.");
    } finally {
      setBusy(false);
    }
  }
  const option = (
    label: string,
    selected: boolean,
    fn: () => void,
    sub?: string,
  ) => (
    <button
      key={label}
      type="button"
      aria-pressed={selected}
      onClick={fn}
      className={`learn-option ${selected ? "selected" : ""}`}
    >
      <span>
        <span className="block font-medium">{label}</span>
        {sub && <span className="mt-1 block text-sm text-ink-2">{sub}</span>}
      </span>
      {selected && <Check size={19} className="shrink-0" />}
    </button>
  );
  return (
    <div
      className="learning-welcome viewport-overlay fixed inset-0 z-50 flex flex-col bg-bg"
      data-surface={d.product}
    >
      <header className="mx-auto flex w-full max-w-4xl shrink-0 items-center gap-5 px-5 py-5 md:px-8 md:py-7">
        <span className="shrink-0 text-sm font-semibold">How to AI Games</span>
        <div
          className="h-1.5 flex-1 rounded-full bg-bg-3"
          aria-label={`Setup step ${d.step + 1} of 10`}
        >
          <div
            className="h-full rounded-full bg-clay transition-all"
            style={{ width: `${(d.step + 1) * 10}%` }}
          />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section
          className="mx-auto w-full max-w-2xl px-5 py-5 md:px-8 md:py-10"
          key={d.step}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-clay">
            {d.step === 0 ? "Learn by doing" : "Your starting point"}
          </p>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight md:text-[40px]">
            {titles[d.step]}
          </h1>
          <div className="mt-6 space-y-3">
            {d.step === 0 && (
              <>
                <p className="max-w-lg text-lg leading-relaxed text-ink-2">
                  Learn a useful move. Try it in a familiar AI workspace. Put
                  the pieces together to do something that matters to you.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[
                    [MessageSquare, "Practice"],
                    [Layers, "Combine"],
                    [Target, "Create"],
                  ].map(([Icon, label]) => {
                    const I = Icon as typeof Target;
                    return (
                      <div
                        key={String(label)}
                        className="rounded-2xl border border-line p-4"
                      >
                        <I size={24} className="mb-3 text-clay" />
                        <span className="text-sm">{String(label)}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="pt-3 text-sm text-ink-2">
                  No account needed for your first lesson.
                </p>
              </>
            )}
            {d.step === 1 && (
              <>
                {option(
                  "ChatGPT",
                  d.product === "chatgpt",
                  () => change({ product: "chatgpt" }),
                  "A clean, familiar chat workspace.",
                )}
                {option(
                  "Claude",
                  d.product === "claude",
                  () => change({ product: "claude" }),
                  "A warm, familiar chat workspace.",
                )}
                <p className="text-sm text-ink-2">
                  Same lessons and progress. You can switch later. This is a
                  training environment, not your connected AI account.
                </p>
              </>
            )}
            {d.step === 2 && (
              <>
                <p className="text-ink-2">Choose any that interest you.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {INTERESTS.map((x) =>
                    option(x, d.interests.includes(x), () =>
                      change({
                        interests: d.interests.includes(x)
                          ? d.interests.filter((i) => i !== x)
                          : [...d.interests, x],
                      }),
                    ),
                  )}
                </div>
              </>
            )}
            {d.step === 3 &&
              EXPERIENCE.map((x, i) =>
                option(x, d.experience === i, () =>
                  change({
                    experience: i,
                    start: i >= 2 ? "better-context" : "shape-answers",
                  }),
                ),
              )}
            {d.step === 4 && (
              <>
                <Sparkles className="my-8 text-clay" size={42} />
                <p className="text-lg leading-relaxed text-ink-2">
                  {d.experience < 2
                    ? "You don’t need special vocabulary or the perfect prompt. We’ll introduce one idea, let you try it, then add another."
                    : "You can skip the first steps and practice combining context, questions, and feedback. Switch to the basics whenever you want."}
                </p>
              </>
            )}
            {d.step === 5 &&
              MOTIVATIONS.map((x) =>
                option(x, d.motivation === x, () => change({ motivation: x })),
              )}
            {d.step === 6 && (
              <>
                <Flame size={34} className="mb-5 text-clay" />
                <p className="pb-3 text-ink-2">
                  Complete a lesson to earn a practice day. Consecutive days
                  build your streak. No daily time target, and you can always
                  keep going.
                </p>
                {option(
                  "I’ll aim for one a day",
                  d.commitment === "daily",
                  () => change({ commitment: "daily" }),
                )}
                {option(
                  "I’ll practice at my own pace",
                  d.commitment === "own-pace",
                  () => change({ commitment: "own-pace" }),
                )}
              </>
            )}
            {d.step === 7 && (
              <>
                <p className="mb-5 text-ink-2">
                  {d.motivation}. Start with a few transferable techniques, then
                  explore what interests you.
                </p>
                {learningPromise(d.interests).map((x, i) => (
                  <div
                    key={x}
                    className="flex items-center gap-4 rounded-xl border border-line p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-3 text-sm">
                      {i + 1}
                    </span>
                    <span>{x}</span>
                  </div>
                ))}
                <p className="pt-3 text-sm text-ink-2">
                  Your first lesson includes ten small exercises. Later
                  capabilities are destinations, not a promise of mastery by a
                  deadline.
                </p>
              </>
            )}
            {d.step === 8 && (
              <>
                {[
                  "Learn one useful move",
                  "Practice it with a little help",
                  "Combine it with another move",
                  "Try it independently",
                ].map((x, i) => (
                  <div key={x} className="flex items-center gap-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay/10 font-semibold text-clay">
                      {i + 1}
                    </span>
                    {x}
                  </div>
                ))}
                <p className="pt-3 text-ink-2">
                  Get feedback as you go. Pause anytime. Your progress waits for
                  you.
                </p>
              </>
            )}
            {d.step === 9 && (
              <>
                {option(
                  "Start with the basics",
                  d.start === "shape-answers",
                  () => change({ start: "shape-answers" }),
                  "Shape answers using length, audience, and format.",
                )}
                {option(
                  "Try a harder starting lesson",
                  d.start === "better-context",
                  () => change({ start: "better-context" }),
                  "Combine interviewing, context, and refinement.",
                )}
                <p className="text-sm text-ink-2">
                  {d.experience >= 2
                    ? "The harder lesson is a good starting point for your experience."
                    : "We recommend the basics for your first visit."}{" "}
                  This is a starting choice, not a full placement test.
                </p>
              </>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-5 text-bad">
              {error}
            </p>
          )}
        </section>
      </div>
      <footer className="border-t border-line bg-bg px-5 py-4 safe-bottom">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          {d.step > 0 ? (
            <button
              aria-label="Back"
              disabled={busy}
              onClick={() => change({ step: d.step - 1 })}
              className="flex h-12 items-center gap-2 px-3 text-ink-2"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          ) : (
            <span className="text-sm text-ink-2">At your own pace</span>
          )}
          <button
            disabled={!canContinue || busy}
            onClick={() =>
              d.step === 9 ? void finish() : change({ step: d.step + 1 })
            }
            className="learn-primary"
          >
            {busy
              ? "Saving…"
              : d.step === 0
                ? "Get started"
                : d.step === 9
                  ? "Open my lesson"
                  : "Continue"}
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
