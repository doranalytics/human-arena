import test from "node:test";
import assert from "node:assert/strict";
import { ARENA_SLUGS, isArenaChallenge } from "../src/lib/game-mode";
import { CHALLENGES } from "../src/lib/arena/challenges";
import { PRACTICE_EXERCISES, getPractice, practiceChecks } from "../src/lib/playground";
import { getState, setState, startPractice, startAttempt, finishPractice, endAttempt, switchGameMode, newChat, track, saveMessages } from "../src/lib/store";
import { recoverGameMode, recoverWorkspace } from "../src/lib/workspace-recovery";
import { OnboardingSchema } from "../src/lib/onboarding";
import type { ArenaResult, ArenaEvent, Chat } from "../src/lib/types";

const reset = () => setState({ gameMode: "playground", practiceCompleted: {}, chats: [], skills: [], projects: [], schedules: [], attempt: null, results: {}, latestResult: null, grading: false, busyChatIds: [], activeChatId: null, activeProjectId: null });
const reply = (id: string, text = "First request") => saveMessages(id, [{ id: "user", role: "user", parts: [{ type: "text", text }] }, { id: "assistant", role: "assistant", parts: [{ type: "text", text: "Here is the result." }] }]);

test("the curated Arena catalogue excludes prompt-only quizzes and practice exercises", () => {
  assert.equal(new Set(ARENA_SLUGS).size, 6);
  for (const slug of ARENA_SLUGS) {
    const c = CHALLENGES.find((c) => c.slug === slug);
    assert.ok(c);
    assert.ok(c.behaviors.some((b) => b.event !== "message_sent"));
  }
  for (const slug of ["ten-words", "three-audiences", "one-paragraph", ...PRACTICE_EXERCISES.map((e) => e.slug)]) assert.equal(isArenaChallenge(slug), false);
});
test("onboarding saves either mode and supports multiple goals without requiring a daily pledge", () => {
  for (const mode of ["playground", "arena"]) {
    const p = OnboardingSchema.parse({ level: "starting", goal: "everyday", motivation: ["Save time", "Improve my work"], mode });
    assert.equal(p.mode, mode); assert.equal(p.commitment, "own-pace"); assert.equal(p.motivation.length, 2);
  }
});
test("Playground completion stays separate from Arena points and closes the thread", () => {
  reset(); assert.equal(startPractice("practice-files"), true);
  const state = getState(), id = state.activeChatId!;
  assert.equal(state.attempt?.serverId, undefined); assert.equal(state.attempt?.mode, "playground");
  assert.equal(finishPractice(), false);
  track("file_attached", "meeting-notes.txt"); reply(id);
  assert.equal(finishPractice(), true);
  assert.ok(getState().practiceCompleted["practice-files"]);
  assert.deepEqual(getState().results, {});
  assert.equal(getState().attempt, null); assert.equal(getState().activeChatId, null);
  assert.equal(getState().chats[0].closed, true);
});
test("Playground cannot enter the competitive result store, even with a supplied result", () => {
  reset(); startPractice("practice-files");
  const fake = { slug: "practice-files", points: 999, passed: true } as ArenaResult;
  assert.equal(endAttempt(fake), false); assert.deepEqual(getState().results, {});
});
test("creating one skill and using a different skill does not complete practice", () => {
  reset(); startPractice("practice-create-skill");
  const id = getState().activeChatId!;
  setState({ skills: [{ id: "s", name: "mine", description: "Notes", prompt: "Format meeting notes" }] });
  track("skill_created", "mine"); track("file_attached", "meeting-notes.txt"); track("skill_invoked", "meeting-notes"); reply(id);
  assert.equal(finishPractice(), false);
  track("skill_invoked", "mine"); assert.equal(finishPractice(), true);
});
test("mode switching ends the Arena clock, preserves work, and is blocked during a response", () => {
  reset(); startAttempt("hand-it-off", "server-id"); const c = newChat(); reply(c.id);
  setState({ busyChatIds: [c.id] }); assert.equal(switchGameMode("playground"), false); assert.ok(getState().attempt);
  setState({ busyChatIds: [] }); assert.equal(switchGameMode("playground"), true);
  assert.equal(getState().attempt, null); assert.equal(getState().gameMode, "playground"); assert.equal(getState().chats[0].closed, true);
  assert.deepEqual(getState().results, {});
});
test("old prompt attempts are closed on upgrade; untimed practice survives long absences", () => {
  reset(); startPractice("practice-files");
  const old = { ...getState(), attempt: { ...getState().attempt!, startedAt: "2020-01-01T00:00:00Z" } };
  assert.equal(recoverWorkspace(old), old);
  assert.equal(recoverGameMode(old).gameMode, "playground");
  const retired = recoverGameMode({ ...old, attempt: { ...old.attempt, mode: undefined, slug: "ten-words" } });
  assert.equal(retired.attempt, null);
  assert.equal(retired.practiceCompleted, old.practiceCompleted);
});
test("a schedule must be daily and its own test run must finish", () => {
  const c = getPractice("practice-schedule")!;
  const events: ArenaEvent[] = [{ type: "schedule_created", detail: "s", at: "now" }, { type: "schedule_run", detail: "s", chatId: "c", at: "now" }];
  const workspace = { skills: [], projects: [], chats: [{ id: "c", messages: [{ role: "assistant", id: "a", parts: [] }] } as unknown as Chat], schedules: [{ id: "s", name: "Task", prompt: "Task", cadence: "weekly" as const, projectId: null, createdAt: "now", runs: [] }] };
  assert.equal(practiceChecks(c, events, workspace).every((x) => x.pass), false);
  assert.equal(practiceChecks(c, events, { ...workspace, schedules: [{ ...workspace.schedules[0], cadence: "daily" }] }).every((x) => x.pass), true);
});
