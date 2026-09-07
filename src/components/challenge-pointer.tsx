"use client";
import { ArrowUp, X } from "lucide-react";
import { useSession, dismissChallengeGuide } from "@/lib/session";
import { ONBOARDING_VERSION } from "@/lib/onboarding";
import { useUI } from "@/lib/ui";

/** Anchored to the real button, so it follows sidebar and viewport changes. */
export function ChallengePointer() {
  const session = useSession();
  const dialog = useUI((s) => s.dialog);
  if (!session.me || (session.onboardingVersion ?? 0) < ONBOARDING_VERSION || !session.onboardedAt || session.guideSeenAt || dialog) return null;
  return <div role="status" className="absolute right-0 top-full z-40 mt-2 w-60 max-w-[calc(100vw-4rem)]">
    <div className="challenge-pointer mr-10 flex justify-end text-clay" aria-hidden="true"><ArrowUp size={32} strokeWidth={2} /></div>
    <div className="mt-1 rounded-xl border border-line-2 bg-bg p-3 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-medium">Start here when you’re ready</p><button aria-label="Dismiss challenge pointer" onClick={() => void dismissChallengeGuide()} className="-mr-1 rounded p-1 text-ink-3 hover:bg-bg-3"><X size={14} /></button></div>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-2">Click Challenges to choose what you want to learn.</p>
    </div>
  </div>;
}
