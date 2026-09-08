"use client";
/** Who is signed in (Supabase), if anyone. Fetched once on load. */
import type { SubscriptionStatus } from "./subscription";
import { useSyncExternalStore } from "react";
import { importResults, switchWorkspace, updateSettings } from "./store";
import type { ArenaResult } from "./types";
import { ONBOARDING_DRAFT_KEY, ONBOARDING_VERSION } from "./onboarding";
import type { PracticeSummary } from "./practice";

export interface Me {
  id: string;
  email: string;
  emailVerified?: boolean;
  guest?: boolean;
  name: string;
  avatar?: string | null;
  linkedin?: string | null;
  x?: string | null;
}
interface SessionState {
  loaded: boolean;
  configured: boolean;
  me: Me | null;
  subscription?: SubscriptionStatus;
  onboardedAt?: string | null;
  onboardingVersion?: number;
  guideSeenAt?: string | null;
  error?: string;
  authNotice?: string;
  practice?: PracticeSummary | null;
}
let s: SessionState = { loaded: false, configured: false, me: null };
const ls = new Set<() => void>();
const sub = (l: () => void) => (ls.add(l), () => void ls.delete(l));
const server: SessionState = { loaded: false, configured: false, me: null };
export function useSession() {
  return useSyncExternalStore(sub, () => s, () => server);
}
export function setSession(p: Partial<SessionState>) {
  s = { ...s, ...p };
  ls.forEach((l) => l());
}

let refreshing: Promise<SessionState> | null = null;
/** Reused after email verification and when the sign-in tab regains focus. */
export function refreshSession(): Promise<SessionState> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const r = await fetch("/api/profile", { cache: "no-store" });
      if (!r.ok) throw new Error("Could not load your progress. Please try again.");
      const j = await r.json() as { configured: boolean; member: Me | null; results: ArenaResult[]; subscription?: SubscriptionStatus; practice?: PracticeSummary | null; onboarding?: { level?: string; goal?: string; version?: number }; onboardedAt?: string | null; guideSeenAt?: string | null };
      switchWorkspace(j.member?.id ?? null);
      if (j.onboardedAt && j.onboarding?.level && j.onboarding.goal) updateSettings({ onboarded: true, onboarding: { level: j.onboarding.level, goal: j.onboarding.goal } });
      if (j.member && j.onboardedAt && (j.onboarding?.version ?? 0) >= ONBOARDING_VERSION) {
        // Returning accounts leave the welcome dialog as soon as the profile
        // loads, without clicking its final button. Clear their used code draft.
        try { localStorage.removeItem(ONBOARDING_DRAFT_KEY); } catch { /* Storage is optional. */ }
      }
      if (j.results?.length) importResults(j.results);
      setSession({ loaded: true, configured: j.configured, me: j.member, subscription: j.subscription, practice: j.practice, onboardedAt: j.onboardedAt, onboardingVersion: j.onboarding?.version ?? 0, guideSeenAt: j.guideSeenAt, error: undefined });
      return s;
    } catch (error) {
      setSession({ loaded: true, error: error instanceof Error ? error.message : "Could not load your account." });
      throw error;
    } finally { refreshing = null; }
  })();
  return refreshing;
}

let refreshingPractice: Promise<void> | null = null;
export function refreshPractice(): Promise<void> {
  if (!s.me) return Promise.resolve();
  if (refreshingPractice) return refreshingPractice;
  const memberId = s.me.id;
  refreshingPractice = (async () => {
    try {
      const response = await fetch("/api/practice", { cache: "no-store" });
      if (!response.ok) throw new Error("Practice unavailable");
      const data = await response.json() as { memberId: string; practice: PracticeSummary };
      if (s.me?.id === memberId && data.memberId === memberId) setSession({ practice: data.practice });
    } catch {
      if (s.me?.id === memberId) setSession({ practice: null });
    } finally { refreshingPractice = null; }
  })();
  return refreshingPractice;
}

export async function dismissChallengeGuide() {
  if (!s.me || s.guideSeenAt) return;
  setSession({ guideSeenAt: new Date().toISOString() });
  try {
    const r = await fetch("/api/onboarding", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "guide_seen" }) });
    if (r.ok) setSession({ guideSeenAt: (await r.json()).guideSeenAt });
  } catch { /* The pointer can return on a later visit if saving was unavailable. */ }
}
