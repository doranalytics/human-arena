"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "../dialog";
import { updateSettings, useStore } from "@/lib/store";
import { openDialog } from "@/lib/ui";
import { useSession, setSession } from "@/lib/session";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding";
import { Logo } from "../icons";

export function OnboardingDialog() {
  const session = useSession();
  const saved = useStore((s) => s.settings.onboarding);
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({ level: saved?.level ?? "", goal: saved?.goal ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const q = step >= 0 ? ONBOARDING_QUESTIONS[step] : null;
  async function next() {
    if (step < 1) { setStep(step + 1); return; }
    setBusy(true); setError("");
    try {
      if (session.me) {
        const r = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(answers) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Could not save your setup.");
        setSession({ onboardedAt: j.onboardedAt });
      }
      updateSettings({ onboarded: true, onboarding: answers });
      openDialog({ kind: "brief", slug: "ten-words" });
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
    <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="fade-up w-full max-w-md rounded-2xl border border-line bg-bg p-7 shadow-2xl">
      <Logo size={40} tile />
      <h1 id="welcome-title" className="mt-4 font-serif text-[28px] leading-tight">{q?.title ?? "Learn AI by using it."}</h1>
      {!q ? <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Practice with real AI and sample files. Each challenge teaches a useful move, gives you everything you need, and checks the instructions you were shown. Complete the full library to reach AI-Native.</p> :
        <div className="mt-4 space-y-2">{q.options.map((o) => <button key={o.id} onClick={() => setAnswers({ ...answers, [q.id]: o.id })} className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-3 text-left text-[14px] ${answers[q.id] === o.id ? "border-clay bg-clay/5" : "border-line hover:bg-bg-2"}`}>{o.label}{answers[q.id] === o.id && <Check size={16} className="text-clay" />}</button>)}</div>}
      {error && <p role="alert" className="mt-3 text-[13px] text-bad">{error}</p>}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-[12px] text-ink-3">{q ? `${step + 1} of 2 questions` : "No experience needed"}</span>
        <div className="flex gap-2">{step >= 0 && <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={busy}>Back</Button>}<Button onClick={next} disabled={busy || !session.loaded || (!!q && !answers[q.id])}>{busy ? "Saving…" : step === 1 ? "Start learning" : "Continue"}<ArrowRight size={14} /></Button></div>
      </div>
    </div>
  </div>;
}
