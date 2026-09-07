"use client";
import { useState } from "react";
import { ExternalLink, Check, RefreshCw, Trophy, UserRound } from "lucide-react";
import { useSession, setSession } from "@/lib/session";
import { SUBSCRIBE_URL, SUBSCRIPTION_SETTINGS_URL, WEEKLY_WINNER_COPY, type SubscriptionStatus } from "@/lib/subscription";
import { openDialog } from "@/lib/ui";

export function SubscriptionCard({ compact = false, onboarding = false }: { compact?: boolean; onboarding?: boolean }) {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const paid = session.subscription?.paid;
  const viaSubstack = session.subscription?.sources?.includes("substack");
  const viaCircle = session.subscription?.sources?.includes("circle");
  const offer = onboarding && !paid;
  async function recheck() {
    if (!session.me) { openDialog({ kind: "settings", section: "account" }); return; }
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/subscription", { cache: "no-store" });
      const j = await r.json() as { subscription?: SubscriptionStatus; error?: string };
      if (!r.ok || !j.subscription) throw new Error(j.error ?? "Could not check your subscription.");
      setSession({ subscription: j.subscription });
      setMessage(!j.subscription.available ? "We couldn’t check your access right now. Your last confirmed access is unchanged." : j.subscription.paid ? "Your weekly competition access is confirmed." : "We haven’t confirmed weekly competition access for this email. If you’ve just subscribed, it may take a little while to appear.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <div className={offer ? "rounded-xl border border-clay/30 bg-bg-2/70 p-4" : compact ? "rounded-lg border border-line bg-bg-2/70 px-3.5 py-3" : "rounded-xl border border-line bg-bg-2/70 p-4"}>
    {offer ? <>
      <p className="text-[14px] font-medium">Enter the weekly competition</p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-2">A paid How to AI subscription includes:</p>
      <div className="mt-3 space-y-3 text-[13px] leading-relaxed">
        <div className="flex gap-2.5"><Trophy size={17} className="mt-0.5 shrink-0 text-clay" aria-hidden="true" /><div><p className="font-medium">Compete for the weekly feature.</p><p className="text-ink-2">{WEEKLY_WINNER_COPY}</p></div></div>
        <div className="flex gap-2.5"><UserRound size={17} className="mt-0.5 shrink-0 text-clay" aria-hidden="true" /><div><p className="font-medium">Your full leaderboard profile.</p><p className="text-ink-2">Your name, photo and social links, visible to everyone.</p></div></div>
      </div>
    </> : <>
    <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-[15px] font-medium">{paid && <Check size={16} className="shrink-0 text-ok" />}{paid ? "Weekly competition access" : "Your game account"}</span><span className="shrink-0 rounded-full border border-line-2 px-2 py-0.5 text-[11px] text-ink-2">{paid ? "Included" : "Free"}</span></div>
    <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{paid ? (viaCircle ? "Your existing community membership includes entry to the weekly competition and your full leaderboard profile." : "Your How to AI subscription includes entry to the weekly competition and your full leaderboard profile.") : "Every challenge is free to play. A paid How to AI subscription adds weekly competition entry and your full leaderboard profile."}</p>
    <p className="mt-2 text-[12px] leading-relaxed text-ink-2">{WEEKLY_WINNER_COPY}</p>
    </>}
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
      {(!paid || (viaSubstack && !onboarding)) && <a href={paid ? SUBSCRIPTION_SETTINGS_URL : SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 font-medium text-bg hover:bg-black ${offer ? "w-full" : ""}`}>{paid ? "Manage subscription" : "Subscribe to How to AI"}<ExternalLink size={13} /></a>}
      {offer && <p className="text-[12px] leading-relaxed text-ink-3">Opens Substack. Use the email you signed up with here.</p>}
      <button disabled={busy || !session.loaded} onClick={recheck} className="inline-flex items-center gap-1.5 rounded py-1 text-ink-2 hover:text-ink disabled:opacity-50"><RefreshCw size={13} className={busy ? "animate-spin" : ""} />{busy ? "Checking…" : session.me ? "Check access again" : "Sign in to check access"}</button>
    </div>
    {message && <p role="status" className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{message}</p>}
    {!compact && !paid && <p className="mt-2 text-[12px] text-ink-3">We check existing community memberships and subscriptions automatically using your email.</p>}
  </div>;
}
