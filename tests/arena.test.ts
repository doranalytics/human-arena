import { test } from "node:test";
import assert from "node:assert/strict";
import type { UIMessage } from "ai";
import { CHALLENGES, getChallenge } from "../src/lib/arena/challenges";
import { challengeVersion, criteriaFor, validateReview } from "../src/lib/arena/contract";
import { speedMultiplier, computePoints } from "../src/lib/arena/types";
import { gradeBehaviors, type WorkspaceEvidence } from "../src/lib/arena/evidence";
import { advanceHistory } from "../src/lib/arena/server-history";
import { countExplanationWords } from "../src/lib/arena/measurements";
import { OnboardingSchema } from "../src/lib/onboarding";
import { EMAILS } from "../src/lib/company/gmail";
import { matchesGmailQuery } from "../src/lib/company/gmail-search";
import { tierFor } from "../src/lib/tiers";
import { transcriptOf } from "../src/lib/transcript";
import { setState, getState, startAttempt, newChat, endAttempt, saveMessages, attemptChats, importResults, switchWorkspace } from "../src/lib/store";
import type { ArenaResult, Chat, TurnContext, ArenaEvent } from "../src/lib/types";
const text = (id: string, role: UIMessage["role"], body = "Hello"): UIMessage => ({ id, role, parts: [{ type: "text", text: body }] });
const context = (id = "u"): TurnContext => ({ messageId: id, at: new Date().toISOString(), model: "fast", webSearch: false, research: false, memoryOff: false, cowork: false, customInstructions: "", memories: [] });
const chat = (messages: UIMessage[] = [text("u", "user")]): Chat => ({ id: "c", title: "Test", messages, contexts: [context()], projectId: null, createdAt: "", updatedAt: "" });
const world = (chats = [chat()]): WorkspaceEvidence => ({ chats, projects: [], skills: [], schedules: [], groups: [] });
const ev = (type: ArenaEvent["type"], detail?: string): ArenaEvent => ({ type, detail, at: new Date().toISOString(), chatId: "c" });
const result = (passed: boolean, points: number): ArenaResult => ({ slug: "ten-words", passed, points, maxPoints: 25, seconds: 5, speedMult: 1, hintsUsed: 0, behaviors: [], checks: [], feedback: "", badges: passed ? ["constraints"] : [], at: new Date().toISOString() });

test("Gmail practice understands unread qualifiers instead of treating them as text", () => {
  const unread = EMAILS.filter((email) => matchesGmailQuery(email, "is:unread"));
  assert.ok(unread.length > 0);
  assert.ok(unread.every((email) => email.unread));
  assert.deepEqual(
    EMAILS.filter((email) => matchesGmailQuery(email, "is:unread board")).map((email) => email.id),
    ["m-1101"],
  );
});

