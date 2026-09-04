"use client";
/**
 * One client-side store for chats, projects, skills, connectors, settings and the
 * running challenge attempt. Persists to localStorage. Supabase, when configured,
 * holds only identity and scored results; the working set stays in the browser (v0).
 */
import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";
import type { ChatGroup, Schedule, ArenaEvent, ArenaEventType, ArenaResult, Attempt, Chat, CustomSkill, Project, Settings } from "./types";
import { uid } from "./utils";
import type { ConnectorId } from "./connectors";

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
}

const KEY = "human-arena:v1";

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
      localStorage.setItem(KEY, JSON.stringify(rest));
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

export function hydrate() {
  if (state.hydrated || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<State>;
      const chats = (saved.chats ?? []).filter((c) => !c.draft);
      const activeChatId = saved.activeChatId && chats.some((c) => c.id === saved.activeChatId) ? saved.activeChatId : null;
      state = { ...initial, ...saved, chats, activeChatId, groups: saved.groups ?? [], schedules: saved.schedules ?? [], settings: { ...initial.settings, ...(saved.settings ?? {}) }, hydrated: true };
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
  const c: Chat = { id: uid("c"), title, projectId, messages: [], createdAt: now, updatedAt: now, attemptId: state.attempt?.id, draft: true };
  setState((s) => ({ chats: [c, ...s.chats], activeChatId: c.id, activeProjectId: projectId }));
  if (projectId) track("chat_in_project", projectId);
  return c;
}
export function saveMessages(chatId: string, messages: UIMessage[]) {
  setState((s) => ({
    chats: s.chats.map((c) => {
      if (c.id !== chatId) return c;
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
  const c = newChat(sc.projectId, sc.name);
  setState((s) => ({
    chats: s.chats.map((x) => (x.id === c.id ? { ...x, cowork: true, pendingPrompt: sc.prompt, draft: false } : x)),
    schedules: s.schedules.map((x) => (x.id === id ? { ...x, runs: [{ at: new Date().toISOString(), chatId: c.id }, ...x.runs] } : x)),
  }));
  track("schedule_run", id);
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
export function track(type: ArenaEventType, detail?: string) {
  if (!state.attempt) return;
  const ev: ArenaEvent = { type, at: new Date().toISOString(), detail };
  setState((s) => (s.attempt ? { attempt: { ...s.attempt, events: [...s.attempt.events, ev] } } : {}));
}
export function startAttempt(slug: string, serverId?: string): Attempt {
  const a: Attempt = { id: uid("a"), slug, startedAt: new Date().toISOString(), serverId, events: [], hintsUsed: 0, chatIds: [] };
  setState({ attempt: a });
  return a;
}
export function useHint() {
  setState((s) => (s.attempt ? { attempt: { ...s.attempt, hintsUsed: s.attempt.hintsUsed + 1 } } : {}));
  track("hint_used");
}
export function endAttempt(result?: ArenaResult) {
  setState((s) => {
    const a = s.attempt;
    // Any graded challenge closes the threads it ran in; they stay in the sidebar.
    const chats = result && a ? s.chats.map((c) => (c.attemptId === a.id && !c.draft ? { ...c, closed: true } : c)) : s.chats;
    return { attempt: null, chats, results: result ? { ...s.results, [result.slug]: bestOf(s.results[result.slug], result) } : s.results };
  });
}
function bestOf(a: ArenaResult | undefined, b: ArenaResult) {
  if (!a) return b;
  return b.points >= a.points ? b : a;
}
export function importResults(rows: ArenaResult[]) {
  setState((s) => {
    const results = { ...s.results };
    for (const r of rows) results[r.slug] = bestOf(results[r.slug], r);
    return { results };
  });
}
/** Chats created or touched during the running attempt (the submission). */
export function attemptChats(): Chat[] {
  const a = state.attempt;
  if (!a) return [];
  return state.chats.filter((c) => c.attemptId === a.id || c.updatedAt >= a.startedAt);
}
export function totalPoints(results: Record<string, ArenaResult>) {
  return Object.values(results).reduce((n, r) => n + r.points, 0);
}
