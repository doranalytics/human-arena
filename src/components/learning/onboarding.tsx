"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { OptionIcon } from "./option-icon";
import { EXPERIENCE, INTERESTS, MOTIVATIONS } from "@/lib/learning/catalog";
import { refreshSession, useSession } from "@/lib/session";
import { setLearning, useLearning } from "@/lib/learning/client";
import { closeDialog, enterMode, setPage, setPracticeHints } from "@/lib/ui";
import { startPractice } from "@/lib/store";
import { onboardingGoals } from "@/lib/onboarding";
import { MODE_COPY, type GameMode } from "@/lib/game-mode";

interface Draft { step: number; interests: string[]; experience: number; motivation: string[]; mode: GameMode }
const fresh: Draft = { step: 0, interests: [], experience: 0, motivation: [], mode: "playground" };
const TITLES = ["Get better at using AI.", "What would you like to explore?", "How comfortable are you with AI?", "What would better AI skills help you do?", "Where would you like to begin?"];

export function LearningOnboarding({ replay = false, restart = false }: { replay?: boolean; restart?: boolean }) {
  const session = useSession(), learning = useLearning();
  const key = `games-onboarding-v5:${session.me?.id}:${replay ? "review" : "welcome"}`;
  const [d, setD] = useState<Draft>(() => {
    if (restart) return { ...fresh };
    const prefs = replay ? learning.onboarding : null;
    const seed: Draft = prefs ? { ...fresh, interests: prefs.interests ?? [], motivation: onboardingGoals(prefs.motivation), experience: Math.max(0, ["starting", "casual", "daily", "connected", "native"].indexOf(prefs.level ?? "starting")), mode: prefs.mode ?? "playground" } : fresh;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      return saved && Number.isInteger(saved.step) && saved.step >= 0 && saved.step < TITLES.length ? { ...seed, ...saved } : seed;
    } catch { return seed; }
  });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  function change(p: Partial<Draft>) {
    const next = { ...d, ...p }; setD(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }
  const canContinue = d.step === 1 ? d.interests.length > 0 : d.step === 3 ? d.motivation.length > 0 : true;
  async function finish() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product: "claude", interests: d.interests, level: ["starting", "casual", "daily", "connected", "native"][d.experience], motivation: d.motivation, mode: d.mode, commitment: "own-pace", goal: d.interests.includes("Automation") ? "automations" : "everyday" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Could not save your choices.");
      await refreshSession();
      setLearning({ surface: "claude", active: null, onboarding: j.onboarding });
      enterMode(d.mode);
      if (d.mode === "playground" && startPractice("practice-create-skill")) {
        setPracticeHints(true);
        setPage(null);
      }
      try { localStorage.removeItem(key); } catch {}
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your choices."); }
    finally { setBusy(false); }
  }
  const option = (label: string, selected: boolean, onClick: () => void, multiple = false) => <button key={label} type="button" role={multiple ? "checkbox" : undefined} aria-checked={multiple ? selected : undefined} aria-pressed={multiple ? undefined : selected} onClick={onClick} className={`learn-option ${multiple ? "learn-option-multiple" : ""} ${selected ? "selected" : ""}`}><OptionIcon label={label} /><span className="min-w-0 flex-1 font-medium">{label}</span><span className="learn-option-check" aria-hidden="true">{selected && <Check size={14} strokeWidth={3} />}</span></button>;

  return <div className="learning-welcome viewport-overlay fixed inset-0 z-50 flex flex-col bg-bg" data-surface="claude">
    <header className="mx-auto w-full max-w-4xl shrink-0 px-5 py-4 md:px-8 md:py-6">
      <div className="mb-3 flex items-center justify-between gap-4"><span className="text-sm font-semibold">How to AI Games</span><div className="flex items-center gap-3"><span className="text-xs tabular-nums text-ink-3">{d.step + 1} / {TITLES.length}</span>{replay && <button aria-label="Exit onboarding review" className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-2 hover:bg-bg-3" disabled={busy} onClick={() => { closeDialog(); try { localStorage.removeItem(key); } catch {} }}><X size={18} /></button>}</div></div>
      <div className="learn-setup-progress" role="progressbar" aria-label="Onboarding progress" aria-valuemin={0} aria-valuemax={TITLES.length} aria-valuenow={d.step + 1}><div className="learn-setup-progress-fill" style={{ width: `${(d.step + 1) / TITLES.length * 100}%` }} /></div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className={`learn-setup-step games-setup-step mx-auto w-full max-w-2xl px-5 py-4 md:px-8 md:py-8 ${d.step >= 1 && d.step <= 3 ? "games-setup-compact" : ""}`} key={d.step}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-clay">{d.step === 0 ? "Learn by doing" : d.step < 4 ? "Make it yours" : "Your next step"}</p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[38px]">{TITLES[d.step]}</h1>
        <div className="mt-5 space-y-3">
          {d.step === 0 && <>
            <p className="max-w-lg text-lg leading-relaxed text-ink-2">Get hands-on practice with AI, from asking better questions to using tools and building things.</p>
            <div className="grid grid-cols-3 gap-3 pt-4">{[["Better answers", "Ask"], ["Connected information", "Connect"], ["Building tools", "Create"]].map(([icon, label]) => <div key={label} className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-bg-2/40 px-2 py-5"><OptionIcon label={icon} /><span className="text-sm font-semibold">{label}</span></div>)}</div>
            <p className="pt-3 text-sm leading-relaxed text-ink-2">Try it in a familiar chat workspace. No signup needed while we’re testing.</p>
          </>}
          {d.step === 1 && <><p className="text-sm text-ink-2">Choose any that interest you.</p><div className="games-option-grid grid grid-cols-2 gap-2">{INTERESTS.map((x) => option(x, d.interests.includes(x), () => change({ interests: d.interests.includes(x) ? d.interests.filter((i) => i !== x) : [...d.interests, x] }), true))}</div></>}
          {d.step === 2 && <><p className="text-sm text-ink-2">Choose the level that feels closest to you.</p><fieldset className="space-y-2"><legend className="sr-only">AI proficiency</legend>{EXPERIENCE.map((label, i) => <label key={label} className={`learn-option proficiency-option cursor-pointer ${d.experience === i ? "selected" : ""}`}>
            <input className="sr-only" type="radio" name="proficiency" aria-label={`Level ${i + 1}: ${label}`} checked={d.experience === i} onChange={() => change({ experience: i, mode: i >= 3 ? "arena" : "playground" })} />
            <span className="proficiency-bars" aria-hidden="true">{[1, 2, 3, 4, 5].map((bar) => <span key={bar} data-filled={bar <= i + 1} style={{ height: `${8 + bar * 5}px` }} />)}</span>
            <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-3">Level {i + 1}</span><span className="mt-0.5 block text-sm font-medium leading-snug">{label}</span></span>
            <span className="learn-option-check" aria-hidden="true">{d.experience === i && <Check size={14} strokeWidth={3} />}</span>
          </label>)}</fieldset></>}
          {d.step === 3 && <><p className="text-sm text-ink-2">Choose all that apply.</p><div className="games-option-grid grid grid-cols-2 gap-2">{MOTIVATIONS.map((x) => option(x, d.motivation.includes(x), () => change({ motivation: d.motivation.includes(x) ? d.motivation.filter((i) => i !== x) : [...d.motivation, x] }), true))}</div></>}
          {d.step === 4 && <>
            <p className="text-base leading-relaxed text-ink-2">{d.experience >= 3 ? "You already use AI tools. Put them to the test, or explore something new at your own pace." : "Start with guided practice, or jump into a challenge. Both are open to you."}</p>
            {(["playground", "arena"] as const).map((mode) => <button key={mode} type="button" aria-pressed={d.mode === mode} onClick={() => change({ mode })} className={`learn-option games-mode-option ${d.mode === mode ? "selected" : ""}`}><OptionIcon label={MODE_COPY[mode].title} /><span className="min-w-0 flex-1"><span className="block text-xl font-semibold">{MODE_COPY[mode].title}</span><span className="mt-1 block text-sm leading-relaxed text-ink-2">{mode === "playground" ? "Explore prompts and tools with helpful pointers. No timer or points." : "Take on timed challenges, earn points, and compete on the leaderboard."}</span></span><span className="learn-option-check" aria-hidden="true">{d.mode === mode && <Check size={14} strokeWidth={3} />}</span></button>)}
            <p className="pt-2 text-sm text-ink-2">You can explore both whenever you like.</p>
            <p className="text-xs leading-relaxed text-ink-3">Community members can compete for a winner spotlight from Ruben.</p>
          </>}
        </div>
        {error && <p role="alert" className="mt-5 text-bad">{error}</p>}
      </section>
    </div>
    <footer className="shrink-0 border-t border-line bg-bg px-5 py-4 safe-bottom"><div className="mx-auto flex max-w-xl items-center justify-between gap-4">{d.step > 0 ? <button aria-label="Back" disabled={busy} onClick={() => change({ step: d.step - 1 })} className="flex h-12 items-center gap-2 px-3 text-ink-2"><ArrowLeft size={18} /> Back</button> : <span className="text-sm text-ink-2">Explore. Practice. Compete.</span>}<button disabled={!canContinue || busy} onClick={() => d.step === TITLES.length - 1 ? void finish() : change({ step: d.step + 1 })} className="learn-primary">{busy ? "Saving…" : d.step === 0 ? "Get started" : d.step === TITLES.length - 1 ? `Enter ${MODE_COPY[d.mode].title}` : "Continue"}<ArrowRight size={18} /></button></div></footer>
  </div>;
}
