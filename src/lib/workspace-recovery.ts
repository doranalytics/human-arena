import type { State } from "./store";

/** Only applied when reopening saved work, never as a live challenge time limit. */
export function recoverWorkspace(saved: Partial<State>, now = Date.now()): Partial<State> {
  const attempt = saved.attempt;
  if (!attempt) return saved;
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
