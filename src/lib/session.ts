"use client";
/** Who is signed in (Supabase), if anyone. Fetched once on load. */
import type { SubscriptionStatus } from "./subscription";
import { useSyncExternalStore } from "react";
import { importResults, switchWorkspace, updateSettings } from "./store";
import type { ArenaResult } from "./types";

export interface Me {
  id: string;
  email: string;
  emailVerified?: boolean;
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
      if (!r.ok) throw new Error("Could not load your account. Please try again.");
      const j = await r.json() as { configured: boolean; member: Me | null; results: ArenaResult[]; subscription?: SubscriptionStatus; onboarding?: { level?: string; goal?: string; version?: number }; onboardedAt?: string | null; guideSeenAt?: string | null };
      switchWorkspace(j.member?.id ?? null);
      if (j.onboardedAt && j.onboarding?.level && j.onboarding.goal) updateSettings({ onboarded: true, onboarding: { level: j.onboarding.level, goal: j.onboarding.goal } });
      if (j.results?.length) importResults(j.results);
      setSession({ loaded: true, configured: j.configured, me: j.member, subscription: j.subscription, onboardedAt: j.onboardedAt, onboardingVersion: j.onboarding?.version ?? 0, guideSeenAt: j.guideSeenAt, error: undefined });
      return s;
    } catch (error) {
      setSession({ loaded: true, error: error instanceof Error ? error.message : "Could not load your account." });
      throw error;
    } finally { refreshing = null; }
  })();
  return refreshing;
}

export async function dismissChallengeGuide() {
  if (!s.me || s.guideSeenAt) return;
  setSession({ guideSeenAt: new Date().toISOString() });
  try {
    const r = await fetch("/api/onboarding", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "guide_seen" }) });
    if (r.ok) setSession({ guideSeenAt: (await r.json()).guideSeenAt });
  } catch { /* The pointer can return on a later visit if saving was unavailable. */ }
}