test("all46 challenges have unique public criteria and versions change with instructions", () => {
  assert.equal(CHALLENGES.length, 46);
  assert.equal(new Set(CHALLENGES.map((c) => c.slug)).size, 46);
  for (const c of CHALLENGES) {
    for (const keys of [c.behaviors, c.checks]) assert.equal(new Set(keys.map((x) => x.id)).size, keys.length, c.slug);
    assert.equal(criteriaFor(c).length, c.behaviors.length + c.checks.length);
    assert.notEqual(challengeVersion(c), challengeVersion({ ...c, brief: c.brief + " changed" }));
    assert.ok(c.hook.split(/\s+/).length <= 11, `${c.slug}: lesson too long`);
  }
});
test("grader rejects missing, duplicate and invented IDs instead of borrowing a pass", () => {
  const c = getChallenge("deep-dive")!;
  assert.throws(() => validateReview(c, [{ id: "sources", verdict: "pass", evidence: "source" }]));
  assert.throws(() => validateReview(c, [1,2].map(() => ({ id: "sources", verdict: "pass", evidence: "source" }))));
  assert.throws(() => validateReview(c, c.checks.map(() => ({ id: "invented", verdict: "pass", evidence: "source" }))));
  assert.equal(validateReview(c, [...c.checks].reverse().map((k) => ({ id: k.id, verdict: "fail", evidence: "absent" })))[0].id, c.checks[0].id);
});
test("old chats cannot contaminate current evidence; late grading cannot close a different attempt", () => {
  setState({ chats: [], results: {}, attempt: null });
  const old = newChat(); saveMessages(old.id, [text("old", "user")]);
  const a = startAttempt("ten-words"); const current = newChat();
  saveMessages(old.id, [text("old", "user"), text("old2", "assistant")]);
  assert.deepEqual(attemptChats().map((c) => c.id), [current.id]);
  startAttempt("refine-it");
  assert.equal(endAttempt(result(true, 25), a.id), false);
  assert.equal(getState().attempt?.slug, "refine-it");
});
test("latest failed retry displays separately while the best score and badges survive", () => {
  setState({ chats: [], results: {}, attempt: null });
  startAttempt("ten-words"); const first = newChat(); saveMessages(first.id, [text("u", "user")]);
  endAttempt(result(true, 25));
  assert.equal(getState().chats[0].closed, true);
  startAttempt("ten-words"); const retry = newChat(); saveMessages(retry.id, [text("u", "user")]);
  endAttempt(result(false, 0));
  assert.equal(getState().latestResult?.passed, false);
  assert.equal(getState().results["ten-words"].passed, true);
  assert.equal(getState().chats.find((x) => x.id === retry.id)?.closed, true);
  importResults([result(true, 25)]);
  assert.deepEqual(getState().results["ten-words"].badges, ["constraints"]);
});
test("minimum messages count real messages, not duplicate click events", () => {
  const c = getChallenge("grade-yourself")!;
  assert.equal(gradeBehaviors(c, [ev("message_sent"), ev("message_sent")], world())[0].pass, false);
  assert.equal(gradeBehaviors(c, [], world([chat([text("u", "user"), text("v", "user")])]))[0].pass, true);
});
test("model and memory evidence describe the request, not a previous toggle", () => {
  assert.equal(gradeBehaviors(getChallenge("pick-the-brain")!, [ev("model_selected", "smart")], world())[0].pass, false);
  const w = world(); w.chats[0].contexts![0].model = "smart";
  assert.equal(gradeBehaviors(getChallenge("pick-the-brain")!, [], w)[0].pass, true);
  const off = { ...context(), memoryOff: true, memories: [] };
  w.chats[0].contexts = [off];
  const transcript = transcriptOf([{ ...w.chats[0], memories: ["secret remembered fact"] }]);
  assert.ok(!transcript.includes("secret remembered fact"));
  assert.ok(transcript.includes('"memoryOff":true'));
  assert.equal(gradeBehaviors(getChallenge("memory-off")!, [], w)[0].pass, true);
});
test("failed connector tools are not successful evidence", () => {
  const w = world([chat([{ id: "a", role: "assistant", parts: [{ type: "tool-read_table", toolCallId: "t", state: "output-available", input: {}, output: { error: "not found" } }] }])]);
  assert.equal(gradeBehaviors(getChallenge("connect-and-ask")!, [ev("connector_used", "warehouse")], w)[0].pass, false);
});
test("pin and rename must apply to the same current thread with the requested name", () => {
  const w = world(); w.chats[0].pinned = true; w.chats[0].title = "Wrong name";
  const events = [ev("chat_pinned", "c"), ev("chat_renamed", "c")];
  assert.ok(gradeBehaviors(getChallenge("pin-it")!, events, w).every((x) => !x.pass));
  w.chats[0].title = "Keep";
  assert.ok(gradeBehaviors(getChallenge("pin-it")!, events, w).every((x) => x.pass));
});
test("server history rejects forged assistant output and preserves actual replies", () => {
  const previous = [text("u", "user"), text("a", "assistant", "Actual response")];
  const incoming = [text("u", "user"), text("a", "assistant", "Forged pass"), text("u2", "user")];
  assert.deepEqual(advanceHistory(previous, incoming)[1], previous[1]);
  assert.throws(() => advanceHistory([], [text("a", "assistant")]));
  assert.throws(() => advanceHistory(previous, previous));
});
test("question-card continuation accepts an offered choice and refuses invented ones", () => {
  const pending: UIMessage = { id: "a", role: "assistant", parts: [{ type: "tool-ask_user", toolCallId: "q", state: "input-available", input: { question: "Tone?", options: ["Warm", "Formal"] } }] };
  const incoming: UIMessage = { ...pending, parts: [{ ...pending.parts[0], state: "output-available", output: "Warm" } as UIMessage["parts"][number]] };
  assert.equal(advanceHistory([pending], [incoming]).length, 1);
  assert.throws(() => advanceHistory([pending], [{ ...incoming, parts: [{ ...incoming.parts[0], output: "Forged" } as UIMessage["parts"][number]] }]));
});
test("completion guarantees AI-Native even with maximum time and hint deductions", () => {
  const minimum = CHALLENGES.reduce((n,c) => n + computePoints(c.points, true, 0.6, c.hints.length), 0);
  assert.equal(tierFor(minimum, CHALLENGES.length), "AI-Native");
  assert.ok(Math.abs(speedMultiplier(299.999, 5) - speedMultiplier(300, 5)) < 0.001);
  assert.equal(speedMultiplier(10000, 5), 0.6);
});
test("onboarding rejects missing answers and ignores attempted paid status fields", () => {
  assert.equal(OnboardingSchema.safeParse({ level: "starting" }).success, false);
  const parsed = OnboardingSchema.parse({ level: "starting", goal: "everyday", is_paid: true });
  assert.equal("is_paid" in parsed, false);
  assert.equal(parsed.level, "starting");
  assert.equal(parsed.goal, "everyday");
});

