"use client";
/**
 * One client-side store for chats, projects, skills, connectors, settings and the
 * running challenge attempt. Persists to localStorage. Supabase, when configured,
 * holds identity, onboarding, graded attempts and their transcripts; the working
 * set of projects, skills and schedules stays in the browser.
 */
import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";
import type { ChatGroup, Schedule, ArenaEvent, ArenaEventType, ArenaResult, Attempt, Chat, CustomSkill, Project, Settings, TurnContext } from "./types";
import { uid } from "./utils";
import { getChallenge } from "./arena/challenges";
import type { ConnectorId } from "./connectors";
import { recoverWorkspace, clearedWorkspace } from "./workspace-recovery";

export interface State {
  chats: Chat[];
  projects: Project[];
  skills: CustomSkill[];
  connectors: ConnectorId[];
  groups: ChatGroup[];
  schedules: Schedule[];
  settings: Settings;
  attempt: Attempt | null;
  results: Record<string, ArenaResult>;
  activeChatId: string | null;
  activeProjectId: string | null;
  hydrated: boolean;
  latestResult: ArenaResult | null;
  busyChatIds: string[];
  grading: boolean;
  ownerId: string | null;
}

const KEY = "human-arena:v1";
const storageKey = () => state.ownerId ? `${KEY}:member:${state.ownerId}` : KEY;

const initial: State = {
  chats: [],
  groups: [],
  schedules: [],
  projects: [],
  skills: [],
  connectors: [],
  settings: { name: "", product: "claude", model: "fast", effort: "medium" },
  attempt: null,
  results: {},
  activeChatId: null,
  activeProjectId: null,
  hydrated: false,
  latestResult: null, busyChatIds: [], grading: false, ownerId: null,
};

let state: State = initial;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const { hydrated: _h, ...rest } = state;
      void _h;
      localStorage.setItem(storageKey(), JSON.stringify({ ...rest, busyChatIds: [], grading: false }));
    } catch {
      /* quota or private mode: carry on in memory */
    }
  }, 150);
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
}
export function getState() {
  return state;
}

/** Reset only this member's browser workspace, keeping identity and earned progress. */
export function clearWorkspace(scope: "chats" | "workspace") {
  if (state.busyChatIds.length || state.grading) return false;
  setState(clearedWorkspace(state, scope));
  // Save now so an immediate reload cannot bring the cleared workspace back.
  if (saveTimer) clearTimeout(saveTimer);
  try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch { /* in-memory only */ }
  return true;
}

export function hydrate() {
  if (state.hydrated || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = recoverWorkspace(JSON.parse(raw) as Partial<State>);
      const chats = (saved.chats ?? []).filter((c) => !c.draft);
      const activeChatId = saved.activeChatId && chats.some((c) => c.id === saved.activeChatId) ? saved.activeChatId : null;
      state = { ...initial, ...saved, chats, activeChatId, groups: saved.groups ?? [], schedules: saved.schedules ?? [], settings: { ...initial.settings, ...(saved.settings ?? {}) }, busyChatIds: [], grading: false, ownerId: null, hydrated: true };
    } else state = { ...initial, hydrated: true };
  } catch {
    state = { ...initial, hydrated: true };
  }
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const getServer = () => initial;

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(getServer()));
}

