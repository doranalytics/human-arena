"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, MessageSquare, Swords, Trophy, ShieldCheck } from "lucide-react";
import { Button } from "../dialog";
import { updateSettings, useStore } from "@/lib/store";
import { closeDialog, setPage } from "@/lib/ui";
import { useSession, setSession, refreshSession } from "@/lib/session";
import { ONBOARDING_QUESTIONS, ONBOARDING_VERSION, OnboardingSchema } from "@/lib/onboarding";
import { WEEKLY_WINNER_COPY, MEMBERSHIP_UPGRADES_ENABLED } from "@/lib/subscription";
import { SubscriptionCard } from "../subscription-card";
import { Logo } from "../icons";
import { EmailSignIn, type PendingEmailCode } from "../email-signin";

const DRAFT = "howto-ai:onboarding:v2";
type Answers = { level: string; goal: string };
function readDraft(email?: string) {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT) ?? "null");
    const validAnswers = d?.answers && (d.answers.level === "" || OnboardingSchema.shape.level.safeParse(d.answers.level).success) && (d.answers.goal === "" || OnboardingSchema.shape.goal.safeParse(d.answers.goal).success);
    if (d && typeof d.email === "string" && (!email || d.email === email.toLowerCase()) && Date.now() - d.at < 48 * 60 * 60_000 && validAnswers) return d as { email: string; answers: Answers; at: number; method?: "code" };
  } catch { /* Storage is optional; account creation still works. */ }
  return null;
}

