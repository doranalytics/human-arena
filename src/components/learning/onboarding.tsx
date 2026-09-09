"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { OptionIcon } from "./option-icon";
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
import { onboardingGoals } from "@/lib/onboarding";
interface Draft {
  step: number;
  product: Surface;
  interests: string[];
  experience: number;
  motivation: string[];
  commitment: "daily" | "own-pace";
  start: LessonId;
}
const fresh: Draft = {
  step: 0,
  product: "claude",
  interests: [],
  experience: 0,
  motivation: [],
  commitment: "daily",
  start: "shape-answers",
};
export function LearningOnboarding() {
  const session = useSession();
  const key = `learning-welcome-v1:${session.me?.id}`;
  const [d, setD] = useState<Draft>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
      return { ...fresh, ...saved, motivation: onboardingGoals(saved.motivation) };
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
        ? d.motivation.length > 0
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
      setLearning({ surface: d.product, active: d.start, preferredStart: d.start });
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
    multiple = false,
  ) => (
    <button
      key={label}
      type="button"
      role={multiple ? "checkbox" : undefined}
      aria-checked={multiple ? selected : undefined}
      aria-pressed={multiple ? undefined : selected}
      onClick={fn}
      className={`learn-option ${multiple ? "learn-option-multiple" : ""} ${selected ? "selected" : ""}`}
    >
      <OptionIcon label={label} />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {sub && <span className="mt-1 block text-sm text-ink-2">{sub}</span>}
      </span>
      <span className="learn-option-check" aria-hidden="true">{selected && <Check size={14} strokeWidth={3} />}</span>
    </button>
  );
  return (
    <div
      className="learning-welcome viewport-overlay fixed inset-0 z-50 flex flex-col bg-bg"
      data-surface={d.product}
    >
      <header className="mx-auto w-full max-w-4xl shrink-0 px-5 py-4 md:px-8 md:py-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold">How to AI Games</span>
          <span className="text-xs tabular-nums text-ink-3">{d.step + 1} / 10</span>
        </div>
        <div
          className="learn-setup-progress"
          role="progressbar" aria-label="Onboarding progress" aria-valuemin={0} aria-valuemax={10} aria-valuenow={d.step + 1}
        >
          <div
            className="learn-setup-progress-fill"
            style={{ width: `${(d.step + 1) * 10}%` }}
          />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section
          className="learn-setup-step mx-auto w-full max-w-2xl px-5 py-4 md:px-8 md:py-8"
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
                  {["Practice", "Combine", "Create"].map((label) => {
                    return (
                      <div
                        key={String(label)}
                        className="rounded-2xl border border-line p-4"
                      >
                        <OptionIcon label={label} />
                        <span className="mt-3 block text-sm font-medium">{label}</span>
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
                <OptionIcon label="Progress" />
                <p className="text-lg leading-relaxed text-ink-2">
                  {d.experience < 2
                    ? "You don’t need special vocabulary or the perfect prompt. We’ll introduce one idea, let you try it, then add another."
                    : "We’ll suggest a first lesson based on your experience. You’ll choose where to begin before you start."}
                </p>
              </>
            )}
            {d.step === 5 && <>
              <p className="text-ink-2">Choose all that apply.</p>
              {MOTIVATIONS.map((x) =>
                option(x, d.motivation.includes(x), () => change({ motivation: d.motivation.includes(x) ? d.motivation.filter((goal) => goal !== x) : [...d.motivation, x] }), undefined, true),
              )}
            </>}
            {d.step === 6 && (
              <>
                <OptionIcon label="Streak" />
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
                <div className="flex flex-wrap gap-2" aria-label="Your selected goals">
                  <span className="w-full text-xs font-medium text-ink-3">Your goals</span>
                  {d.motivation.map((goal) => <span key={goal} className="rounded-full border border-line bg-bg-2 px-3 py-1.5 text-sm">{goal}</span>)}
                </div>
                <p className="pt-3 text-ink-2">Based on the interests you selected:</p>
                {learningPromise(d.interests).map(({ interest, outcome }) => (
                  <div
                    key={interest}
                    className="flex items-center gap-4 rounded-xl border border-line p-4"
                  >
                    <OptionIcon label={interest} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{interest}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink-2">{outcome}</span>
                    </span>
                  </div>
                ))}
                <p className="pt-3 text-sm text-ink-2">
                  You’ll start with ten small exercises in core AI techniques, then explore these areas at your own pace.
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
                  You can switch starting points anytime.
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