/* ------------------------------------------------------------------ chats */
export function newChat(projectId: string | null = null, title = "New chat"): Chat {
  const now = new Date().toISOString();
  if (state.attempt && title === "New chat") title = getChallenge(state.attempt.slug)?.title ?? title;
  const c: Chat = { id: uid("c"), title, projectId, messages: [], createdAt: now, updatedAt: now, attemptId: state.attempt?.id, draft: true };
  setState((s) => ({ chats: [c, ...s.chats], activeChatId: c.id, activeProjectId: projectId }));
  if (projectId) track("chat_in_project", projectId);
  return c;
}
export function saveMessages(chatId: string, messages: UIMessage[]) {
  setState((s) => ({
    chats: s.chats.map((c) => {
      if (c.id !== chatId || c.messages === messages) return c;
      const title = c.title === "New chat" ? titleFrom(messages) : c.title;
      return { ...c, messages, title, updatedAt: new Date().toISOString(), draft: messages.length === 0 ? c.draft : false };
    }),
  }));
}
function titleFrom(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join(" ") ?? "";
  const t = text.replace(/^\/\S+\s*/, "").replace(/\s+/g, " ").trim();
  return t ? (t.length > 42 ? t.slice(0, 40).trimEnd() + "…" : t) : "New chat";
}
export function deleteChat(id: string) {
  setState((s) => ({ chats: s.chats.filter((c) => c.id !== id), activeChatId: s.activeChatId === id ? null : s.activeChatId }));
}
export function renameChat(id: string, title: string) {
  setState((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, title } : c)) }));
  track("chat_renamed", id);
}
export function setChatProject(id: string, projectId: string | null) {
  setState((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, projectId } : c)), activeProjectId: projectId }));
}
export function markCowork(id: string) {
  setState((s) => ({ chats: s.chats.map((c) => (c.id === id && !c.cowork ? { ...c, cowork: true } : c)) }));
}
export function togglePin(id: string) {
  const was = state.chats.find((c) => c.id === id)?.pinned;
  setState((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)) }));
  if (!was) track("chat_pinned", id);
}
export function setArchived(id: string, archived: boolean) {
  setState((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, archived, pinned: archived ? false : c.pinned } : c)), activeChatId: archived && s.activeChatId === id ? null : s.activeChatId }));
}
export function createGroup(name: string): ChatGroup {
  const g: ChatGroup = { id: uid("g"), name: name.trim() || "Group" };
  setState((s) => ({ groups: [...s.groups, g] }));
  return g;
}
export function moveChatToGroup(chatId: string, groupId: string | null) {
  setState((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, groupId } : c)) }));
  if (groupId) track("chat_grouped", groupId);
}
export function createSchedule(sc: Omit<Schedule, "id" | "createdAt" | "runs">): Schedule {
  const x: Schedule = { id: uid("sch"), createdAt: new Date().toISOString(), runs: [], ...sc };
  setState((s) => ({ schedules: [x, ...s.schedules] }));
  track("schedule_created", x.id);
  return x;
}
export function deleteSchedule(id: string) {
  setState((s) => ({ schedules: s.schedules.filter((x) => x.id !== id) }));
}
/** Runs a schedule now: opens a Cowork chat that sends the prompt itself. */
export function runSchedule(id: string): Chat | null {
  const sc = state.schedules.find((x) => x.id === id);
  if (!sc) return null;
  const c = newChat(sc.projectId, state.attempt ? getChallenge(state.attempt.slug)?.title : sc.name);
  setState((s) => ({
    chats: s.chats.map((x) => (x.id === c.id ? { ...x, cowork: true, pendingPrompt: sc.prompt, draft: false } : x)),
    schedules: s.schedules.map((x) => (x.id === id ? { ...x, runs: [{ at: new Date().toISOString(), chatId: c.id }, ...x.runs] } : x)),
  }));

  return c;
}
export function clearPendingPrompt(chatId: string) {
  setState((s) => ({ chats: s.chats.map((c) => (c.id === chatId ? { ...c, pendingPrompt: undefined } : c)) }));
}
export function openChat(id: string | null) {
  const c = id ? state.chats.find((x) => x.id === id) : null;
  setState({ activeChatId: id, activeProjectId: c?.projectId ?? (id ? null : state.activeProjectId) });
}