export function OnboardingDialog() {
  const session = useSession();
  const saved = useStore((s) => s.settings.onboarding);
  const [draft] = useState(() => readDraft(session.me?.email));
  const [step, setStep] = useState(draft || session.authNotice ? 3 : 0);
  const [answers, setAnswers] = useState<Answers>(draft?.answers ?? { level: saved?.level ?? "", goal: saved?.goal ?? "" });
  const [pending, setPending] = useState<PendingEmailCode | null>(draft?.method === "code" ? { email: draft.email, sentAt: draft.at } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const q = step === 1 || step === 2 ? ONBOARDING_QUESTIONS[step - 1] : null;
  useEffect(() => { heading.current?.focus(); }, [step]);

  function rememberCode(value: PendingEmailCode | null) {
    setPending(value);
    updateSettings({ onboarding: answers });
    try {
      localStorage.setItem(DRAFT, JSON.stringify({ email: value?.email ?? "", answers, at: value?.sentAt ?? Date.now(), method: value ? "code" : undefined }));
    } catch { /* The current form remains usable without local storage. */ }
  }
  async function checkSignIn() {
    setBusy(true); setError("");
    try { await refreshSession(); }
    catch { setError("Could not load your account. Please try again."); }
    finally { setBusy(false); }
  }
  async function next() {
    setError("");
    if (step < 3) { setStep(step + 1); return; }
    if (!session.me) return;
    if (!OnboardingSchema.safeParse(answers).success) { setStep(1); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(answers) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Could not save your setup.");
      updateSettings({ onboarded: true, onboarding: answers });
      try { localStorage.removeItem(DRAFT); } catch { /* Nothing to clear. */ }
      closeDialog(); setPage(null);
      setSession({ onboardedAt: j.onboardedAt, onboardingVersion: ONBOARDING_VERSION, subscription: j.subscription });
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const freeAccount = !!session.me && !session.subscription?.paid;
  const answered = OnboardingSchema.safeParse(answers).success;
  const title = q?.title ?? (step === 0 ? "Learn to use AI." : session.me ? "You’re signed up." : pending ? "Check your email." : answered ? "Sign up to play." : "Sign in to play.");
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="fade-up max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-bg p-6 shadow-2xl sm:p-7" onKeyDown={(e) => {
      if (e.key !== "Tab") return;
      const items = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }}>
      <div className="flex items-center justify-between"><Logo size={34} tile /><span className="text-[12px] text-ink-3">How to AI Games</span></div>
      <h1 ref={heading} tabIndex={-1} id="welcome-title" className="mt-4 font-serif text-[28px] leading-tight outline-none">{title}</h1>
      {step === 0 && <>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">Learn prompting, files, research and AI tools through short, hands-on challenges. No experience or materials needed.</p>
        <div className="my-4 space-y-3 text-[13px]">
          <div className="flex gap-3"><Swords size={17} className="mt-0.5 shrink-0 text-clay" /><p><strong className="font-medium">Choose a skill.</strong> Pick a challenge that interests you.</p></div>
          <div className="flex gap-3"><MessageSquare size={17} className="mt-0.5 shrink-0 text-clay" /><p><strong className="font-medium">Try it yourself.</strong> Use real AI with the files we provide.</p></div>
          <div className="flex gap-3"><Check size={17} className="mt-0.5 shrink-0 text-clay" /><p><strong className="font-medium">See what you learned.</strong> Get feedback against the instructions and earn points.</p></div>
        </div>
        <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-medium"><Trophy size={16} className="text-clay" /> The weekly winner</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{WEEKLY_WINNER_COPY}</p>
          <p className="mt-2 text-[12px] text-ink-3">{MEMBERSHIP_UPGRADES_ENABLED ? "Play for free. After signup, we’ll show you how to enter the weekly competition." : "All challenges are free. Membership upgrades for the weekly competition are coming soon."}</p>
        </div>
        {!session.me && <button className="mt-3 text-[12px] text-ink-2 underline underline-offset-2" onClick={() => setStep(3)}>Already signed up? Sign in</button>}
      </>}
      {q && <div className="mt-4 space-y-2">{q.options.map((o) => <button key={o.id} aria-pressed={answers[q.id] === o.id} onClick={() => setAnswers({ ...answers, [q.id]: o.id })} className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-3 text-left text-[14px] ${answers[q.id] === o.id ? "border-clay bg-clay/5" : "border-line hover:bg-bg-2"}`}>{o.label}{answers[q.id] === o.id && <Check size={16} className="text-clay" />}</button>)}</div>}
      {step === 3 && (session.me ? <>
        <p className="mt-3 flex items-center gap-2 text-[13px]"><ShieldCheck size={17} className="shrink-0 text-ok" /><span className="min-w-0 break-all">Verified: {session.me.email}</span></p>
        <div className="mt-4"><SubscriptionCard compact onboarding /></div>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{!answered ? "One last step: tell us how you’d like to use AI." : freeAccount && MEMBERSHIP_UPGRADES_ENABLED ? "All challenges are free. You can subscribe later." : "You’re all set. The arrow will show you where to choose your first challenge."}</p>
      </> : <div className="mt-4"><EmailSignIn initialEmail={draft?.email} pending={pending} onPendingChange={rememberCode} signup={answered} /></div>)}
      {(error || session.error) && <p role="alert" className="mt-3 text-[13px] text-bad">{error || session.error}</p>}
      {!session.configured && step === 3 && !session.error && <p role="alert" className="mt-3 text-[13px] text-bad">Sign-in is temporarily unavailable. Please try again shortly.</p>}
      {session.error && <Button variant="outline" className="mt-2" onClick={checkSignIn} disabled={busy}>Retry connection</Button>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <span className="text-[12px] text-ink-3">{step === 0 ? session.me ? "No experience needed" : "Sign up to play · Free" : step === 3 ? session.me ? answered ? "Choose a challenge next" : "Finish your setup" : "Email required to play" : `${step} of 2 questions`}</span>
        <div className="flex shrink-0 gap-2">{step > 0 && <Button variant="ghost" onClick={() => { setError(""); setStep(step - 1); }} disabled={busy}>Back</Button>}{(step < 3 || session.me) && <Button variant={step === 3 && freeAccount && MEMBERSHIP_UPGRADES_ENABLED ? "outline" : "primary"} onClick={next} disabled={busy || (!!q && !answers[q.id])}>{busy ? "Saving…" : step === 3 && OnboardingSchema.safeParse(answers).success ? "Start playing" : "Continue"}<ArrowRight size={14} /></Button>}</div>
      </div>
    </div>
  </div>;
}
