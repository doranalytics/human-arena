import test from "node:test";
import assert from "node:assert/strict";
import { recoverWorkspace, clearedWorkspace } from "../src/lib/workspace-recovery";
import { clearWorkspace, getState, setState, switchWorkspace, type State } from "../src/lib/store";
import type { Attempt, Chat } from "../src/lib/types";
const now = Date.parse("2026-09-09T12:00:00Z");
const old = new Date(now - 324 * 60_000).toISOString();
const recent = new Date(now - 30_000).toISOString();
const attempt: Attempt = { id: "a-old", slug: "constraints", startedAt: old, events: [], hintsUsed: 0, chatIds: [] };
const chat: Chat = { id: "old-chat", title: "Constraints", projectId: null, messages: [], createdAt: old, updatedAt: old, attemptId: attempt.id };

test("a 324-minute abandoned attempt does not restart, and its transcript survives", () => {
  const result = recoverWorkspace({ attempt, chats: [chat], activeChatId: chat.id }, now);
  assert.equal(result.attempt, null);
  assert.equal(result.activeChatId, null);
  assert.equal(result.chats?.[0].closed, true);
  assert.equal(result.chats?.[0].title, "Constraints");
});
test("long challenges with recent work and ordinary refreshes are preserved", () => {
  for (const saved of [
    { attempt: { ...attempt, startedAt: recent }, chats: [chat] },
    { attempt, chats: [{ ...chat, updatedAt: recent }] },
    { attempt: { ...attempt, events: [{ type: "hint_used" as const, at: recent }] }, chats: [chat] },
  ]) assert.equal(recoverWorkspace(saved, now), saved);
  assert.equal(recoverWorkspace({ attempt: { ...attempt, startedAt: "invalid" } }, now).attempt, null);
});
test("chat clearing preserves scores, settings and projects; full reset clears all practice objects", () => {
  const state: State = { ...getState(), chats: [chat], attempt, activeChatId: chat.id,
    settings: { ...getState().settings, instructions: "test", memories: ["test"] },
    schedules: [{ id: "s", name: "test", prompt: "test", cadence: "daily", projectId: null, createdAt: old, runs: [{ chatId: chat.id, at: old }] }] };
  const cleared = { ...state, ...clearedWorkspace(state, "chats") };
  assert.equal(cleared.attempt, null);
  assert.deepEqual(cleared.chats, []);
  assert.equal(cleared.results, state.results);
  assert.equal(cleared.projects, state.projects);
  assert.equal(cleared.settings, state.settings);
  assert.equal(cleared.schedules.length, 1);
  assert.deepEqual(cleared.schedules[0].runs, []);
  const reset = { ...state, ...clearedWorkspace(state, "workspace") };
  for (const field of ["chats", "groups", "schedules", "projects", "skills", "connectors"] as const) assert.deepEqual(reset[field], []);
  assert.deepEqual(reset.settings.memories, []);
  assert.equal(reset.settings.instructions, "");
  assert.equal(reset.results, state.results);
});
test("clear persists immediately under only the current member and survives switching away and back", () => {
  const records = new Map<string,string>();
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "localStorage", { value: { getItem: (k: string) => records.get(k) ?? null, setItem: (k: string, v: string) => records.set(k,v) }, configurable: true });
  const otherKey = "human-arena:v1:member:other";
  records.set(otherKey, JSON.stringify({ ownerId: "other", chats: [{...chat,id:"other-chat"}] }));
  setState({ ownerId: "qa", chats: [chat], attempt, grading: true });
  assert.equal(clearWorkspace("chats"), false, "Do not reset during submission");
  setState({ grading: false });
  assert.equal(clearWorkspace("chats"), true);
  assert.deepEqual(JSON.parse(records.get("human-arena:v1:member:qa")!).chats, []);
  assert.equal(JSON.parse(records.get(otherKey)!).chats.length, 1);
  switchWorkspace("other");
  assert.equal(getState().chats.length, 1);
  switchWorkspace("qa");
  assert.equal(getState().attempt, null);
  assert.deepEqual(getState().chats, []);
  // Flush the store's debounce before removing the fake browser.
  clearWorkspace("chats");
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "localStorage");
});