/* --------------------------------------------------------------- projects */
export function createProject(p: Pick<Project, "name" | "description" | "instructions">): Project {
  const proj: Project = { id: uid("p"), files: [], createdAt: new Date().toISOString(), ...p };
  setState((s) => ({ projects: [proj, ...s.projects], activeProjectId: proj.id, activeChatId: null }));
  track("project_created", proj.id);
  return proj;
}
export function updateProject(id: string, patch: Partial<Project>) {
  setState((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
}
export function addProjectFile(id: string, name: string, text: string) {
  updateProject(id, { files: [...(state.projects.find((p) => p.id === id)?.files ?? []), { id: uid("f"), name, text, size: text.length }] });
  track("project_file_added", name);
}
export function deleteProject(id: string) {
  setState((s) => ({
    projects: s.projects.filter((p) => p.id !== id),
    chats: s.chats.map((c) => (c.projectId === id ? { ...c, projectId: null } : c)),
    activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
  }));
}
export function openProject(id: string | null) {
  setState({ activeProjectId: id, activeChatId: null });
}

/* ----------------------------------------------------------------- skills */
export function createSkill(sk: Omit<CustomSkill, "id">) {
  const s: CustomSkill = { id: uid("s"), createdAt: new Date().toISOString(), ...sk };
  setState((st) => ({ skills: [...st.skills, s] }));
  track("skill_created", s.name);
  return s;
}
export function deleteSkill(id: string) {
  setState((s) => ({ skills: s.skills.filter((x) => x.id !== id) }));
}

/* ------------------------------------------------------------- connectors */
export function setConnector(id: ConnectorId, on: boolean) {
  setState((s) => ({ connectors: on ? Array.from(new Set([...s.connectors, id])) : s.connectors.filter((x) => x !== id) }));
  if (on) track("connector_connected", id);
}

/* --------------------------------------------------------------- settings */
export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ settings: { ...s.settings, ...patch } }));
  if (patch.model) track("model_selected", patch.model);
  if (patch.effort) track("effort_selected", patch.effort);
}
export const FREE_TURNS_PER_DAY = 5;
const today = () => new Date().toISOString().slice(0, 10);
/** Messages left outside a challenge today. */
export function freeTurnsLeft(s: State = state): number {
  const f = s.settings.freeTurns;
  return Math.max(0, FREE_TURNS_PER_DAY - (f && f.day === today() ? f.used : 0));
}
export function consumeFreeTurn() {
  setState((s) => {
    const f = s.settings.freeTurns;
    const used = f && f.day === today() ? f.used : 0;
    return { settings: { ...s.settings, freeTurns: { day: today(), used: used + 1 } } };
  });
}
export function addMemory(fact: string, projectId?: string | null) {
  const f = fact.trim();
  if (!f) return;
  setState((s) => {
    if (projectId) {
      return { projects: s.projects.map((p) => (p.id === projectId && !(p.memories ?? []).includes(f) ? { ...p, memories: [...(p.memories ?? []), f].slice(-50) } : p)) };
    }
    const cur = s.settings.memories ?? [];
    if (cur.includes(f)) return {};
    return { settings: { ...s.settings, memories: [...cur, f].slice(-50) } };
  });
}
export function removeProjectMemory(projectId: string, fact: string) {
  setState((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? { ...p, memories: (p.memories ?? []).filter((m) => m !== fact) } : p)) }));
}
export function removeMemory(fact: string) {
  setState((s) => ({ settings: { ...s.settings, memories: (s.settings.memories ?? []).filter((m) => m !== fact) } }));
}