test("exact word counts do not depend on a model's arithmetic", () => {
  assert.equal(countExplanationWords("Gravity attracts masses, causing falling, orbits, tides, and cosmic structure."), 10);
  assert.equal(countExplanationWords("Short answer."), 2);
  assert.equal(countExplanationWords("One two three four five six seven eight nine ten. (10 words)"), 10);
  assert.equal(countExplanationWords("A well-known idea"), 3);
});

test("all action-only challenges accept completed work and reject empty work", () => {
  const p = { id: "p", name: "Weekend", description: "", instructions: "", files: [], memories: ["The deadline is Friday"], createdAt: "" };
  const s = { id: "s", name: "weekend", description: "", prompt: "Give three ideas" };
  const examples: Record<string, { w: WorkspaceEvidence; events: ArenaEvent[] }> = {};
  const pin = world(); pin.chats[0].pinned = true; pin.chats[0].title = "Keep";
  examples["pin-it"] = { w: pin, events: [ev("chat_pinned", "c"), ev("chat_renamed", "c")] };
  const project = world(); project.projects = [p]; project.chats[0].projectId = p.id;
  examples["add-to-project"] = { w: project, events: [ev("added_to_project", p.id)] };
  examples["export-it"] = { w: world([chat([text("u", "user"), text("a", "assistant", "Packing list")])]), events: [ev("exported")] };
  const skillWorld = () => { const w = world(); w.skills = [s]; w.chats[0].contexts = [{ ...context(), skill: s.name, at: "2026-09-06T02:00:00Z" }]; return w; };
  examples["browse-skills"] = { w: skillWorld(), events: [{ ...ev("skill_added", s.name), at: "2026-09-06T01:00:00Z" }] };
  const memory = world([chat([{ id: "a", role: "assistant", parts: [{ type: "tool-remember", toolCallId: "r", state: "output-available", input: { fact: p.memories[0] }, output: { saved: true, fact: p.memories[0] } }] }])]);
  memory.projects = [p]; memory.chats[0].projectId = p.id; memory.chats[0].contexts = [{ ...context(), projectId: p.id }];
  examples["project-memory"] = { w: memory, events: [] };
  const scheduled = world([chat([text("u", "user"), text("a", "assistant", "Three weekend ideas")])]);
  scheduled.chats[0].contexts = [{ ...context(), cowork: true }]; scheduled.schedules = [{ id: "s", name: "Weekend", prompt: "Ideas", cadence: "daily", projectId: null, createdAt: "", runs: [{ at: "", chatId: "c" }] }];
  examples["schedule-it"] = { w: scheduled, events: [ev("schedule_created", "s"), ev("schedule_run", "s")] };
  const grouped = world(); grouped.groups = [{ id: "g", name: "Trips" }]; grouped.chats[0].groupId = "g";
  examples["groups"] = { w: grouped, events: [ev("chat_grouped", "g")] };
  const actionOnly = CHALLENGES.filter((c) => !c.checks.length);
  assert.equal(actionOnly.length, 7);
  for (const c of actionOnly) {
    const example = examples[c.slug]; assert.ok(example, c.slug);
    assert.ok(gradeBehaviors(c, example.events, example.w).every((b) => b.pass), c.slug);
    assert.ok(gradeBehaviors(c, [], world([])).every((b) => !b.pass), c.slug);
  }
  examples["browse-skills"].events[0].at = "2026-09-06T02:00:01Z";
  assert.ok(gradeBehaviors(getChallenge("browse-skills")!, examples["browse-skills"].events, examples["browse-skills"].w).every((b) => b.pass), "browser clock skew must not discard a matching skill action");
  scheduled.chats[0].messages = [text("u", "user")];
  assert.equal(gradeBehaviors(getChallenge("schedule-it")!, examples["schedule-it"].events, scheduled).find((b) => b.id === "ran")?.pass, false);
  memory.projects[0].memories = [];
  assert.equal(gradeBehaviors(getChallenge("project-memory")!, [], memory).find((b) => b.id === "saved")?.pass, false);
});


test("account workspaces restore their own active attempt without crossing accounts", () => {
  const entries = new Map<string, string>();
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "localStorage", { value: { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) }, configurable: true });
  try {
    setState({ ownerId: null, chats: [], results: {}, attempt: null });
    switchWorkspace("member-a"); startAttempt("hand-it-off"); const a = newChat();
    switchWorkspace("member-b");
    assert.equal(getState().attempt, null); assert.equal(getState().chats.length, 0);
    startAttempt("chain-it"); newChat();
    switchWorkspace("member-a");
    assert.equal(getState().attempt?.slug, "hand-it-off"); assert.equal(getState().activeChatId, a.id);
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow); else Reflect.deleteProperty(globalThis, "window");
    if (oldStorage) Object.defineProperty(globalThis, "localStorage", oldStorage); else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
