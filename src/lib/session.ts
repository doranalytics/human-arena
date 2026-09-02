"use client";
/** Who is signed in (Supabase), if anyone. Fetched once on load. */
import { useSyncExternalStore } from "react";

export interface Me {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}
interface SessionState {
  loaded: boolean;
  configured: boolean;
  me: Me | null;
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
