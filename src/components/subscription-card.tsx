"use client";
import { useState } from "react";
import { ExternalLink, Check, RefreshCw } from "lucide-react";
import { useSession, setSession } from "@/lib/session";
import { SUBSCRIBE_URL, SUBSCRIPTION_SETTINGS_URL, WEEKLY_WINNER_COPY, type SubscriptionStatus } from "@/lib/subscription";
import { openDialog } from "@/lib/ui";

export function SubscriptionCard({ compact = false }: { compact?: boolean }) {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const paid = session.subscription?.paid;
  const viaSubstack = session.subscription?.sources?.includes("substack");
  const viaCircle = session.subscription?.sources?.includes("circle");
  async function recheck() {
    if (!session.me) { openDialog({ kind: "settings", section: "account" }); return; }
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/subscription", { cache: "no-store" });
      const j = await r.json() as { subscription?: SubscriptionStatus; error?: string };
      if (!r.ok || !j.subscription) throw new Error(j.error ?? "Could not check your subscription.");
      setSession({ subscription: j.subscription });
      setMessage(!j.subscription.available ? "Membership checking is temporarily unavailable. Your last confirmed access is unchanged." : j.subscription.paid ? "Membership confirmed." : "No membership found for this email. Use the same email as your Circle or Substack account. Substack purchases appear after the subscriber list is imported.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <div className={compact ? "rounded-lg border border-line bg-bg-2/70 px-3.5 py-3" : "rounded-xl border border-line bg-bg-2/70 p-4"}>
    <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-[15px] font-medium">{paid && <Check size={16} className="text-ok" />}{paid ? "Premium account" : "Standard account"}</span><span className="rounded-full border border-line-2 px-2 py-0.5 text-[11px] text-ink-2">{paid ? "Confirmed" : "Free"}</span></div>
    <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{paid ? (viaCircle ? "Included with your Circle membership: all challenges and weekly winner eligibility." : "All challenges, saved progress and weekly winner eligibility.") : "All challenges, saved progress and leaderboard points. Upgrade to Premium for weekly winner eligibility."}</p>
    <p className="mt-2 text-[12px] leading-relaxed text-ink-2">{WEEKLY_WINNER_COPY}</p>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
      {(!paid || viaSubstack) && <a href={paid ? SUBSCRIPTION_SETTINGS_URL : SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 font-medium text-bg">{paid ? "Manage on Substack" : "Upgrade on Substack"}<ExternalLink size={13} /></a>}
      <button disabled={busy || !session.loaded} onClick={recheck} className="inline-flex items-center gap-1.5 rounded py-1 text-ink-2 hover:text-ink disabled:opacity-50"><RefreshCw size={13} className={busy ? "animate-spin" : ""} />{busy ? "Checking…" : session.me ? "Check membership" : "Already a member? Sign in"}</button>
    </div>
    {message && <p role="status" className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{message}</p>}
    {!compact && !paid && <p className="mt-2 text-[12px] text-ink-3">Already in Circle? Sign in with your community email. Substack subscribers should use their subscription email.</p>}
  </div>;
}
