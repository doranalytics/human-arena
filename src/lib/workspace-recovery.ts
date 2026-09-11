import type { State } from "./store";
import { isArenaChallenge } from "./game-mode";
import { getPractice } from "./playground";

/** Only applied when reopening saved work, never as a live challenge time limit. */
export function recoverWorkspace(saved: Partial<State>, now = Date.now()): Partial<State> {
  const attempt = saved.attempt;
  if (!attempt || attempt.mode === "playground") return saved;
  const timestamps = [attempt.startedAt, ...(attempt.events ?? []).map((e) => e.at),
    ...(saved.chats ?? []).filter((c) => c.attemptId === attempt.id).map((c) => c.updatedAt)];
  const lastActivity = Math.max(0, ...timestamps.map((t) => Date.parse(t)).filter(Number.isFinite));
  if (lastActivity > now - 60 * 60 * 1000 && lastActivity <= now) return saved;
  // Keep the transcript for reference, but do not restart yesterday's clock.
  return { ...saved, attempt: null, grading: false, activeChatId: null, activeProjectId: null,
    chats: (saved.chats ?? []).filter((c) => !c.draft).map((c) => c.attemptId === attempt.id ? { ...c, closed: true } : c) };
}

export function clearedWorkspace(state: State, scope: "chats" | "workspace"): Partial<State> {
  return {
    chats: [], attempt: null, activeChatId: null, activeProjectId: null,
    latestResult: null, busyChatIds: [], grading: false,
    // Runs point at the chats being removed; keep the schedule itself for the narrow reset.
    schedules: scope === "workspace" ? [] : state.schedules.map((s) => ({ ...s, runs: [] })),
    ...(scope === "workspace" ? { projects: [], groups: [], skills: [], gpts: [], connectors: [],
      settings: { ...state.settings, memories: [], instructions: "" } } : {}),
  };
}

/** Migrate entry modes without deleting old chats, scores, or workspace objects. */
export function recoverGameMode(saved: Partial<State>): Partial<State> {
  const a = saved.attempt;
  if (!a) return saved;
  const valid = a.mode === "playground" ? !!getPractice(a.slug) : isArenaChallenge(a.slug);
  if (valid) return { ...saved, gameMode: a.mode === "playground" ? "playground" : "arena" };
  return { ...saved, attempt: null, grading: false, activeChatId: null, activeProjectId: null,
    chats: (saved.chats ?? []).filter((c) => !c.draft).map((c) => c.attemptId === a.id ? { ...c, closed: true, pendingPrompt: undefined } : c) };
}
