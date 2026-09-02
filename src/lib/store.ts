"use client";
/**
 * One client-side store for chats, projects, skills, connectors, settings and the
 * running challenge attempt. Persists to localStorage. Supabase, when configured,
 * holds only identity and scored results; the working set stays in the browser (v0).
 */
import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";
import type { ArenaEvent, ArenaEventType, ArenaResult, Attempt, Chat, CustomSkill, Project, Settings } from "./types";
import { uid } from "./utils";
import type { ConnectorId } from "./connectors";

export interface State {
  chats: Chat[];
  projects: Project[];
  skills: CustomSkill[];
  connectors: ConnectorId[];
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
      state = { ...initial, ...saved, settings: { ...initial.settings, ...(saved.settings ?? {}) }, hydrated: true };
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
  const c: Chat = { id: uid("c"), title, projectId, messages: [], createdAt: now, updatedAt: now, attemptId: state.attempt?.id };
  setState((s) => ({ chats: [c, ...s.chats], activeChatId: c.id, activeProjectId: projectId }));
  if (projectId) track("chat_in_project", projectId);
  return c;
}
export function saveMessages(chatId: string, messages: UIMessage[]) {
  setState((s) => ({
    chats: s.chats.map((c) => {
      if (c.id !== chatId) return c;
      const title = c.title === "New chat" ? titleFrom(messages) : c.title;
      return { ...c, messages, title, updatedAt: new Date().toISOString() };
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
}
export function togglePin(id: string) {
  setState((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)) }));
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
export function addMemory(fact: string) {
  const f = fact.trim();
  if (!f) return;
  setState((s) => {
    const cur = s.settings.memories ?? [];
    if (cur.includes(f)) return {};
    return { settings: { ...s.settings, memories: [...cur, f].slice(-50) } };
  });
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
  setState((s) => ({ attempt: null, results: result ? { ...s.results, [result.slug]: bestOf(s.results[result.slug], result) } : s.results }));
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
