"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, X, Compass, Swords } from "lucide-react";
import { OptionIcon } from "./option-icon";
import { EXPERIENCE, INTERESTS, MOTIVATIONS } from "@/lib/learning/catalog";
import { refreshSession, useSession } from "@/lib/session";
import { setLearning, useLearning } from "@/lib/learning/client";
import { closeDialog, enterMode } from "@/lib/ui";
import { onboardingGoals } from "@/lib/onboarding";
import { MODE_COPY, type GameMode } from "@/lib/game-mode";

interface Draft { step: number; interests: string[]; experience: number; motivation: string[]; mode: GameMode }
const fresh: Draft = { step: 0, interests: [], experience: 0, motivation: [], mode: "playground" };
const TITLES = ["Get better at using AI.", "What would you like to explore?", "How do you use AI today?", "What would better AI skills help you do?", "Two ways to put AI to work.", "Where would you like to begin?"];

export function LearningOnboarding({ replay = false, restart = false }: { replay?: boolean; restart?: boolean }) {
  const session = useSession(), learning = useLearning();
  const key = `games-onboarding-v4:${session.me?.id}:${replay ? "review" : "welcome"}`;
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
      <section className={`learn-setup-step games-setup-step mx-auto w-full max-w-2xl px-5 py-4 md:px-8 md:py-8 ${d.step === 1 || d.step === 3 ? "games-setup-compact" : ""}`} key={d.step}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-clay">{d.step === 0 ? "Learn by doing" : d.step < 4 ? "Make it yours" : "Playground & Arena"}</p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[38px]">{TITLES[d.step]}</h1>
        <div className="mt-5 space-y-3">
          {d.step === 0 && <>
            <p className="max-w-lg text-lg leading-relaxed text-ink-2">Discover what AI can do. Try it yourself in a familiar workspace, then take on a challenge when you’re ready.</p>
            <div className="grid grid-cols-2 gap-3 pt-4">{(["playground", "arena"] as const).map((mode) => <div key={mode} className="rounded-2xl border border-line bg-bg-2/40 p-4"><OptionIcon label={MODE_COPY[mode].title} /><span className="mt-3 block font-semibold">{MODE_COPY[mode].title}</span><p className="mt-1 text-sm leading-relaxed text-ink-2">{mode === "playground" ? "Room to explore." : "A challenge to take on."}</p></div>)}</div>
            <p className="pt-3 text-sm text-ink-2">Practice here in a Claude-style workspace. No signup needed while we’re testing.</p>
          </>}
          {d.step === 1 && <><p className="text-sm text-ink-2">Choose any that interest you.</p><div className="games-option-grid grid grid-cols-2 gap-2">{INTERESTS.map((x) => option(x, d.interests.includes(x), () => change({ interests: d.interests.includes(x) ? d.interests.filter((i) => i !== x) : [...d.interests, x] }), true))}</div></>}
          {d.step === 2 && <><p className="text-sm text-ink-2">This helps us suggest a starting place. Neither area is locked.</p>{EXPERIENCE.map((x, i) => option(x, d.experience === i, () => change({ experience: i, mode: i >= 3 ? "arena" : "playground" })))}</>}
          {d.step === 3 && <><p className="text-sm text-ink-2">Choose all that apply.</p><div className="games-option-grid grid grid-cols-2 gap-2">{MOTIVATIONS.map((x) => option(x, d.motivation.includes(x), () => change({ motivation: d.motivation.includes(x) ? d.motivation.filter((i) => i !== x) : [...d.motivation, x] }), true))}</div></>}
          {d.step === 4 && <>
            <p className="text-base leading-relaxed text-ink-2">{d.experience < 2 ? "You can start with help and take things at your own pace." : "You can explore a new feature or put what you know to the test."} Both areas use the same AI workspace.</p>
            <div className="space-y-3 pt-2"><div className="flex gap-4 rounded-2xl border border-line p-4"><OptionIcon label="Playground" /><div><h2 className="font-semibold">Playground</h2><p className="mt-1 text-sm leading-relaxed text-ink-2">Practice prompting and features, with pointers when you need them. No timer or points.</p></div></div><div className="flex gap-4 rounded-2xl border border-clay/30 bg-clay/5 p-4"><OptionIcon label="Arena" /><div><h2 className="font-semibold">Arena</h2><p className="mt-1 text-sm leading-relaxed text-ink-2">Complete timed challenges, earn points, and compete on the leaderboard.</p></div></div></div>
            <p className="pt-1 text-sm leading-relaxed text-ink-2">Community members can also compete for a winner spotlight from Ruben.</p>
          </>}
          {d.step === 5 && <>
            <p className="text-ink-2">{d.experience >= 3 ? "Comfortable with AI already? Try Arena, or explore something new in Playground." : "Playground is a good place to start. Arena is open whenever you want to try it."}</p>
            {(["playground", "arena"] as const).map((mode) => { const Icon = mode === "playground" ? Compass : Swords; return <button key={mode} type="button" aria-pressed={d.mode === mode} onClick={() => change({ mode })} className={`learn-option games-mode-option ${d.mode === mode ? "selected" : ""}`}><OptionIcon label={MODE_COPY[mode].title} /><span className="min-w-0 flex-1"><span className="block text-xl font-semibold">{MODE_COPY[mode].title}</span><span className="mt-1 block text-sm leading-relaxed text-ink-2">{MODE_COPY[mode].description}</span></span><Icon size={19} className="shrink-0 text-ink-3" /></button>; })}
            <p className="pt-2 text-sm text-ink-2">Switch between them anytime from the top of the workspace.</p>
          </>}
        </div>
        {error && <p role="alert" className="mt-5 text-bad">{error}</p>}
      </section>
    </div>
    <footer className="shrink-0 border-t border-line bg-bg px-5 py-4 safe-bottom"><div className="mx-auto flex max-w-xl items-center justify-between gap-4">{d.step > 0 ? <button aria-label="Back" disabled={busy} onClick={() => change({ step: d.step - 1 })} className="flex h-12 items-center gap-2 px-3 text-ink-2"><ArrowLeft size={18} /> Back</button> : <span className="text-sm text-ink-2">Explore. Practice. Compete.</span>}<button disabled={!canContinue || busy} onClick={() => d.step === TITLES.length - 1 ? void finish() : change({ step: d.step + 1 })} className="learn-primary">{busy ? "Saving…" : d.step === 0 ? "Get started" : d.step === TITLES.length - 1 ? `Enter ${MODE_COPY[d.mode].title}` : "Continue"}<ArrowRight size={18} /></button></div></footer>
  </div>;
}