/* ------------------------------------------------------------------ arena */
export function track(type: ArenaEventType, detail?: string, chatId = state.activeChatId ?? undefined) {
  if (!state.attempt) return;
  const ev: ArenaEvent = { type, at: new Date().toISOString(), detail, chatId };
  setState((s) => (s.attempt ? { attempt: { ...s.attempt, events: [...s.attempt.events, ev] } } : {}));
}
export function startAttempt(slug: string, serverId?: string, startedAt = new Date().toISOString(), version?: string, definition = getChallenge(slug) ?? undefined): Attempt {
  const a: Attempt = { id: uid("a"), slug, startedAt, serverId, version, definition, events: [], hintsUsed: 0, chatIds: [] };
  setState({ attempt: a });
  return a;
}
export function useHint() {
  setState((s) => (s.attempt ? { attempt: { ...s.attempt, hintsUsed: s.attempt.hintsUsed + 1 } } : {}));
  track("hint_used");
}
export function endAttempt(result?: ArenaResult, expectedId = state.attempt?.id) {
  if (!state.attempt || state.attempt.id !== expectedId) return false;
  setState((s) => {
    const a = s.attempt;
    // Any graded challenge closes the threads it ran in; they stay in the sidebar.
    const chats = result && a ? s.chats.map((c) => (c.attemptId === a.id && !c.draft ? { ...c, closed: true } : c)) : s.chats;
    return { attempt: null, grading: false, latestResult: result ?? s.latestResult, activeChatId: null, activeProjectId: null, chats, results: result ? { ...s.results, [result.slug]: bestOf(s.results[result.slug], result) } : s.results };
  });
  return true;
}
function bestOf(a: ArenaResult | undefined, b: ArenaResult) {
  if (!a) return b;
  if (a.passed !== b.passed) return b.passed ? b : a;
  return b.points >= a.points ? b : a;
}
export function importResults(rows: ArenaResult[]) {
  setState((s) => {
    const results = { ...s.results };
    for (const r of rows) results[r.slug] = bestOf(results[r.slug], r);
    return { results };
  });
}
/** Only chats belonging to this attempt can supply its evidence. */
export function attemptChats(): Chat[] {
  const a = state.attempt;
  if (!a) return [];
  return state.chats.filter((c) => c.attemptId === a.id);
}
export function totalPoints(results: Record<string, ArenaResult>) {
  return Object.values(results).reduce((n, r) => n + r.points, 0);
}


export function recordContext(chatId: string, context: TurnContext) {
  setState((s) => ({ chats: s.chats.map((c) => c.id === chatId ? { ...c, contexts: [...(c.contexts ?? []).filter((x) => x.messageId !== context.messageId), context] } : c) }));
}
export function setChatBusy(chatId: string, busy: boolean) {
  if (state.busyChatIds.includes(chatId) === busy) return;
  setState((s) => ({ busyChatIds: busy ? [...s.busyChatIds, chatId] : s.busyChatIds.filter((id) => id !== chatId) }));
}
export function finishScheduleRun(chatId: string) {
  if (!state.attempt || !state.chats.some((c) => c.id === chatId && c.attemptId === state.attempt?.id)) return;
  const schedule = state.schedules.find((x) => x.runs.some((r) => r.chatId === chatId));
  if (schedule && !state.attempt?.events.some((e) => e.type === "schedule_run" && e.chatId === chatId)) track("schedule_run", schedule.id, chatId);
}

/** Keep browser workspaces separate when different accounts use this device. */
export function switchWorkspace(ownerId: string | null) {
  if (state.ownerId === ownerId || typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch { /* in-memory only */ }
  const guest = state.ownerId === null ? state : null;
  let saved: Partial<State> = {};
  try { saved = recoverWorkspace(JSON.parse(localStorage.getItem(ownerId ? `${KEY}:member:${ownerId}` : KEY) ?? "{}")); } catch { /* fresh workspace */ }
  // First sign-in keeps the guest's practice workspace, but only server results enter the account score.
  if (!Object.keys(saved).length && ownerId && guest) saved = { chats: guest.chats, projects: guest.projects, skills: guest.skills, connectors: guest.connectors, settings: guest.settings, groups: guest.groups, schedules: guest.schedules };
  const ownWorkspace = !!ownerId && saved.ownerId === ownerId;
  const activeChatId = ownWorkspace && saved.chats?.some((c) => c.id === saved.activeChatId) ? saved.activeChatId! : null;
  state = { ...initial, ...saved, ownerId, hydrated: true, attempt: ownWorkspace ? saved.attempt ?? null : null, busyChatIds: [], grading: false, activeChatId, activeProjectId: ownWorkspace ? saved.activeProjectId ?? null : null, settings: { ...initial.settings, ...saved.settings } };
  emit();
}
