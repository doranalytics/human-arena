"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Mail, MessageSquare, Swords, Trophy, ShieldCheck } from "lucide-react";
import { Button, inputCls } from "../dialog";
import { updateSettings, useStore } from "@/lib/store";
import { closeDialog, setPage } from "@/lib/ui";
import { useSession, setSession, refreshSession } from "@/lib/session";
import { ONBOARDING_QUESTIONS, ONBOARDING_VERSION, OnboardingSchema } from "@/lib/onboarding";
import { WEEKLY_WINNER_COPY } from "@/lib/subscription";
import { SubscriptionCard } from "../subscription-card";
import { Logo } from "../icons";

const DRAFT = "howto-ai:onboarding:v2";
type Answers = { level: string; goal: string };
function readDraft(email?: string) {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT) ?? "null");
    if (d && typeof d.email === "string" && (!email || d.email === email.toLowerCase()) && Date.now() - d.at < 48 * 60 * 60_000 && OnboardingSchema.safeParse(d.answers).success) return d as { email: string; answers: Answers; at: number };
  } catch { /* Storage is optional; account creation still works. */ }
  return null;
}

export function OnboardingDialog() {
  const session = useSession();
  const saved = useStore((s) => s.settings.onboarding);
  const [draft] = useState(() => readDraft(session.me?.email));
  const [step, setStep] = useState(draft ? 3 : 0);
  const [answers, setAnswers] = useState<Answers>(draft?.answers ?? { level: saved?.level ?? "", goal: saved?.goal ?? "" });
  const [email, setEmail] = useState(draft?.email ?? "");
  const [sent, setSent] = useState(!!draft);
  const [busy, setBusy] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const q = step === 1 || step === 2 ? ONBOARDING_QUESTIONS[step - 1] : null;
  const retryIn = Math.max(0, Math.ceil((retryAt - now) / 1000));

  useEffect(() => { heading.current?.focus(); }, [step]);
  useEffect(() => {
    if (!retryAt) return;
    const id = setInterval(() => { const time = Date.now(); setNow(time); if (time >= retryAt) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [retryAt]);
  useEffect(() => {
    if (!sent || session.me) return;
    const check = () => { if (document.visibilityState === "visible") void refreshSession().catch(() => {}); };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => { window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, [sent, session.me]);

  async function sendLink() {
    setBusy(true); setError("");
    try {
      const normalized = email.trim().toLowerCase();
      const r = await fetch("/api/auth/signin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: normalized }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Could not send your sign-in link.");
      setEmail(normalized); setSent(true); setRetryAt(Date.now() + 60_000); setNow(Date.now());
      updateSettings({ onboarding: answers });
      try { localStorage.setItem(DRAFT, JSON.stringify({ email: normalized, answers, at: Date.now() })); } catch { /* Keep the current form. */ }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send the link. Please try again."); }
    finally { setBusy(false); }
  }
  async function checkSignIn() {
    setBusy(true); setError("");
    try {
      const current = await refreshSession();
      if (!current.me && sent) setError("Open the link in your email to verify your account, then return here.");
    } catch { setError("Could not check your sign-in. Please try again."); }
    finally { setBusy(false); }
  }
  async function next() {
    setError("");
    if (step < 3) { setStep(step + 1); return; }
    if (!session.me) return;
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
  const title = q?.title ?? (step === 0 ? "Learn to use AI." : session.me ? freeAccount ? "Ready for the spotlight?" : "You’re ready to compete." : sent ? "Check your inbox." : "Save your progress.");
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
          <p className="mt-2 text-[12px] text-ink-3">Learn for free. Upgrade to Premium to compete for the weekly feature.</p>
        </div>
      </>}
      {q && <div className="mt-4 space-y-2">{q.options.map((o) => <button key={o.id} aria-pressed={answers[q.id] === o.id} onClick={() => setAnswers({ ...answers, [q.id]: o.id })} className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-3 text-left text-[14px] ${answers[q.id] === o.id ? "border-clay bg-clay/5" : "border-line hover:bg-bg-2"}`}>{o.label}{answers[q.id] === o.id && <Check size={16} className="text-clay" />}</button>)}</div>}
      {step === 3 && (session.me ? <>
        <p className="mt-3 flex items-center gap-2 text-[13px]"><ShieldCheck size={17} className="shrink-0 text-ok" /><span className="min-w-0 break-all">Verified: {session.me.email}</span></p>
        <div className="mt-4"><SubscriptionCard compact onboarding /></div>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{freeAccount ? "Standard stays free: every challenge, saved progress and leaderboard points. You can upgrade anytime." : "Your Premium benefits are already included. The arrow will show you where to choose your first challenge."}</p>
      </> : sent ? <div className="mt-4">
        <Mail size={25} className="mb-2 text-clay" />
        <p role="status" className="text-[14px] leading-relaxed text-ink-2">We sent a sign-in link to <strong className="break-all font-medium text-ink">{email}</strong>. Open it to verify your email and save your account.</p>
        <div className="mt-4 flex flex-wrap gap-2"><Button onClick={checkSignIn} disabled={busy}>I’ve verified my email</Button><Button variant="ghost" onClick={sendLink} disabled={busy || retryIn > 0}>{retryIn ? `Resend in ${retryIn}s` : "Resend link"}</Button></div>
        <button className="mt-3 text-[12px] text-ink-2 underline underline-offset-2" onClick={() => { setSent(false); setError(""); }}>Use a different email</button>
      </div> : <form className="mt-4" onSubmit={(e) => { e.preventDefault(); if (!busy) void sendLink(); }}>
        <p className="mb-4 text-[14px] leading-relaxed text-ink-2">Create your free Standard account with an email you actually use. We’ll send a link to verify it. Already have an account? The same link signs you in.</p>
        <label className="block text-[13px] font-medium" htmlFor="onboarding-email">Your email</label>
        <input id="onboarding-email" className={`${inputCls} mt-1.5`} required type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button className="mt-3 w-full" type="submit" disabled={busy || !session.configured}>{busy ? "Sending…" : "Email me a sign-in link"}<Mail size={15} /></Button>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-3">Use your Circle or Substack email if you’re already a member. We’ll check your Premium access automatically.</p>
      </form>)}
      {(error || session.error) && <p role="alert" className="mt-3 text-[13px] text-bad">{error || session.error}</p>}
      {!session.configured && step === 3 && !session.error && <p role="alert" className="mt-3 text-[13px] text-bad">Sign-in is temporarily unavailable. Please try again shortly.</p>}
      {session.error && <Button variant="outline" className="mt-2" onClick={checkSignIn} disabled={busy}>Retry connection</Button>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <span className="text-[12px] text-ink-3">{step === 0 ? "No experience needed" : step === 3 ? session.me ? "Choose a challenge next" : "Verify your email to continue" : `${step} of 2 questions`}</span>
        <div className="flex shrink-0 gap-2">{step > 0 && <Button variant="ghost" onClick={() => { setError(""); setStep(step - 1); }} disabled={busy}>Back</Button>}{(step < 3 || session.me) && <Button variant={step === 3 && freeAccount ? "outline" : "primary"} onClick={next} disabled={busy || (!!q && !answers[q.id])}>{busy ? "Saving…" : step === 3 ? freeAccount ? "Continue free" : "Enter workspace" : "Continue"}<ArrowRight size={14} /></Button>}</div>
      </div>
    </div>
  </div>;
}
