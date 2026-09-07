import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { readUIMessageStream, type UIMessageChunk, type UIMessage } from "ai";
import { CHALLENGES } from "../src/lib/arena/challenges";

const origin = process.env.VERIFY_ORIGIN ?? "http://localhost:3218";
if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(origin) && origin !== "https://human-arena-kappa.vercel.app") throw new Error("Use the local server or this app's verified production origin");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const email = `arena-qa-${randomUUID()}@example.com`;
const password = randomUUID() + randomUUID();
let uid: string | undefined, member: string | undefined;
let cookies = "";
async function request(path: string, body?: unknown) {
  const r = await fetch(origin + path, { method: body ? "POST" : "GET", headers: { cookie: cookies, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json(); return { r, j };
}
async function main() {
try {
  const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  uid = created.data.user.id;
  const m = await db.from("members").insert({ auth_id: uid, email, pseudonym: "QA verification" }).select("id").single();
  if (m.error) throw m.error;
  member = m.data.id;
  const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => [], setAll: (rows) => { cookies = rows.map((x) => `${x.name}=${x.value}`).join("; "); } } });
  const signIn = await auth.auth.signInWithPassword({ email, password }); if (signIn.error) throw signIn.error;
  const onboarding = await request("/api/onboarding", { level: "casual", goal: "work", is_paid: true });
  assert.equal(onboarding.r.status, 200);
  const profile = await request("/api/profile");
  assert.equal(profile.j.onboarding.goal, "work"); assert.ok(profile.j.onboardedAt); assert.equal(profile.j.subscription.paid, false); assert.equal(profile.j.subscription.available, true);
  console.log("PASS authenticated onboarding saved; Substack source checked; paid flag cannot be self-assigned");
  const { j: attempt } = await request("/api/arena/start", { slug: "ten-words" });
  assert.ok(attempt.serverId && attempt.version);
  const user: UIMessage = { id: randomUUID(), role: "user", parts: [{ type: "text", text: "Explain gravity in exactly ten words. Use this exact explanation: Gravity attracts objects with mass toward one another through spacetime." }] };
  const chatId = randomUUID();
  const response = await fetch(origin + "/api/chat", { method: "POST", headers: { cookie: cookies, "content-type": "application/json" }, body: JSON.stringify({ id: chatId, attemptId: attempt.serverId, challengeSlug: "ten-words", messages: [user], model: "fast", effort: "low", connectors: [], memoryOff: true }) });
  assert.equal(response.status, 200);
  const data = await response.text();
  const chunks = data.split("\n").filter((l) => l.startsWith("data: ") && !l.includes("[DONE]")).map((l) => JSON.parse(l.slice(6))) as UIMessageChunk[];
  const stream = new ReadableStream<UIMessageChunk>({ start(controller) { chunks.forEach((c) => controller.enqueue(c)); controller.close(); } });
  let assistant: UIMessage | undefined;
  for await (const message of readUIMessageStream({ stream })) assistant = message;
  assert.ok(assistant && assistant.parts.some((p) => p.type === "text"));
  const { data: saved } = await db.from("attempt_chats").select("messages,contexts,pending").eq("attempt_id", attempt.serverId).single();
  assert.equal(saved?.pending, false); assert.equal(saved?.contexts[0].memoryOff, true); assert.equal(saved?.messages.length, 2);
  const payload = { slug: "ten-words", ...attempt, hintsUsed: 0, events: [], chats: [{ id: chatId, title: "Constraints", projectId: null, messages: [user, { ...assistant, parts: [{ type: "text", text: "FAKE CLIENT RESPONSE" }] }] }], workspace: { projects: [], skills: [], groups: [], schedules: [] } };
  const wrong = await request("/api/arena/submit", { ...payload, slug: "refine-it" }); assert.equal(wrong.r.status, 404);
  const graded = await request("/api/arena/submit", payload);
  assert.equal(graded.r.status, 200, JSON.stringify(graded.j)); assert.equal(graded.j.result.passed, true, JSON.stringify(graded.j));
  const again = await request("/api/arena/submit", payload); assert.deepEqual(again.j.result, graded.j.result);
  const { count } = await db.from("results").select("id", { count: "exact", head: true }).eq("attempt_id", attempt.serverId); assert.equal(count, 1);
  const restored = await request("/api/profile"); assert.deepEqual(restored.j.results[0].badges, CHALLENGES[0].badges);
  console.log("PASS server conversation/context saved; wrong challenge rejected; forged client answer ignored; duplicate submission returned one saved grade; badges restored");
  for (const slug of ["pin-it", "add-to-project"]) {
    const { j: a } = await request("/api/arena/start", { slug });
    const id = randomUUID(), at = new Date().toISOString();
    const inserted = await db.from("attempt_chats").insert({ attempt_id: a.serverId, chat_id: id, title: slug, messages: [user, assistant], contexts: [], pending: false });
    if (inserted.error) throw inserted.error;
    const project = { id: "qa-project", name: "QA", files: [], instructions: "", description: "", createdAt: at };
    const pin = slug === "pin-it";
    const completed = await request("/api/arena/submit", { ...a, slug, hintsUsed: 0,
      events: pin ? ["chat_pinned", "chat_renamed"].map((type) => ({ type, detail: id, chatId: id, at })) : [{ type: "added_to_project", detail: project.id, chatId: id, at }],
      chats: [{ id, title: pin ? "Keep" : "Add to a project", projectId: pin ? null : project.id, pinned: pin, messages: [] }],
      workspace: { projects: pin ? [] : [project], skills: [], schedules: [], groups: [] },
    });
    assert.equal(completed.r.status, 200, JSON.stringify(completed.j));
    if (!completed.j.result.passed) {
      const { data: diagnostic } = await db.from("results").select("grade").eq("attempt_id", a.serverId).single();
      console.log(JSON.stringify({ slug, startedAt: a.startedAt, eventAt: at, events: diagnostic?.grade?.events }));
    }
    assert.equal(completed.j.result.passed, true, `${slug}: ${JSON.stringify(completed.j)}`);
  }
  console.log("PASS signed-in grading preserves final rename, pin and project placement");
} finally {
  if (member) { const { error } = await db.from("members").delete().eq("id", member); if (error) throw error; }
  if (uid) { const { error } = await db.auth.admin.deleteUser(uid); if (error) throw error; }
  console.log("Temporary QA account and rows removed");
}

}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Verification failed"); process.exitCode = 1; });
