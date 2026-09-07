"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { EMAIL_CODE_LENGTH } from "@/lib/email-auth";
import { refreshSession, setSession, useSession } from "@/lib/session";
import { Button, inputCls } from "./dialog";

export type PendingEmailCode = { email: string; sentAt: number };

export function EmailSignIn({ initialEmail = "", pending, onPendingChange, signup = false }: {
  initialEmail?: string;
  pending?: PendingEmailCode | null;
  onPendingChange?: (pending: PendingEmailCode | null) => void;
  signup?: boolean;
}) {
  const session = useSession();
  const id = useId();
  const [email, setEmail] = useState(pending?.email ?? initialEmail);
  const [sentAt, setSentAt] = useState(pending?.sentAt ?? 0);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const codeInput = useRef<HTMLInputElement>(null);
  const sent = sentAt > 0;
  const retryIn = Math.max(0, Math.ceil((sentAt + 60_000 - now) / 1000));

  useEffect(() => {
    if (!sentAt) return;
    codeInput.current?.focus();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sentAt]);

  async function sendCode() {
    setBusy(true); setError("");
    try {
      const normalized = email.trim().toLowerCase();
      const r = await fetch("/api/auth/signin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: normalized }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Could not send your code. Please try again.");
      const at = Date.now();
      setEmail(normalized); setSentAt(at); setNow(at); setToken(""); setVerified(false);
      setSession({ authNotice: undefined });
      onPendingChange?.({ email: normalized, sentAt: at });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send your code. Please try again."); }
    finally { setBusy(false); }
  }

  async function verifyCode() {
    setBusy(true); setError("");
    try {
      if (!verified) {
        const r = await fetch("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, token }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Could not verify your code. Please try again.");
        setVerified(true);
      }
      // A pre-verification profile request may still be in flight. If it was
      // anonymous, fetch once more with the newly written session cookie.
      let current = await refreshSession();
      if (!current.me) current = await refreshSession();
      if (!current.me) throw new Error("Your email is verified. Click Continue to finish loading your account.");
      setSession({ authNotice: undefined });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load your account. Please try again."); }
    finally { setBusy(false); }
  }

  return <div>
    {session.authNotice && !sent && <p role="status" className="mb-3 text-[13px] leading-relaxed text-ink-2">{session.authNotice}</p>}
    {sent ? <form onSubmit={(e) => { e.preventDefault(); if (!busy) void verifyCode(); }}>
      <p role="status" className="text-[14px] leading-relaxed text-ink-2">Enter the code sent to <strong className="break-all font-medium text-ink">{email}</strong>. You can leave this window open while you check your inbox.</p>
      <label className="mt-4 block text-[13px] font-medium" htmlFor={`${id}-code`}>Email code</label>
      <input ref={codeInput} id={`${id}-code`} className={`${inputCls} mt-1.5 font-mono text-lg tracking-[0.3em]`} type="text" inputMode="numeric" autoComplete="one-time-code" pattern={`[0-9]{${EMAIL_CODE_LENGTH}}`} required maxLength={EMAIL_CODE_LENGTH} placeholder="000000" value={token} disabled={busy || verified} aria-describedby={error ? `${id}-error` : undefined} onChange={(e) => { setToken(e.target.value.replace(/\D/g, "").slice(0, EMAIL_CODE_LENGTH)); setError(""); }} />
      <Button className="mt-3 w-full" type="submit" disabled={busy || (!verified && token.length !== EMAIL_CODE_LENGTH)}>{busy ? "Verifying…" : verified ? "Continue" : "Verify email"}<ArrowRight size={15} /></Button>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-2">
        <button type="button" disabled={busy || retryIn > 0 || verified} className="underline underline-offset-2 disabled:no-underline disabled:opacity-50" onClick={() => void sendCode()}>{retryIn ? `Resend in ${retryIn}s` : "Resend code"}</button>
        <button type="button" disabled={busy} className="underline underline-offset-2" onClick={() => { setSentAt(0); setToken(""); setVerified(false); setError(""); onPendingChange?.(null); }}>Use a different email</button>
      </div>
    </form> : <form onSubmit={(e) => { e.preventDefault(); if (!busy) void sendCode(); }}>
      <p className="mb-4 text-[14px] leading-relaxed text-ink-2">{signup ? "Enter your email to create your account. We’ll send a code to enter here." : "Enter your email and we’ll send a code to sign you in."}</p>
      <label className="block text-[13px] font-medium" htmlFor={`${id}-email`}>Your email</label>
      <input id={`${id}-email`} className={`${inputCls} mt-1.5`} required type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={email} disabled={busy} onChange={(e) => setEmail(e.target.value)} />
      <Button className="mt-3 w-full" type="submit" disabled={busy || !session.configured}>{busy ? "Sending…" : signup ? "Sign up" : "Send code"}<ArrowRight size={15} /></Button>
      {signup && <p className="mt-3 text-[12px] leading-relaxed text-ink-3">Already have an account? Use the same email to sign in.</p>}
    </form>}
    {error && <p id={`${id}-error`} role="alert" className="mt-3 text-[13px] text-bad">{error}</p>}
  </div>;
}
